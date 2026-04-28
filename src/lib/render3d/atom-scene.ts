// Three.js сцена 3D-атома (Bohr-стиль).
// Ядро — сфера CPK-цвета.
// Каждая оболочка — кольцо (Torus) в собственной плоскости с электронами.
// OrbitControls + autoRotate (выключается при prefers-reduced-motion).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cpkColor } from '$lib/chemistry';

export interface MountAtomSceneOptions {
	atomicNumber: number;
	symbol: string;
	shells: ReadonlyArray<number>;
	reducedQuality?: boolean;
	motionEnabled?: boolean;
}

export interface AtomSceneHandle {
	setMotion(enabled: boolean): void;
	/** factor > 1 — приблизить, factor < 1 — отдалить. Учитывает min/max OrbitControls. */
	zoom(factor: number): void;
	dispose(): void;
}

const NUCLEUS_R = 0.6;
const ELECTRON_R = 0.12;
const SHELL_START = 1.4;
const SHELL_GAP = 0.85;
const RING_TUBE = 0.025;

export function mountAtomScene(
	canvas: HTMLCanvasElement,
	opts: MountAtomSceneOptions
): AtomSceneHandle {
	const { symbol, shells, reducedQuality = false } = opts;
	let motionOn = opts.motionEnabled !== false;

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !reducedQuality && window.devicePixelRatio < 2,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedQuality ? 1 : 1.5));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

	scene.add(new THREE.AmbientLight(0xffffff, 0.7));
	const dir = new THREE.DirectionalLight(0xffffff, 0.55);
	dir.position.set(3, 4, 5);
	scene.add(dir);

	// Атом-группа: ядро + оболочки. Контролим её через OrbitControls/autoRotate.
	const atom = new THREE.Group();
	scene.add(atom);

	// ---- Ядро ----
	const nucleusGeo = new THREE.SphereGeometry(
		NUCLEUS_R,
		reducedQuality ? 16 : 32,
		reducedQuality ? 12 : 24
	);
	const nucleusMat = new THREE.MeshStandardMaterial({
		color: cpkColor(symbol),
		roughness: 0.4,
		metalness: 0.05
	});
	const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
	atom.add(nucleus);

	// ---- Оболочки ----
	const ringMat = new THREE.MeshBasicMaterial({
		color: 0x9ca3af, // zinc-400
		transparent: true,
		opacity: 0.35
	});
	const electronGeo = new THREE.SphereGeometry(
		ELECTRON_R,
		reducedQuality ? 8 : 14,
		reducedQuality ? 6 : 10
	);
	const electronMat = new THREE.MeshStandardMaterial({
		color: 0x3b82f6, // blue-500
		roughness: 0.35,
		metalness: 0.1
	});

	const ringGeometries: THREE.TorusGeometry[] = [];
	const ringMeshes: THREE.Mesh[] = [];

	for (let i = 0; i < shells.length; i++) {
		const radius = SHELL_START + i * SHELL_GAP;
		const ringGeo = new THREE.TorusGeometry(radius, RING_TUBE, 8, reducedQuality ? 48 : 96);
		const ring = new THREE.Mesh(ringGeo, ringMat);

		// Каждая оболочка — в своей плоскости, чтобы получился «облако электронов» вид.
		// Используем псевдослучайные, но детерминированные углы.
		const tiltX = (i * 37) % 60; // °
		const tiltY = (i * 53) % 90;
		ring.rotation.x = (tiltX * Math.PI) / 180;
		ring.rotation.y = (tiltY * Math.PI) / 180;
		atom.add(ring);
		ringGeometries.push(ringGeo);
		ringMeshes.push(ring);

		// Электроны: размещаем на торе равномерно в локальной плоскости XY,
		// затем добавляем как детей кольца — наследуют его поворот.
		const count = shells[i];
		const offset = i * 0.4; // рассинхрон между оболочками для красоты
		for (let j = 0; j < count; j++) {
			const angle = (j / count) * Math.PI * 2 + offset;
			const e = new THREE.Mesh(electronGeo, electronMat);
			e.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);
			ring.add(e);
		}
	}

	// ---- Камера: по bbox атома ----
	const bbox = new THREE.Box3().setFromObject(atom);
	const size = new THREE.Vector3();
	bbox.getSize(size);
	const radius = Math.max(size.x, size.y, size.z) * 0.5 + 0.3;
	const camDist = radius / Math.tan((camera.fov * Math.PI) / 360) + 1.5;
	camera.position.set(0, 0, camDist);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, canvas);
	controls.enablePan = false;
	controls.minDistance = camDist * 0.4;
	controls.maxDistance = camDist * 2.5;
	controls.autoRotateSpeed = 0.7;
	controls.enableDamping = motionOn;
	controls.autoRotate = motionOn;

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
	function onControlsChange(): void {
		renderer.render(scene, camera);
	}
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

	if (motionOn) {
		startLoop();
	} else {
		controls.addEventListener('change', onControlsChange);
		renderer.render(scene, camera);
	}

	return {
		setMotion(enabled) {
			if (motionOn === enabled) return;
			motionOn = enabled;
			if (enabled) {
				controls.removeEventListener('change', onControlsChange);
				controls.enableDamping = true;
				controls.autoRotate = true;
				startLoop();
			} else {
				stopLoop();
				controls.autoRotate = false;
				controls.enableDamping = false;
				controls.addEventListener('change', onControlsChange);
				renderer.render(scene, camera);
			}
		},
		zoom(factor) {
			const dist = camera.position.distanceTo(controls.target);
			const newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, dist / factor));
			const dir = camera.position.clone().sub(controls.target).normalize();
			camera.position.copy(controls.target).addScaledVector(dir, newDist);
			controls.update();
			if (!motionOn) renderer.render(scene, camera);
		},
		dispose() {
			stopLoop();
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const ring of ringMeshes) ring.removeFromParent();
			for (const g of ringGeometries) g.dispose();
			ringMat.dispose();
			electronGeo.dispose();
			electronMat.dispose();
			nucleusGeo.dispose();
			nucleusMat.dispose();
			renderer.dispose();
		}
	};
}
