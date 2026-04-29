// Барель для лабораторного слоя.
// Чистый reducer + реактивная обёртка экспортируются раздельно — для тестируемости.

export {
	createInitialState,
	applyAction,
	createAddSubstance,
	createHeat,
	createCool,
	createMix,
	ROOM_TEMPERATURE,
	ATMOSPHERIC_PRESSURE,
	type ApplyOutcome
} from './lab-state';

export {
	getExperiment,
	getLastReaction,
	getLastUnknown,
	getSelectedContainerId,
	setSelectedContainerId,
	dispatch,
	resetExperiment,
	emptyContainer,
	addSubstance,
	heat,
	mix,
	replayLastReaction,
	type LastReactionRecord,
	type UnknownAttemptRecord
} from './lab-store.svelte';

export {
	getPlayback,
	getActivePlaybacks,
	startPlayback,
	stopPlayback,
	stopAll as stopAllPlaybacks,
	type ActivePlayback
} from './reaction-playback.svelte';

export {
	getActiveQuest,
	getActiveQuestId,
	getCompletedIds as getCompletedQuestIds,
	getJustCompletedId,
	setActiveQuest,
	clearJustCompleted,
	isCompleted as isQuestCompleted,
	resetQuestProgress
} from './quest-store.svelte';
