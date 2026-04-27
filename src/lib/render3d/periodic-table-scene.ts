// Three.js сцена 3D-периодической таблицы.
// Принципы (см. CLAUDE.md):
// - Этот модуль грузится лениво, импорт `three` — единственный, идёт в отдельный чанк.
// - 118 карточек = 118 mesh'ей. InstancedMesh здесь не подходит: у каждой карточки уникальный CanvasTexture.
// - Текст бэкаем в маленький canvas (256×256), переводим в CanvasTexture — крестиком cheap, читаемо при умеренном зуме.
// - Adaptive quality: pixelRatio ограничен 1.5; antialias включается только при devicePixelRatio < 2.
// - prefers-reduced-motion → один render() без анимационного цикла.
// - В dispose() освобождаем все GPU-ресурсы (textures, geometry, renderer).

import * as THREE from 'three';
import { ELEMENTS, CATEGORY_COLORS, type PeriodicElement } from '../../data';

const CARD_W = 0.9;
const CARD_H = 0.9;
const CARD_D = 0.1;
const GAP = 0.05;
const STEP_X = CARD_W + GAP;
const STEP_Y = CARD_H + GAP;
/** Дополнительный визуальный отступ между основной таблицей и f-блоком. */
const F_BLOCK_OFFSET = 0.7;
/** Геометрический центр сетки по строкам (для 9 рядов с отступом). */
const ROW_MID = 5.35;

export interface MountSceneOptions {
	onSelect?: (el: PeriodicElement) => void;
	onHover?: (el: PeriodicElement | null) => void;
	/** Снизить качество, если детектор сообщил 'low'. */
	reducedQuality?: boolean;
}

export interface SceneHandle {
	/** Подсветить выбранный элемент (приподнять и навести outline-эффект). */
	setSelected(num: number | null): void;
	/** Освободить все GPU-ресурсы и слушатели. Вызывать при unmount. */
	dispose(): void;
}

export function mountPeriodicTableScene(
	canvas: HTMLCanvasElement,
	opts: MountSceneOptions = {}
): SceneHandle {
	const reduced = opts.reducedQuality === true;

	// ---------- Renderer ----------
	const dpr = Math.min(window.devicePixelRatio, reduced ? 1 : 1.5);
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !reduced && window.devicePixelRatio < 2,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(dpr);

	// ---------- Scene & camera ----------
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
	// Фронтальный вид: камера прямо перед таблицей, без наклона.
	camera.position.set(0, 0, 17);
	camera.lookAt(0, 0, 0);

	// ---------- Lights ----------
	scene.add(new THREE.AmbientLight(0xffffff, 0.85));
	const dir = new THREE.DirectionalLight(0xffffff, 0.45);
	dir.position.set(3, 6, 5);
	scene.add(dir);

	// ---------- Cards ----------
	const cardGeometry = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
	const cards: THREE.Mesh[] = [];
	const elementByMesh = new Map<THREE.Mesh, PeriodicElement>();
	const meshByNumber = new Map<number, THREE.Mesh>();

	for (const el of ELEMENTS) {
		const tex = makeSymbolTexture(el.symbol, el.number, CATEGORY_COLORS[el.category]);
		const mat = new THREE.MeshLambertMaterial({ map: tex });
		const mesh = new THREE.Mesh(cardGeometry, mat);

		const x = (el.gridCol - 9.5) * STEP_X;
		const visualRow = el.gridRow >= 8 ? el.gridRow + F_BLOCK_OFFSET : el.gridRow;
		const y = -(visualRow - ROW_MID) * STEP_Y;
		// XY фиксированы; интерактивный лифт — только по Z (карточка выезжает вперёд).
		mesh.position.set(x, y, 0);

		scene.add(mesh);
		cards.push(mesh);
		elementByMesh.set(mesh, el);
		meshByNumber.set(el.number, mesh);
	}

	// ---------- State ----------
	let hoveredMesh: THREE.Mesh | null = null;
	let selectedNumber: number | null = null;
	const parallax = new THREE.Vector2(0, 0);
	const targetParallax = new THREE.Vector2(0, 0);

	// ---------- Picking ----------
	const raycaster = new THREE.Raycaster();
	const ndc = new THREE.Vector2();
	let pendingClick: PeriodicElement | null = null;

	function pointerToNDC(e: PointerEvent): void {
		const rect = canvas.getBoundingClientRect();
		ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
	}

	function pick(): PeriodicElement | null {
		raycaster.setFromCamera(ndc, camera);
		const hit = raycaster.intersectObjects(cards, false)[0];
		if (!hit) return null;
		return elementByMesh.get(hit.object as THREE.Mesh) ?? null;
	}

	function onPointerMove(e: PointerEvent): void {
		pointerToNDC(e);
		// Сдержанный parallax — view остаётся в основном фронтальным.
		targetParallax.set(ndc.x * 0.25, ndc.y * 0.15);

		const el = pick();
		const newHover = el ? (meshByNumber.get(el.number) ?? null) : null;
		if (newHover !== hoveredMesh) {
			hoveredMesh = newHover;
			opts.onHover?.(el);
			canvas.style.cursor = newHover ? 'pointer' : 'default';
		}
	}

	function onPointerLeave(): void {
		hoveredMesh = null;
		opts.onHover?.(null);
		canvas.style.cursor = 'default';
		targetParallax.set(0, 0);
	}

	function onPointerDown(e: PointerEvent): void {
		// Запоминаем кандидата клика; финализируем на pointerup, если палец/мышь не уехали.
		pointerToNDC(e);
		pendingClick = pick();
	}

	function onPointerUp(e: PointerEvent): void {
		if (!pendingClick) return;
		pointerToNDC(e);
		const releasedOn = pick();
		if (releasedOn && releasedOn.number === pendingClick.number) {
			opts.onSelect?.(pendingClick);
		}
		pendingClick = null;
	}

	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerleave', onPointerLeave);
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointercancel', () => (pendingClick = null));

	// ---------- Resize ----------
	function resize(): void {
		const w = canvas.clientWidth || 1;
		const h = canvas.clientHeight || 1;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	resize();

	// ---------- Animation loop ----------
	let frameId: number | null = null;

	function frame(): void {
		frameId = requestAnimationFrame(frame);

		// Z-лифт: карточка «выезжает вперёд» при hover/selected.
		// При фронтальной камере это читается как pop-out, а не как движение вверх.
		for (const mesh of cards) {
			const el = elementByMesh.get(mesh);
			if (!el) continue;
			const isHovered = mesh === hoveredMesh;
			const isSelected = el.number === selectedNumber;
			const targetZ = (isHovered ? 0.6 : 0) + (isSelected ? 0.2 : 0);
			mesh.position.z += (targetZ - mesh.position.z) * 0.2;
		}

		// Parallax камеры — сдержанный.
		parallax.lerp(targetParallax, 0.05);
		camera.position.x = parallax.x;
		camera.position.y = parallax.y;
		camera.lookAt(0, 0, 0);

		renderer.render(scene, camera);
	}

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reducedMotion) {
		// Один render — без петли.
		renderer.render(scene, camera);
	} else {
		frame();
	}

	// ---------- Handle ----------
	return {
		setSelected(num) {
			selectedNumber = num;
			if (reducedMotion) {
				// Без петли кадров — выставляем целевые z мгновенно и перерисовываем.
				for (const mesh of cards) {
					const el = elementByMesh.get(mesh);
					if (!el) continue;
					mesh.position.z = el.number === selectedNumber ? 0.2 : 0;
				}
				renderer.render(scene, camera);
			}
		},
		dispose() {
			if (frameId !== null) cancelAnimationFrame(frameId);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerleave', onPointerLeave);
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
			ro.disconnect();
			canvas.style.cursor = '';

			for (const mesh of cards) {
				const mat = mesh.material as THREE.MeshLambertMaterial;
				mat.map?.dispose();
				mat.dispose();
			}
			cardGeometry.dispose();
			renderer.dispose();
		}
	};
}

// --- Helpers ---

function makeSymbolTexture(
	symbol: string,
	atomicNumber: number,
	bgHex: string
): THREE.CanvasTexture {
	const size = 256;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context not available');

	// Подложка категории.
	ctx.fillStyle = bgHex;
	ctx.fillRect(0, 0, size, size);

	// Атомный номер (верх-лево).
	ctx.fillStyle = '#1a1a1a';
	ctx.font = 'bold 30px ui-sans-serif, system-ui, sans-serif';
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	ctx.fillText(atomicNumber.toString(), 16, 14);

	// Символ (центр).
	ctx.font = 'bold 110px ui-sans-serif, system-ui, sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(symbol, size / 2, size / 2 + 8);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}
