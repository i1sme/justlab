// Three.js сцена визуальной лаборатории.
//
// Архитектурная развилка из CLAUDE.md «Lab архитектура»: сцена живёт в собственном
// модуле и грузится лениво (динамический import). Не смешивается с atom-scene и
// molecule-scene; общий с ними — только пакет three.
//
// v1 — минималистичный «школьный кабинет» с упрощённым фоном (запрос пользователя):
//   - стол (плоскость с тёплым серым цветом)
//   - задняя стена-градиент
//   - placeholder-контейнеры как стеклянные цилиндры (полная геометрия посуды — фаза 6b4)
//   - один направленный свет + ambient
//
// Производительность: ≤10 mesh-ей, ≤2k полигонов суммарно — спокойно ≥60 FPS на iGPU.
// Для слабых устройств (reducedQuality) ставим pixelRatio=1 и режем сегменты.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container } from '../../data/types';
import { findSubstance } from '../../data/substances';

export interface MountLabSceneOptions {
	containers: readonly Container[];
	reducedQuality?: boolean;
	motionEnabled?: boolean;
}

export interface LabSceneHandle {
	setMotion(enabled: boolean): void;
	/** Пере-разместить и обновить содержимое контейнеров. */
	setContainers(containers: readonly Container[]): void;
	dispose(): void;
}

/** Цвет «комнаты» — спокойный фон, чтобы не отвлекать от посуды. */
const WALL_COLOR_TOP = 0xe8eef4;
const WALL_COLOR_BOTTOM = 0xc8d2dc;
const TABLE_COLOR = 0xd4cfc6;
const TABLE_EDGE_COLOR = 0x9aa0a6;

const TABLE_W = 4.2;
const TABLE_D = 2.4;
const CONTAINER_SLOT_GAP = 0.7;
/**
 * Контейнеры приподняты на ~5 мм над столом — это убирает z-fighting (две копланарные
 * поверхности дают артефакты-стрипы). Полноценные тени под каждой колбой появятся в 6b4
 * вместе с реальной геометрией посуды (Эрленмейер, стакан, тигель).
 */
const CONTAINER_BASE_Y = 0.005;

export function mountLabScene(
	canvas: HTMLCanvasElement,
	opts: MountLabSceneOptions
): LabSceneHandle {
	const { reducedQuality = false } = opts;
	let motionOn = opts.motionEnabled !== false;

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !reducedQuality && window.devicePixelRatio < 2,
		alpha: false,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedQuality ? 1 : 1.5));
	renderer.setClearColor(WALL_COLOR_TOP, 1);

	const scene = new THREE.Scene();

	// Простой градиентный «фон-стена» через большой задний quad с вертикальным шейдером.
	const backWall = makeGradientWall();
	scene.add(backWall);

	// Стол.
	const tableGroup = makeTable(reducedQuality);
	scene.add(tableGroup);

	// Лампа сверху — направленный свет с мягкой теплотой.
	scene.add(new THREE.AmbientLight(0xffffff, 0.6));
	const dir = new THREE.DirectionalLight(0xffffff, 0.7);
	dir.position.set(2.5, 4, 2);
	dir.castShadow = false; // тени дороги для слабых устройств; имитируем «contact» отдельно
	scene.add(dir);

	// Камера.
	const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
	camera.position.set(0, 1.6, 4.4);
	camera.lookAt(0, 0.4, 0);

	// Контроллер: пользователь может слегка покрутить сцену вокруг центра.
	const controls = new OrbitControls(camera, canvas);
	controls.enablePan = false;
	controls.enableDamping = motionOn;
	controls.target.set(0, 0.4, 0);
	controls.minDistance = 3.0;
	controls.maxDistance = 6.5;
	controls.minPolarAngle = Math.PI * 0.15;
	controls.maxPolarAngle = Math.PI * 0.48;
	controls.minAzimuthAngle = -Math.PI * 0.35;
	controls.maxAzimuthAngle = Math.PI * 0.35;
	controls.update();

	// Контейнеры — храним по id, чтобы переиспользовать mesh при обновлении.
	const containerMeshes = new Map<string, THREE.Object3D>();
	rebuildContainers(opts.containers);

	function resize(): void {
		const w = canvas.clientWidth || 1;
		const h = canvas.clientHeight || 1;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		if (!motionOn) renderer.render(scene, camera);
	}
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	resize();

	let frameId: number | null = null;
	function frame(): void {
		frameId = requestAnimationFrame(frame);
		controls.update();
		renderer.render(scene, camera);
	}
	function startLoop(): void {
		if (frameId !== null) return;
		frame();
	}
	function stopLoop(): void {
		if (frameId !== null) {
			cancelAnimationFrame(frameId);
			frameId = null;
		}
	}

	function onControlsChange(): void {
		renderer.render(scene, camera);
	}

	if (motionOn) {
		startLoop();
	} else {
		controls.addEventListener('change', onControlsChange);
		renderer.render(scene, camera);
	}

	function rebuildContainers(list: readonly Container[]): void {
		// Удаляем mesh-и для пропавших контейнеров.
		const seen = new Set<string>();
		for (const c of list) seen.add(c.id);
		for (const [id, mesh] of containerMeshes) {
			if (!seen.has(id)) {
				disposeObject(mesh);
				scene.remove(mesh);
				containerMeshes.delete(id);
			}
		}

		// Создаём/обновляем mesh-и для каждого контейнера.
		const half = ((list.length - 1) * CONTAINER_SLOT_GAP) / 2;
		list.forEach((c, idx) => {
			let mesh = containerMeshes.get(c.id);
			if (!mesh) {
				mesh = makePlaceholderContainer(reducedQuality);
				scene.add(mesh);
				containerMeshes.set(c.id, mesh);
			}
			mesh.position.set(idx * CONTAINER_SLOT_GAP - half, CONTAINER_BASE_Y, 0);
			updateContainerVisual(mesh, c);
		});
	}

	return {
		setMotion(enabled) {
			if (motionOn === enabled) return;
			motionOn = enabled;
			if (enabled) {
				controls.removeEventListener('change', onControlsChange);
				controls.enableDamping = true;
				startLoop();
			} else {
				stopLoop();
				controls.enableDamping = false;
				controls.addEventListener('change', onControlsChange);
				renderer.render(scene, camera);
			}
		},
		setContainers(list) {
			rebuildContainers(list);
			if (!motionOn) renderer.render(scene, camera);
		},
		dispose() {
			stopLoop();
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const mesh of containerMeshes.values()) disposeObject(mesh);
			containerMeshes.clear();
			disposeObject(tableGroup);
			disposeObject(backWall);
			renderer.dispose();
		}
	};
}

// ============================================================
// Builders
// ============================================================

function makeGradientWall(): THREE.Mesh {
	// Большой quad на заднем плане. Градиент через vertex colors.
	const geo = new THREE.PlaneGeometry(40, 20, 1, 1);
	const colors = new Float32Array(4 * 3);
	const top = new THREE.Color(WALL_COLOR_TOP);
	const bottom = new THREE.Color(WALL_COLOR_BOTTOM);
	// Vertex order in PlaneGeometry: [bl, br, tl, tr] для несегментированного.
	colors.set([bottom.r, bottom.g, bottom.b], 0);
	colors.set([bottom.r, bottom.g, bottom.b], 3);
	colors.set([top.r, top.g, top.b], 6);
	colors.set([top.r, top.g, top.b], 9);
	geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

	const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide });
	const mesh = new THREE.Mesh(geo, mat);
	mesh.position.set(0, 4, -7);
	return mesh;
}

function makeTable(_reducedQuality: boolean): THREE.Group {
	const group = new THREE.Group();

	// Столешница — толстая «плита» (тонкий box).
	// polygonOffset слегка отодвигает столешницу глубже по depth-буферу, чтобы любые
	// стоящие на ней объекты гарантированно рисовались поверх без z-fighting.
	const topGeo = new THREE.BoxGeometry(TABLE_W, 0.08, TABLE_D, 1, 1, 1);
	const topMat = new THREE.MeshStandardMaterial({
		color: TABLE_COLOR,
		roughness: 0.85,
		metalness: 0.05,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1
	});
	const top = new THREE.Mesh(topGeo, topMat);
	top.position.set(0, -0.04, 0);
	group.add(top);

	// Передний кант — небольшое тёмное основание для визуального якоря.
	const edgeGeo = new THREE.BoxGeometry(TABLE_W, 0.5, 0.1, 1, 1, 1);
	const edgeMat = new THREE.MeshStandardMaterial({
		color: TABLE_EDGE_COLOR,
		roughness: 0.7,
		metalness: 0.1
	});
	const edge = new THREE.Mesh(edgeGeo, edgeMat);
	edge.position.set(0, -0.33, TABLE_D / 2);
	group.add(edge);

	return group;
}

function makePlaceholderContainer(reducedQuality: boolean): THREE.Group {
	const group = new THREE.Group();
	// «Стекло» — простой цилиндр с полупрозрачным светло-голубым материалом.
	const segments = reducedQuality ? 16 : 32;
	const glassGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.42, segments, 1, true);
	const glassMat = new THREE.MeshStandardMaterial({
		color: 0xc8e6f5,
		transparent: true,
		opacity: 0.35,
		roughness: 0.05,
		metalness: 0.0,
		side: THREE.DoubleSide
	});
	const glass = new THREE.Mesh(glassGeo, glassMat);
	glass.position.y = 0.21;
	glass.name = 'glass';
	group.add(glass);

	// Дно (диск) — чтобы цилиндр выглядел замкнутым снизу.
	const baseGeo = new THREE.CircleGeometry(0.18, segments);
	const baseMat = new THREE.MeshStandardMaterial({
		color: 0xc8e6f5,
		transparent: true,
		opacity: 0.5,
		roughness: 0.05
	});
	const base = new THREE.Mesh(baseGeo, baseMat);
	base.rotation.x = -Math.PI / 2;
	base.position.y = 0.001;
	group.add(base);

	// Жидкость внутри — отдельный цилиндр меньшего радиуса/высоты, мы будем менять цвет/размер.
	const liquidGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.3, segments);
	const liquidMat = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.0,
		roughness: 0.4
	});
	const liquid = new THREE.Mesh(liquidGeo, liquidMat);
	liquid.position.y = 0.16;
	liquid.name = 'liquid';
	liquid.visible = false;
	group.add(liquid);

	return group;
}

function updateContainerVisual(group: THREE.Object3D, c: Container): void {
	const liquid = group.getObjectByName('liquid') as THREE.Mesh | undefined;
	if (!liquid) return;

	if (c.contents.length === 0) {
		liquid.visible = false;
		return;
	}

	// Берём «верхний» компонент для основного цвета (последний добавленный).
	const total = c.contents.reduce((s, x) => s + x.amount, 0);
	const fillRatio = Math.min(1, total / 4); // максимум 4 «единицы» = полная колба

	const top = c.contents[c.contents.length - 1];
	const sub = findSubstance(top.substanceId);
	const color = sub?.phases[top.phase]?.color ?? '#a8c8e8';
	const mat = liquid.material as THREE.MeshStandardMaterial;
	mat.color.set(color);
	mat.opacity = 0.75;
	mat.transparent = true;
	mat.needsUpdate = true;

	// Высота и Y — масштабируем cylinder под уровень.
	const fullH = 0.3;
	const h = Math.max(0.05, fullH * fillRatio);
	liquid.scale.set(1, h / fullH, 1);
	liquid.position.y = h / 2 + 0.01;
	liquid.visible = true;
}

// ============================================================
// Утилита освобождения ресурсов
// ============================================================

function disposeObject(obj: THREE.Object3D): void {
	obj.traverse((o) => {
		const m = o as THREE.Mesh;
		if (m.geometry) m.geometry.dispose();
		const mat = m.material;
		if (Array.isArray(mat)) {
			for (const x of mat) x.dispose();
		} else if (mat) {
			(mat as THREE.Material).dispose();
		}
	});
}
