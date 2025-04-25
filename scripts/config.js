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
	ON_AIR: 'onAir',
};
