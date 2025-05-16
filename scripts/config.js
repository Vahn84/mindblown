/**
 * Config object
 */
export default {
	DEBUG: true,
	MOD_PATH: 'modules/mindblown',
	MOD_NAME: 'mindblown',
	TEMPLATES: {
		MINDBLOWN: 'modules/mindblown/templates/mindblown-ui.hbs',
		NPCS: 'modules/mindblown/templates/npcs.hbs',
		BGS: 'modules/mindblown/templates/bgs.hbs',
		FOCUS: 'modules/mindblown/templates/focus.hbs',
		VFX: 'modules/mindblown/templates/vfx.hbs',
		LIGHT: 'modules/mindblown/templates/light.hbs',
	},
	MB_MODE: {
		EDIT: 'edit',
		PLAY: 'play',
	},
	MB_CANVAS_ID: 'mbCanvas',
	FVTT_CANVAS_ID: 'board',
	BGS_DIR: 'bgDir',
	NPCS_DIR: 'npcsDir',
	FOCUS_DIR: 'focusDir',
	HIDDEN_STAGE_FOR_GM: 'gmHideStage',
	HIDDEN_STAGE_FOR_PLAYERS: 'playersHideStage',
	AMBIENT_LIGHTING_ENABLED: 'ambientLightingEnabled',
	ON_AIR: 'onAir',
	ACTIVE_CATEGORIES: {
		BG: 'activeBGs',
		NPC: 'activeNPCs',
		FOCUS: 'activeFocus',
	},
	FAV_CATEGORIES: {
		BG: 'favBGs',
		NPC: 'favNPCs',
		FOCUS: 'favFocus',
	},
	DEFAULT_SPRITE_FRAME: 'modules/mindblown/assets/textures/grey_frame.png',
	DEFAULT_SPRITE_BG: 'modules/mindblown/assets/textures/black-bg.png',
	CURRENT_STAGE: 'currentStage',
	DOCK_REDUCED: 'dockReduced',
	
};
