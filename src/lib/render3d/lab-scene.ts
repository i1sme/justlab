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
//   - бутылки реактивов на заднем ряду стола (этикетки с формулой)
//   - Raycaster для клика по контейнерам/бутылкам — состояние держит lab-store через колбэки
//
// Производительность: ≤20 mesh-ей, ≤4k полигонов суммарно — спокойно ≥60 FPS на iGPU.
// Для слабых устройств (reducedQuality) ставим pixelRatio=1 и режем сегменты.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container } from '../../data/types';
import { findSubstance } from '../../data/substances';

export interface BottleSpec {
	substanceId: string;
}

export interface MountLabSceneOptions {
	containers: readonly Container[];
	bottles: readonly BottleSpec[];
	/** ID выбранного контейнера — подсвечивается синим кольцом. */
	selectedContainerId?: string | null;
	reducedQuality?: boolean;
	motionEnabled?: boolean;
	/** Клик по контейнеру (raycaster). */
	onContainerClick?: (containerId: string) => void;
	/** Клик по бутылке реактива. */
	onBottleClick?: (substanceId: string) => void;
}

export interface LabSceneHandle {
	setMotion(enabled: boolean): void;
	setContainers(containers: readonly Container[]): void;
	setSelectedContainer(id: string | null): void;
	setBottles(bottles: readonly BottleSpec[]): void;
	dispose(): void;
}

const WALL_COLOR_TOP = 0xe8eef4;
const WALL_COLOR_BOTTOM = 0xc8d2dc;
const TABLE_COLOR = 0xd4cfc6;
const TABLE_EDGE_COLOR = 0x9aa0a6;

const TABLE_W = 4.2;
const TABLE_D = 2.4;
const CONTAINER_SLOT_GAP = 0.7;
const CONTAINER_BASE_Y = 0.005;

const BOTTLE_SLOT_GAP = 0.55;
const BOTTLE_Z = -0.7;
const BOTTLE_BASE_Y = 0.005;

/** Tag в userData чтобы идентифицировать клик-цели после Raycaster.intersect. */
const KIND_BOTTLE = 'bottle';
const KIND_CONTAINER = 'container';

export function mountLabScene(
	canvas: HTMLCanvasElement,
	opts: MountLabSceneOptions
): LabSceneHandle {
	const { reducedQuality = false } = opts;
	let motionOn = opts.motionEnabled !== false;
	let selectedContainerId: string | null = opts.selectedContainerId ?? null;

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !reducedQuality && window.devicePixelRatio < 2,
		alpha: false,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedQuality ? 1 : 1.5));
	renderer.setClearColor(WALL_COLOR_TOP, 1);

	const scene = new THREE.Scene();

	const backWall = makeGradientWall();
	scene.add(backWall);

	const tableGroup = makeTable();
	scene.add(tableGroup);

	scene.add(new THREE.AmbientLight(0xffffff, 0.6));
	const dir = new THREE.DirectionalLight(0xffffff, 0.7);
	dir.position.set(2.5, 4, 2);
	scene.add(dir);

	const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
	camera.position.set(0, 1.6, 4.4);
	camera.lookAt(0, 0.4, 0);

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

	// Map<id, Object3D> — переиспользуем mesh-и при обновлениях, чтобы не пересоздавать.
	const containerMeshes = new Map<string, THREE.Object3D>();
	const bottleMeshes = new Map<string, THREE.Object3D>();
	const clickableObjects: THREE.Object3D[] = [];

	rebuildContainers(opts.containers);
	rebuildBottles(opts.bottles);
	applySelectionHighlight();

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

	if (motionOn) startLoop();
	else {
		controls.addEventListener('change', onControlsChange);
		renderer.render(scene, camera);
	}

	// ---------- Raycaster для кликов ----------
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let downX = 0;
	let downY = 0;

	function onPointerDown(e: PointerEvent): void {
		downX = e.clientX;
		downY = e.clientY;
	}

	function onPointerUp(e: PointerEvent): void {
		const dx = Math.abs(e.clientX - downX);
		const dy = Math.abs(e.clientY - downY);
		// Игнорируем drag (раскрутка камеры) — клик только если палец почти не двигался.
		if (dx > 5 || dy > 5) return;

		const rect = canvas.getBoundingClientRect();
		pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObjects(clickableObjects, true);
		if (hits.length === 0) return;
		const target = findKindedAncestor(hits[0].object);
		if (!target) return;

		if (target.userData.kind === KIND_BOTTLE && target.userData.substanceId) {
			opts.onBottleClick?.(target.userData.substanceId as string);
		} else if (target.userData.kind === KIND_CONTAINER && target.userData.containerId) {
			opts.onContainerClick?.(target.userData.containerId as string);
		}
	}

	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointerup', onPointerUp);

	// ---------- Mutations ----------

	function rebuildContainers(list: readonly Container[]): void {
		const seen = new Set<string>();
		for (const c of list) seen.add(c.id);
		for (const [id, mesh] of containerMeshes) {
			if (!seen.has(id)) {
				removeFromClickables(mesh);
				disposeObject(mesh);
				scene.remove(mesh);
				containerMeshes.delete(id);
			}
		}

		const half = ((list.length - 1) * CONTAINER_SLOT_GAP) / 2;
		list.forEach((c, idx) => {
			let mesh = containerMeshes.get(c.id);
			if (!mesh) {
				mesh = makePlaceholderContainer(reducedQuality, c.id);
				scene.add(mesh);
				containerMeshes.set(c.id, mesh);
				clickableObjects.push(mesh);
			}
			mesh.position.set(idx * CONTAINER_SLOT_GAP - half, CONTAINER_BASE_Y, 0);
			updateContainerVisual(mesh, c);
		});
	}

	function rebuildBottles(list: readonly BottleSpec[]): void {
		const seen = new Set<string>();
		for (const b of list) seen.add(b.substanceId);
		for (const [id, mesh] of bottleMeshes) {
			if (!seen.has(id)) {
				removeFromClickables(mesh);
				disposeObject(mesh);
				scene.remove(mesh);
				bottleMeshes.delete(id);
			}
		}

		const half = ((list.length - 1) * BOTTLE_SLOT_GAP) / 2;
		list.forEach((b, idx) => {
			let mesh: THREE.Object3D | undefined = bottleMeshes.get(b.substanceId);
			if (!mesh) {
				const created = makeBottle(b.substanceId, reducedQuality);
				if (!created) return; // unknown substance — пропускаем
				mesh = created;
				scene.add(mesh);
				bottleMeshes.set(b.substanceId, mesh);
				clickableObjects.push(mesh);
			}
			mesh.position.set(idx * BOTTLE_SLOT_GAP - half, BOTTLE_BASE_Y, BOTTLE_Z);
		});
	}

	function applySelectionHighlight(): void {
		for (const [id, mesh] of containerMeshes) {
			const ring = mesh.getObjectByName('selectionRing') as THREE.Mesh | undefined;
			if (!ring) continue;
			ring.visible = id === selectedContainerId;
		}
		if (!motionOn) renderer.render(scene, camera);
	}

	function removeFromClickables(o: THREE.Object3D): void {
		const idx = clickableObjects.indexOf(o);
		if (idx >= 0) clickableObjects.splice(idx, 1);
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
			applySelectionHighlight();
			if (!motionOn) renderer.render(scene, camera);
		},
		setBottles(list) {
			rebuildBottles(list);
			if (!motionOn) renderer.render(scene, camera);
		},
		setSelectedContainer(id) {
			selectedContainerId = id;
			applySelectionHighlight();
		},
		dispose() {
			stopLoop();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const mesh of containerMeshes.values()) disposeObject(mesh);
			containerMeshes.clear();
			for (const mesh of bottleMeshes.values()) disposeObject(mesh);
			bottleMeshes.clear();
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
	const geo = new THREE.PlaneGeometry(40, 20, 1, 1);
	const colors = new Float32Array(4 * 3);
	const top = new THREE.Color(WALL_COLOR_TOP);
	const bottom = new THREE.Color(WALL_COLOR_BOTTOM);
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

function makeTable(): THREE.Group {
	const group = new THREE.Group();

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

function makePlaceholderContainer(reducedQuality: boolean, containerId: string): THREE.Group {
	const group = new THREE.Group();
	group.userData = { kind: KIND_CONTAINER, containerId };

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

	// Дно — полупрозрачный диск.
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

	// Жидкость — обновляется при changes.
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

	// Selection ring — синее свечение под основанием. Включается через applySelectionHighlight.
	const ringGeo = new THREE.RingGeometry(0.21, 0.27, segments);
	const ringMat = new THREE.MeshBasicMaterial({
		color: 0x2563eb,
		transparent: true,
		opacity: 0.8,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const ring = new THREE.Mesh(ringGeo, ringMat);
	ring.rotation.x = -Math.PI / 2;
	ring.position.y = 0.002;
	ring.name = 'selectionRing';
	ring.visible = false;
	group.add(ring);

	return group;
}

function updateContainerVisual(group: THREE.Object3D, c: Container): void {
	const liquid = group.getObjectByName('liquid') as THREE.Mesh | undefined;
	if (!liquid) return;

	if (c.contents.length === 0) {
		liquid.visible = false;
		return;
	}

	const total = c.contents.reduce((s, x) => s + x.amount, 0);
	const fillRatio = Math.min(1, total / 4);

	const top = c.contents[c.contents.length - 1];
	const sub = findSubstance(top.substanceId);
	const color = sub?.phases[top.phase]?.color ?? '#a8c8e8';
	const mat = liquid.material as THREE.MeshStandardMaterial;
	mat.color.set(color);
	mat.opacity = 0.75;
	mat.transparent = true;
	mat.needsUpdate = true;

	const fullH = 0.3;
	const h = Math.max(0.05, fullH * fillRatio);
	liquid.scale.set(1, h / fullH, 1);
	liquid.position.y = h / 2 + 0.01;
	liquid.visible = true;
}

// ============================================================
// Bottles
// ============================================================

function makeBottle(substanceId: string, reducedQuality: boolean): THREE.Group | null {
	const sub = findSubstance(substanceId);
	if (!sub) return null;

	const group = new THREE.Group();
	group.userData = { kind: KIND_BOTTLE, substanceId };

	const segments = reducedQuality ? 12 : 20;

	// Основное тело бутылки: rounded shoulders. v1 — простой цилиндр + усечённый конус-плечо.
	const bodyH = 0.28;
	const bodyR = 0.09;
	const bodyGeo = new THREE.CylinderGeometry(bodyR, bodyR, bodyH, segments);
	const bottleColor = bottleTintForSubstance(sub.id);
	const bodyMat = new THREE.MeshStandardMaterial({
		color: bottleColor,
		roughness: 0.25,
		metalness: 0.0,
		transparent: true,
		opacity: 0.85
	});
	const body = new THREE.Mesh(bodyGeo, bodyMat);
	body.position.y = bodyH / 2;
	group.add(body);

	// Плечо — конус от радиуса корпуса к радиусу горлышка.
	const shoulderH = 0.05;
	const neckR = 0.045;
	const shoulderGeo = new THREE.CylinderGeometry(neckR, bodyR, shoulderH, segments);
	const shoulder = new THREE.Mesh(shoulderGeo, bodyMat);
	shoulder.position.y = bodyH + shoulderH / 2;
	group.add(shoulder);

	// Горлышко — узкий цилиндр.
	const neckH = 0.06;
	const neckGeo = new THREE.CylinderGeometry(neckR, neckR, neckH, segments);
	const neck = new THREE.Mesh(neckGeo, bodyMat);
	neck.position.y = bodyH + shoulderH + neckH / 2;
	group.add(neck);

	// Крышка — тёмный цилиндр.
	const capH = 0.04;
	const capGeo = new THREE.CylinderGeometry(neckR + 0.01, neckR + 0.01, capH, segments);
	const capMat = new THREE.MeshStandardMaterial({
		color: 0x3a3f4a,
		roughness: 0.55,
		metalness: 0.1
	});
	const cap = new THREE.Mesh(capGeo, capMat);
	cap.position.y = bodyH + shoulderH + neckH + capH / 2;
	group.add(cap);

	// Этикетка — плоский Plane на передней стороне с canvas-текстурой формулы.
	const labelTex = makeLabelTexture(sub.formula);
	const labelMat = new THREE.MeshBasicMaterial({
		map: labelTex,
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const labelW = bodyR * 1.85;
	const labelH = bodyH * 0.55;
	const labelGeo = new THREE.PlaneGeometry(labelW, labelH);
	const label = new THREE.Mesh(labelGeo, labelMat);
	label.position.set(0, bodyH * 0.45, bodyR + 0.001);
	group.add(label);

	// Лёгкая «сидящая» тень — маленький диск под бутылкой.
	const shadowGeo = new THREE.CircleGeometry(bodyR + 0.02, segments);
	const shadowMat = new THREE.MeshBasicMaterial({
		color: 0x000000,
		transparent: true,
		opacity: 0.18,
		depthWrite: false
	});
	const shadow = new THREE.Mesh(shadowGeo, shadowMat);
	shadow.rotation.x = -Math.PI / 2;
	shadow.position.y = 0.001;
	group.add(shadow);

	return group;
}

function bottleTintForSubstance(id: string): number {
	// Простая палитра под характер реактива. Если ничего не подошло — белый цвет.
	if (id.includes('hydrochloric') || id.includes('nitric') || id.includes('sulfuric'))
		return 0xfde68a;
	if (id.includes('hydroxide')) return 0xffffff;
	if (id === 'water') return 0xbfdbfe;
	if (id === 'copper-sulfate') return 0x60a5fa;
	if (id === 'silver-nitrate') return 0xe5e7eb;
	if (id === 'sodium-chloride' || id === 'potassium-chloride') return 0xfafafa;
	// Металлы — серебристые: чтобы не перепутать с прозрачными бутылками.
	const sub = findSubstance(id);
	if (sub?.kind === 'element') return 0xc0c4c8;
	return 0xfafafa;
}

function makeLabelTexture(formula: string): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 128;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#fafafa';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		// Простая «рамка» для эстетики.
		ctx.strokeStyle = '#9ca3af';
		ctx.lineWidth = 4;
		ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
		ctx.fillStyle = '#1f2937';
		ctx.font = 'bold 64px ui-sans-serif, system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(formula, canvas.width / 2, canvas.height / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

// ============================================================
// Helpers
// ============================================================

function findKindedAncestor(o: THREE.Object3D | null): THREE.Object3D | null {
	let cur: THREE.Object3D | null = o;
	while (cur) {
		if (cur.userData?.kind) return cur;
		cur = cur.parent;
	}
	return null;
}

function disposeObject(obj: THREE.Object3D): void {
	obj.traverse((o) => {
		const m = o as THREE.Mesh;
		if (m.geometry) m.geometry.dispose();
		const mat = m.material;
		if (Array.isArray(mat)) {
			for (const x of mat) x.dispose();
		} else if (mat) {
			const matSingle = mat as THREE.Material & { map?: THREE.Texture | null };
			matSingle.map?.dispose();
			matSingle.dispose();
		}
	});
}
