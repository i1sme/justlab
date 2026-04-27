// Three.js сцена 3D молекулы.
// Принципы (см. CLAUDE.md):
// - Атомы одного элемента группируются в один InstancedMesh — 1 draw call на тип.
// - Связи отрисовываются цилиндрами; для двойных/тройных — параллельные смещения.
// - OrbitControls (lazy через addons) — позволяют крутить модель.
// - Координаты входят в ангстремах от OpenChemLib (Z=0 для 2D-кейса) — умножаем на сцену-фактор.
// - dispose() освобождает все GPU-ресурсы.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { MoleculeAtom, MoleculeBond } from '$lib/chemistry/openchemlib';
import { cpkColor } from '$lib/chemistry';

export interface MountMoleculeSceneOptions {
	atoms: ReadonlyArray<MoleculeAtom>;
	bonds: ReadonlyArray<MoleculeBond>;
	reducedQuality?: boolean;
	motionEnabled?: boolean;
}

export interface MoleculeSceneHandle {
	setMotion(enabled: boolean): void;
	dispose(): void;
}

const ATOM_RADIUS = 0.32;
const BOND_RADIUS = 0.08;
const BOND_OFFSET = 0.18; // расстояние между параллельными цилиндрами для двойных/тройных
const BG = 0xf4f4f5; // zinc-100 — нейтральный фон

export function mountMoleculeScene(
	canvas: HTMLCanvasElement,
	opts: MountMoleculeSceneOptions
): MoleculeSceneHandle {
	const { atoms, bonds, reducedQuality = false } = opts;
	let motionOn = opts.motionEnabled !== false;

	// ---- Renderer ----
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !reducedQuality && window.devicePixelRatio < 2,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedQuality ? 1 : 1.5));

	// ---- Scene & camera ----
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(BG);

	const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

	// ---- Lights ----
	scene.add(new THREE.AmbientLight(0xffffff, 0.7));
	const key = new THREE.DirectionalLight(0xffffff, 0.55);
	key.position.set(3, 5, 4);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0xffffff, 0.3);
	fill.position.set(-3, -2, -3);
	scene.add(fill);

	// ---- Молекула: атомы (InstancedMesh per element) + связи ----
	const moleculeGroup = new THREE.Group();
	scene.add(moleculeGroup);

	// Группировка атомов по элементу.
	const byElement = new Map<string, number[]>();
	for (let i = 0; i < atoms.length; i++) {
		const el = atoms[i].element;
		if (!byElement.has(el)) byElement.set(el, []);
		byElement.get(el)!.push(i);
	}

	const atomGeometry = new THREE.SphereGeometry(
		ATOM_RADIUS,
		reducedQuality ? 12 : 20,
		reducedQuality ? 8 : 14
	);
	const instancedMeshes: THREE.InstancedMesh[] = [];
	const atomMaterials: THREE.MeshStandardMaterial[] = [];

	const tempMatrix = new THREE.Matrix4();
	for (const [element, indices] of byElement) {
		const material = new THREE.MeshStandardMaterial({
			color: cpkColor(element),
			roughness: 0.45,
			metalness: 0.05
		});
		const inst = new THREE.InstancedMesh(atomGeometry, material, indices.length);
		for (let k = 0; k < indices.length; k++) {
			const a = atoms[indices[k]];
			tempMatrix.makeTranslation(a.x, a.y, a.z);
			inst.setMatrixAt(k, tempMatrix);
		}
		inst.instanceMatrix.needsUpdate = true;
		moleculeGroup.add(inst);
		instancedMeshes.push(inst);
		atomMaterials.push(material);
	}

	// Связи: для каждого порядка связи рисуем 1..3 цилиндра с перпендикулярным смещением.
	const bondGeometry = new THREE.CylinderGeometry(
		BOND_RADIUS,
		BOND_RADIUS,
		1,
		reducedQuality ? 8 : 12,
		1,
		false
	);
	const bondMaterial = new THREE.MeshStandardMaterial({
		color: 0x9ca3af, // zinc-400
		roughness: 0.5,
		metalness: 0.05
	});
	const bondMeshes: THREE.Mesh[] = [];
	const cylAxis = new THREE.Vector3(0, 1, 0);

	for (const bond of bonds) {
		const a = atoms[bond.a];
		const b = atoms[bond.b];
		if (!a || !b) continue;

		const start = new THREE.Vector3(a.x, a.y, a.z);
		const end = new THREE.Vector3(b.x, b.y, b.z);
		const dir = new THREE.Vector3().subVectors(end, start);
		const length = dir.length();
		if (length < 0.001) continue;

		const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
		const orient = new THREE.Quaternion().setFromUnitVectors(cylAxis, dir.clone().normalize());

		// Перпендикулярное направление для смещения параллельных цилиндров.
		// Берём fallback на ось X, если связь параллельна Y.
		const perp =
			Math.abs(dir.y) > 0.99
				? new THREE.Vector3(1, 0, 0)
				: new THREE.Vector3(0, 1, 0).cross(dir).normalize();

		const order = bond.order >= 1 && bond.order <= 3 ? bond.order : 1;
		const offsets =
			order === 1
				? [0]
				: order === 2
					? [-BOND_OFFSET / 2, BOND_OFFSET / 2]
					: [-BOND_OFFSET, 0, BOND_OFFSET];

		for (const off of offsets) {
			const mesh = new THREE.Mesh(bondGeometry, bondMaterial);
			mesh.scale.y = length;
			mesh.position.copy(mid).addScaledVector(perp, off);
			mesh.quaternion.copy(orient);
			moleculeGroup.add(mesh);
			bondMeshes.push(mesh);
		}
	}

	// Центрирование молекулы и подгонка камеры по bbox.
	const bbox = new THREE.Box3().setFromObject(moleculeGroup);
	const center = new THREE.Vector3();
	const size = new THREE.Vector3();
	bbox.getCenter(center);
	bbox.getSize(size);
	moleculeGroup.position.sub(center);

	const radius = Math.max(size.x, size.y, size.z, 1) * 0.6 + ATOM_RADIUS * 2;
	const camDist = radius / Math.tan((camera.fov * Math.PI) / 360) + 2;
	camera.position.set(0, 0, camDist);
	camera.lookAt(0, 0, 0);

	// ---- OrbitControls ----
	const controls = new OrbitControls(camera, canvas);
	controls.dampingFactor = 0.08;
	controls.enablePan = false;
	controls.minDistance = camDist * 0.4;
	controls.maxDistance = camDist * 3;
	controls.enableDamping = motionOn;

	// ---- Resize ----
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

	// ---- Anim loop ----
	let frameId: number | null = null;
	function renderNow(): void {
		renderer.render(scene, camera);
	}
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
		renderNow();
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
				renderNow();
			}
		},
		dispose() {
			stopLoop();
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const inst of instancedMeshes) {
				inst.dispose();
			}
			for (const mat of atomMaterials) mat.dispose();
			for (const mesh of bondMeshes) {
				mesh.removeFromParent();
			}
			atomGeometry.dispose();
			bondGeometry.dispose();
			bondMaterial.dispose();
			renderer.dispose();
		}
	};
}
