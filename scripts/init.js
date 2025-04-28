import { VFX } from './effects.js';
import { Stage } from './stage.js';
import { Tile } from './tile.js';
import { logger } from './utilities.js';
import { StageManger } from './stage-manager.js';
import CONFIG from './config.js';
import { initSettings, setupModule } from './setup.js';
import { MindblownUI } from './mindblown.js';

// import { Stage } from './stage.js';

Hooks.on('ready', () => {
	console.log('Mindblown ready');
	game.socket.on(CONFIG.MOD_NAME, (data) => {
		StageManger.shared().SocketSetStageByAction(data);
	});
	if (!game.user.isGM) return;
	initSettings();
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
		// StageManger.shared().setStage(stage);
		// StageManger.shared().initPIXIApp();
		MindblownUI.renderSingleton();
	});
});

Hooks.on('sequencerReady', () => {
	// Sequencer.Database.registerEntries(CONFIG.MOD_NAME, data);
	// let sDbEntries = Sequencer.Database.getAllFileEntries("jb2a");
});

Hooks.once('init', async () => {
	// registerSettings();
	// registerCanvasLayer();
	Hooks.on('getSceneControlButtons', (controls) => {});
	await setupModule();
});
