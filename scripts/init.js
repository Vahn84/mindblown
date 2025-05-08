import { VFX } from './effects.js';
import { Stage } from './stage.js';
import { Tile } from './tile.js';
import { IS_GM, logger } from './utilities.js';
import { StageManager } from './stage-manager.js';
import CONFIG from './config.js';
import { initSettings, setupModule } from './setup.js';
import { MindblownUI } from './mindblown.js';

// import { Stage } from './stage.js';

Hooks.on('ready', () => {
	console.log('Mindblown ready');
	game.socket.on(`module.${CONFIG.MOD_NAME}`, (data) => {
		StageManager.shared().SocketSetStageByAction(data);
	});
	StageManager.shared().getCurrentStageFromCache();
	// StageManager.shared().destroyPIXIApp();
	if (!game.user.isGM) return;

	if ($('#taskbar').length > 0) {
		const trpTaskbar = $('#taskbar');
		logger('trpTaskbar', trpTaskbar);
		logger('quickInsert', trpTaskbar.find('#taskbarQuickInsert'));
		trpTaskbar
			.find('#taskbarQuickInsert')
			.after(
				'<aside id="mbQuickInsert"><h3><i class="fas fa-mask-ventilator"></i></h3></aside>'
			);

		trpTaskbar.on('click', '#mbQuickInsert', (event) => {
			event.preventDefault();
			// logger('pixi', PIXI);
			// let path =
			// 	'worlds/aetherium/tom-scenes/locations/Campsites/Forest%20Campsite.jpg';
			// let bg = new Tile('bg', path);
			// logger('bg', bg, Tile.TyleType.BG);
			// let stage = new Stage(bg);
			// // stage.setBg(bg);
			// StageManager.shared().setStage(stage);
			// StageManager.shared().initPIXIApp();
			MindblownUI.renderSingleton();
		});
	}
});

Hooks.on('sequencerReady', () => {
	// Sequencer.Database.registerEntries(CONFIG.MOD_NAME, data);
	// let sDbEntries = Sequencer.Database.getAllFileEntries("jb2a");
	$('#sequencerUILayerAbove').css({
		display: 'none',
	});
});

Hooks.once('init', async () => {
	initSettings();
	await setupModule();
});

Hooks.on("updateScene", (scene, changes) => {
	if (changes?.environment?.darknessLevel !== undefined) {
	  console.log("Darkness changed to", changes?.environment?.darknessLevel);
	  StageManager.shared().setDarkness(changes?.environment?.darknessLevel)
	}
  });

Hooks.on('getSceneControlButtons', (controls) => {
	// Check if a group already exists or create your own
	if (!game.user.isGM) {
		return;
	}
	controls.push({
		name: 'mindblown',
		title: 'Mindblown UI',
		icon: 'fas fa-spa', // Use any FontAwesome icon
		layer: 'controls', // optional unless you have a custom layer
		tools: [
			{
				name: 'open-ui',
				title: 'Open Mindblown UI',
				icon: 'fas fa-window',
				onClick: () => {
					MindblownUI.renderSingleton();
				},
				button: true,
			},
			{
				name: 'hide-gm-stage',
				title: 'Hide Stage for GM',
				icon: 'fas fa-square-minus',
				onClick: () => {
					StageManager.shared().toggleStageVisibility(true);
				},
				toggle: true,
				active: game.settings.get(
					CONFIG.MOD_NAME,
					CONFIG.HIDDEN_STAGE_FOR_GM
				),
			},
			{
				name: 'hide-players-stage',
				title: 'Hide Stage for Players',
				icon: 'fas fa-eye-slash',
				onClick: () => {
					let toHide = !game.settings.get(CONFIG.MOD_NAME, CONFIG.HIDDEN_STAGE_FOR_PLAYERS)
					game.settings.set(CONFIG.MOD_NAME, keyName, toHide);
					StageManager.shared().toggleStageVisibility(false);
				},
				toggle: true,
				active: game.settings.get(
					CONFIG.MOD_NAME,
					CONFIG.HIDDEN_STAGE_FOR_PLAYERS
				),
			},
			{
				name: 'end-stream',
				title: 'End Stream',
				icon: 'fas fa-power-off',
				onClick: () => {
					StageManager.shared().destroyPIXIApp();
				},
				button: true,
			},
			{
				name: 'force-stream',
				title: 'Force Stream',
				icon: 'fas fa-plug',
				onClick: () => {
					StageManager.shared().forceCurrentStage();
				},
				button: true,
			},
			{
				name: 'reset-bg',
				title: 'Reset Background',
				icon: 'fas fa-eraser',
				onClick: () => {
					StageManager.shared().clearBg();
				},
				button: true,
			},
			{
				name: 'sync-folders',
				title: 'Sync Media Folders',
				icon: 'fas fa-arrows-rotate',
				onClick: () => {
					MindblownUI.getInstance().syncMedias();
				},
				button: true,
			},
		],
	});
});
