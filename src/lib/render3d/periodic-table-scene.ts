// Three.js сцена 3D-периодической таблицы.
// Принципы (см. CLAUDE.md):
// - Этот модуль грузится лениво, импорт `three` — единственный, идёт в отдельный чанк.
// - 118 карточек = 118 mesh'ей. InstancedMesh здесь не подходит: у каждой карточки уникальный CanvasTexture.
// - Текст бэкаем в маленький canvas (256×256), переводим в CanvasTexture — крестиком cheap, читаемо при умеренном зуме.
// - Adaptive quality: pixelRatio ограничен 1.5; antialias включается только при devicePixelRatio < 2.
// - motion-toggle: можно отключать ambient-анимации (parallax, lerp); user-driven (hover/select) остаются мгновенными.
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

const HOVER_LIFT = 0.6;
const SELECT_LIFT = 0.35;
const SELECT_HALO_COLOR = 0x2563eb; // blue-600

export interface MountSceneOptions {
	onSelect?: (el: PeriodicElement) => void;
	onHover?: (el: PeriodicElement | null) => void;
	/** Снизить качество, если детектор сообщил 'low'. */
	reducedQuality?: boolean;
	/** Включить ambient-анимации (parallax + lerp). По умолчанию true. */
	motionEnabled?: boolean;
}

export interface SceneHandle {
	setSelected(num: number | null): void;
	setMotion(enabled: boolean): void;
	dispose(): void;
}

export function mountPeriodicTableScene(
	canvas: HTMLCanvasElement,
	opts: MountSceneOptions = {}
): SceneHandle {
	const reduced = opts.reducedQuality === true;
	let motionOn = opts.motionEnabled !== false;

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

	// Размер текстуры карточки: больше — резче текст, но больше GPU-памяти.
	// 384²×4×118 ≈ 70 MB; 256²×4×118 ≈ 30 MB — на low-quality остаёмся на 256.
	const textureSize = reduced ? 256 : 384;
	const maxAniso = renderer.capabilities.getMaxAnisotropy();

	for (const el of ELEMENTS) {
		const tex = makeSymbolTexture(
			el.symbol,
			el.number,
			el.atomicMass,
			CATEGORY_COLORS[el.category],
			textureSize,
			maxAniso
		);
		const mat = new THREE.MeshLambertMaterial({ map: tex });
		const mesh = new THREE.Mesh(cardGeometry, mat);

		const x = (el.gridCol - 9.5) * STEP_X;
		const visualRow = el.gridRow >= 8 ? el.gridRow + F_BLOCK_OFFSET : el.gridRow;
		const y = -(visualRow - ROW_MID) * STEP_Y;
		mesh.position.set(x, y, 0);

		scene.add(mesh);
		cards.push(mesh);
		elementByMesh.set(mesh, el);
		meshByNumber.set(el.number, mesh);
	}

	// ---------- Halo подсветка выбранного ----------
	// Чуть больший плоский квадрат позади карточки, ярко-синий полупрозрачный.
	// Виден только когда selectedNumber !== null.
	const haloGeometry = new THREE.PlaneGeometry(CARD_W * 1.35, CARD_H * 1.35);
	const haloMaterial = new THREE.MeshBasicMaterial({
		color: SELECT_HALO_COLOR,
		transparent: true,
		opacity: 0.55,
		depthWrite: false
	});
	const halo = new THREE.Mesh(haloGeometry, haloMaterial);
	halo.visible = false;
	scene.add(halo);

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

	function applyTargetsInstant(): void {
		// Снимаем все z-смещения мгновенно (без lerp) — для motion-off.
		for (const mesh of cards) {
			const el = elementByMesh.get(mesh);
			if (!el) continue;
			const isHovered = mesh === hoveredMesh;
			const isSelected = el.number === selectedNumber;
			mesh.position.z = (isHovered ? HOVER_LIFT : 0) + (isSelected ? SELECT_LIFT : 0);
		}
		parallax.set(0, 0);
		camera.position.set(0, 0, 17);
		camera.lookAt(0, 0, 0);
	}

	function updateHalo(): void {
		if (selectedNumber === null) {
			halo.visible = false;
			return;
		}
		const target = meshByNumber.get(selectedNumber);
		if (!target) {
			halo.visible = false;
			return;
		}
		halo.visible = true;
		halo.position.set(target.position.x, target.position.y, target.position.z - CARD_D / 2 - 0.01);
	}

	function renderNow(): void {
		renderer.render(scene, camera);
	}

	function onPointerMove(e: PointerEvent): void {
		pointerToNDC(e);
		targetParallax.set(ndc.x * 0.25, ndc.y * 0.15);

		const el = pick();
		const newHover = el ? (meshByNumber.get(el.number) ?? null) : null;
		if (newHover !== hoveredMesh) {
			hoveredMesh = newHover;
			opts.onHover?.(el);
			canvas.style.cursor = newHover ? 'pointer' : 'default';
			if (!motionOn) {
				applyTargetsInstant();
				updateHalo();
				renderNow();
			}
		}
	}

	function onPointerLeave(): void {
		const had = hoveredMesh !== null;
		hoveredMesh = null;
		opts.onHover?.(null);
		canvas.style.cursor = 'default';
		targetParallax.set(0, 0);
		if (!motionOn && had) {
			applyTargetsInstant();
			updateHalo();
			renderNow();
		}
	}

	function onPointerDown(e: PointerEvent): void {
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
		if (!motionOn) renderNow();
	}

	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	resize();

	// ---------- Animation loop ----------
	let frameId: number | null = null;

	function frame(): void {
		frameId = requestAnimationFrame(frame);

		// Z-лифт карточек.
		for (const mesh of cards) {
			const el = elementByMesh.get(mesh);
			if (!el) continue;
			const isHovered = mesh === hoveredMesh;
			const isSelected = el.number === selectedNumber;
			const targetZ = (isHovered ? HOVER_LIFT : 0) + (isSelected ? SELECT_LIFT : 0);
			mesh.position.z += (targetZ - mesh.position.z) * 0.2;
		}

		// Halo следует за выбранной карточкой (учёт текущего z после lerp).
		if (selectedNumber !== null) {
			const target = meshByNumber.get(selectedNumber);
			if (target) {
				halo.visible = true;
				halo.position.set(
					target.position.x,
					target.position.y,
					target.position.z - CARD_D / 2 - 0.01
				);
			}
		} else {
			halo.visible = false;
		}

		// Parallax.
		parallax.lerp(targetParallax, 0.05);
		camera.position.x = parallax.x;
		camera.position.y = parallax.y;
		camera.lookAt(0, 0, 0);

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

	if (motionOn) {
		startLoop();
	} else {
		applyTargetsInstant();
		updateHalo();
		renderNow();
	}

	// ---------- Handle ----------
	return {
		setSelected(num) {
			selectedNumber = num;
			if (!motionOn) {
				applyTargetsInstant();
				updateHalo();
				renderNow();
			}
		},
		setMotion(enabled) {
			if (motionOn === enabled) return;
			motionOn = enabled;
			if (enabled) {
				startLoop();
			} else {
				stopLoop();
				applyTargetsInstant();
				updateHalo();
				renderNow();
			}
		},
		dispose() {
			stopLoop();
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
			haloGeometry.dispose();
			haloMaterial.dispose();
			renderer.dispose();
		}
	};
}

// --- Helpers ---

function makeSymbolTexture(
	symbol: string,
	atomicNumber: number,
	atomicMass: number,
	bgHex: string,
	size: number,
	anisotropy: number
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context not available');

	// Подложка категории.
	ctx.fillStyle = bgHex;
	ctx.fillRect(0, 0, size, size);

	const fontStack = 'ui-sans-serif, system-ui, -apple-system, sans-serif';

	// Атомный номер — верх-лево.
	ctx.fillStyle = '#0d0d0d';
	ctx.font = `bold ${Math.round(size * 0.115)}px ${fontStack}`;
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	const pad = size * 0.06;
	ctx.fillText(atomicNumber.toString(), pad, pad);

	// Символ — крупно по центру (чуть выше геометрического, чтобы освободить место для массы).
	ctx.font = `bold ${Math.round(size * 0.42)}px ${fontStack}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(symbol, size / 2, size * 0.46);

	// Атомная масса — низ-центр; форматируем как в 2D-таблице.
	const massText = atomicMass.toFixed(atomicMass < 100 ? 2 : 1);
	ctx.font = `${Math.round(size * 0.085)}px ${fontStack}`;
	ctx.textBaseline = 'bottom';
	ctx.fillStyle = 'rgba(13,13,13,0.85)';
	ctx.fillText(massText, size / 2, size - pad);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = Math.min(anisotropy, 8);
	texture.generateMipmaps = true;
	texture.minFilter = THREE.LinearMipmapLinearFilter;
	texture.magFilter = THREE.LinearFilter;
	return texture;
}
