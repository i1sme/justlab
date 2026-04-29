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
	getSelectedContainerId,
	setSelectedContainerId,
	dispatch,
	resetExperiment,
	emptyContainer,
	addSubstance,
	heat,
	mix
} from './lab-store.svelte';
