// Глобальные пользовательские настройки (Svelte 5 runes).
// На текущий момент: motionEnabled — управляет анимациями в 3D-сценах.
// Default: учитывается prefers-reduced-motion системы; user override живёт в localStorage.

const MOTION_KEY = 'justlab.motion';

function readMotionInitial(): boolean {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(MOTION_KEY);
		if (stored === 'on') return true;
		if (stored === 'off') return false;
	}
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	return true;
}

let motionEnabled = $state<boolean>(readMotionInitial());

export function getMotionEnabled(): boolean {
	return motionEnabled;
}

export function setMotionEnabled(next: boolean): void {
	motionEnabled = next;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(MOTION_KEY, next ? 'on' : 'off');
	}
}

export function toggleMotion(): void {
	setMotionEnabled(!motionEnabled);
}
