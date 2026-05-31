// 3D-устройство нагревательной плитки: база + верхняя пластина + свечение + панель с
// кнопками и цифровым дисплеем. Чистая логика (intensity → opacity) живёт в
// heating-plate-logic.ts; здесь — только Three.js геометрия и публичный handle.

import * as THREE from 'three';
import { glowOpacityFor, type HeatingIntensity } from './heating-plate-logic';

/** Tag для userData clickable target — лабораторная сцена матчит по нему raycast-хиты. */
export const KIND_HEATING_BUTTON = 'heating-button';
export const KIND_HEATING_PLATE = 'heating-plate';

export interface HeatingPlateHandle {
	group: THREE.Group;
	setIntensity(level: HeatingIntensity): void;
	setDisplayTemp(kelvin: number | null): void;
	dispose(): void;
}

export interface MakeHeatingPlateOptions {
	reducedQuality?: boolean;
}

const BASE_W = 0.5;
const BASE_D = 0.5;
const BASE_H = 0.08;
const TOP_W = 0.42;
const TOP_D = 0.42;
const TOP_H = 0.015;
const PANEL_W = 0.5;
const PANEL_H = 0.18;
const PANEL_D = 0.06;
const BUTTON_SIZE = 0.07;
const DISPLAY_W = 0.22;
const DISPLAY_H = 0.07;

const LABELS: { intensity: HeatingIntensity; text: string }[] = [
	{ intensity: 0, text: 'O' },
	{ intensity: 1, text: 'I' },
	{ intensity: 2, text: 'II' },
	{ intensity: 3, text: 'III' }
];

export function makeHeatingPlate(opts: MakeHeatingPlateOptions = {}): HeatingPlateHandle {
	const reducedQuality = opts.reducedQuality === true;
	const group = new THREE.Group();
	group.userData = { kind: KIND_HEATING_PLATE };

	// База — тёмно-серый плоский бокс.
	const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
	const baseMat = new THREE.MeshStandardMaterial({
		color: 0x3a3f4a,
		roughness: 0.6,
		metalness: 0.2
	});
	const base = new THREE.Mesh(baseGeo, baseMat);
	base.position.y = BASE_H / 2;
	group.add(base);

	// Верхняя «горячая» пластина — отдельный mesh, чтобы можно было отдельно регулировать свечение.
	const topGeo = new THREE.BoxGeometry(TOP_W, TOP_H, TOP_D);
	const topMat = new THREE.MeshStandardMaterial({
		color: 0x1a1a1a,
		roughness: 0.4,
		metalness: 0.5
	});
	const top = new THREE.Mesh(topGeo, topMat);
	top.position.y = BASE_H + TOP_H / 2;
	top.name = 'plateTop';
	group.add(top);

	// Свечение — прозрачный плоский квад над пластиной, opacity управляется setIntensity.
	const glowGeo = new THREE.PlaneGeometry(TOP_W * 0.95, TOP_D * 0.95);
	const glowMat = new THREE.MeshBasicMaterial({
		color: 0xff4a1a,
		transparent: true,
		opacity: 0,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const glow = new THREE.Mesh(glowGeo, glowMat);
	glow.rotation.x = -Math.PI / 2;
	glow.position.y = BASE_H + TOP_H + 0.001;
	glow.name = 'plateGlow';
	group.add(glow);

	// Передняя панель управления.
	const panelGeo = new THREE.BoxGeometry(PANEL_W, PANEL_H, PANEL_D);
	const panelMat = new THREE.MeshStandardMaterial({
		color: 0x2a2e36,
		roughness: 0.5,
		metalness: 0.3
	});
	const panel = new THREE.Mesh(panelGeo, panelMat);
	panel.position.set(0, PANEL_H / 2, BASE_D / 2 + PANEL_D / 2);
	group.add(panel);

	// Дисплей — плоскость с canvas-текстурой текущей температуры.
	const displayTex = makeDisplayTexture(null, reducedQuality);
	const displayMat = new THREE.MeshBasicMaterial({ map: displayTex, transparent: true });
	const displayGeo = new THREE.PlaneGeometry(DISPLAY_W, DISPLAY_H);
	const display = new THREE.Mesh(displayGeo, displayMat);
	display.position.set(0, PANEL_H * 0.7, BASE_D / 2 + PANEL_D + 0.001);
	display.name = 'plateDisplay';
	group.add(display);

	// Лейбл "НАГРЕВ" — атмосферный, запечённый в текстуру (см. spec §4 i18n note).
	const heatLabelTex = makeHeatLabelTexture(reducedQuality);
	const heatLabelMat = new THREE.MeshBasicMaterial({ map: heatLabelTex, transparent: true });
	const heatLabelGeo = new THREE.PlaneGeometry(DISPLAY_W, DISPLAY_H * 0.45);
	const heatLabel = new THREE.Mesh(heatLabelGeo, heatLabelMat);
	heatLabel.position.set(0, PANEL_H * 0.49, BASE_D / 2 + PANEL_D + 0.001);
	group.add(heatLabel);

	// Кнопки OFF / I / II / III — выровнены по нижней половине панели.
	const buttons: THREE.Mesh[] = [];
	const totalBtnWidth = BUTTON_SIZE * LABELS.length;
	const gap = (PANEL_W - totalBtnWidth) / (LABELS.length + 1);
	for (let i = 0; i < LABELS.length; i++) {
		const tex = makeButtonTexture(LABELS[i].text, false, reducedQuality);
		const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
		const geo = new THREE.PlaneGeometry(BUTTON_SIZE, BUTTON_SIZE);
		const btn = new THREE.Mesh(geo, mat);
		const x = -PANEL_W / 2 + gap * (i + 1) + BUTTON_SIZE * (i + 0.5);
		btn.position.set(x, PANEL_H * 0.27, BASE_D / 2 + PANEL_D + 0.001);
		btn.userData = { kind: KIND_HEATING_BUTTON, intensity: LABELS[i].intensity };
		btn.name = `plateButton-${LABELS[i].intensity}`;
		group.add(btn);
		buttons.push(btn);
	}

	function setIntensity(level: HeatingIntensity): void {
		glowMat.opacity = glowOpacityFor(level);
		glowMat.needsUpdate = true;
		for (let i = 0; i < buttons.length; i++) {
			const isActive = LABELS[i].intensity === level;
			const oldMat = buttons[i].material as THREE.MeshBasicMaterial;
			oldMat.map?.dispose();
			oldMat.map = makeButtonTexture(LABELS[i].text, isActive, reducedQuality);
			oldMat.needsUpdate = true;
		}
	}

	function setDisplayTemp(kelvin: number | null): void {
		const mat = display.material as THREE.MeshBasicMaterial;
		mat.map?.dispose();
		mat.map = makeDisplayTexture(kelvin, reducedQuality);
		mat.needsUpdate = true;
	}

	function dispose(): void {
		group.traverse((o) => {
			const m = o as THREE.Mesh;
			if (m.geometry) m.geometry.dispose();
			const mat = m.material;
			if (Array.isArray(mat)) {
				for (const x of mat) {
					const xs = x as THREE.Material & { map?: THREE.Texture | null };
					xs.map?.dispose();
					xs.dispose();
				}
			} else if (mat) {
				const single = mat as THREE.Material & { map?: THREE.Texture | null };
				single.map?.dispose();
				single.dispose();
			}
		});
	}

	return { group, setIntensity, setDisplayTemp, dispose };
}

function makeDisplayTexture(kelvin: number | null, reducedQuality: boolean): THREE.CanvasTexture {
	const w = reducedQuality ? 256 : 512;
	const h = reducedQuality ? 96 : 192;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#0a0a0a';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#ff5a1a';
		ctx.font = `bold ${Math.floor(h * 0.5)}px ui-monospace, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const text = kelvin === null ? '—' : `${Math.round(kelvin)} K`;
		ctx.fillText(text, w / 2, h / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

function makeHeatLabelTexture(reducedQuality: boolean): THREE.CanvasTexture {
	const w = reducedQuality ? 256 : 384;
	const h = reducedQuality ? 64 : 96;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#2a2e36';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#ff5a1a';
		ctx.font = `bold ${Math.floor(h * 0.7)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('НАГРЕВ', w / 2, h / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

function makeButtonTexture(
	label: string,
	active: boolean,
	reducedQuality: boolean
): THREE.CanvasTexture {
	const size = reducedQuality ? 128 : 192;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = active ? '#ff5a1a' : '#1a1d23';
		ctx.fillRect(0, 0, size, size);
		ctx.strokeStyle = active ? '#ffe18a' : '#3a3f4a';
		ctx.lineWidth = 6;
		ctx.strokeRect(3, 3, size - 6, size - 6);
		ctx.fillStyle = active ? '#0a0a0a' : '#ffe5cc';
		ctx.font = `bold ${Math.floor(size * 0.5)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, size / 2, size / 2 + 4);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}
