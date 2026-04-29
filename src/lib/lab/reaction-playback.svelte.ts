// Хранит активные «проигрывания» реакций по контейнерам.
// При срабатывании реакции из reducer'а — startPlayback() ставит таймеры на смену кадров;
// UI рендерит активные эффекты текущего кадра (см. ReactionEffects.svelte).
//
// Если motionEnabled=false — playback не запускается, реакции происходят мгновенно
// и без визуальных эффектов (содержимое контейнера всё равно меняется в reducer'е).

import type { Reaction, VisualEffect } from '../../data/types';
import { getMotionEnabled } from '$lib/settings';

export interface ActivePlayback {
	reactionId: string;
	startedAt: number;
	duration: number;
	/** Текущий снимок эффектов (берётся из последнего пройденного кадра). */
	effects: readonly VisualEffect[];
	/** Текущая температурная динамика (rise/drop) — для UI-индикатора. */
	tempPulse: 'rise' | 'drop' | null;
}

let playbacks = $state<Record<string, ActivePlayback>>({});
// timers — нереактивный side-channel для очистки setTimeout-ов; SvelteMap здесь не нужен.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

export function getPlayback(containerId: string): ActivePlayback | undefined {
	return playbacks[containerId];
}

export function getActivePlaybacks(): Readonly<Record<string, ActivePlayback>> {
	return playbacks;
}

export function startPlayback(containerId: string, reaction: Reaction): void {
	if (!getMotionEnabled()) return; // motion off — без визуала
	if (reaction.timeline.length === 0) return;

	stopPlayback(containerId);

	const startedAt = Date.now();
	const firstFrame = reaction.timeline[0];
	playbacks[containerId] = {
		reactionId: reaction.id,
		startedAt,
		duration: reaction.duration,
		effects: firstFrame.effects ?? [],
		tempPulse: framePulse(firstFrame.deltaT)
	};

	const myTimers: ReturnType<typeof setTimeout>[] = [];

	for (let i = 1; i < reaction.timeline.length; i++) {
		const frame = reaction.timeline[i];
		myTimers.push(
			setTimeout(() => {
				const current = playbacks[containerId];
				if (!current || current.startedAt !== startedAt) return; // playback переопределён
				playbacks[containerId] = {
					...current,
					effects: frame.effects ?? [],
					tempPulse: framePulse(frame.deltaT)
				};
			}, frame.t * 1000)
		);
	}

	myTimers.push(
		setTimeout(
			() => {
				const current = playbacks[containerId];
				if (current && current.startedAt === startedAt) {
					stopPlayback(containerId);
				}
			},
			Math.max(reaction.duration * 1000, 1)
		)
	);

	timers.set(containerId, myTimers);
}

export function stopPlayback(containerId: string): void {
	const ts = timers.get(containerId);
	if (ts) {
		for (const t of ts) clearTimeout(t);
		timers.delete(containerId);
	}
	if (playbacks[containerId]) {
		const next = { ...playbacks };
		delete next[containerId];
		playbacks = next;
	}
}

export function stopAll(): void {
	for (const id of Object.keys(playbacks)) stopPlayback(id);
}

function framePulse(deltaT: number | undefined): 'rise' | 'drop' | null {
	if (deltaT === undefined || deltaT === 0) return null;
	return deltaT > 0 ? 'rise' : 'drop';
}
