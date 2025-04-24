import { VFX } from './effects.js';
import { Stage } from './stage.js';
import { Tile, TyleType } from './tile.js';
import { logger } from './utilities.js';
import { StageManger } from './stage-manager.js';

// import { Stage } from './stage.js';

Hooks.on('ready', () => {
	console.log('Mindblown ready');
	if (!game.user.isGM) return;
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
		logger('pixi', PIXI);
		let path =
			'worlds/aetherium/tom-scenes/locations/Campsites/Forest%20Campsite.jpg';
		let bg = new Tile('bg', path);
		logger('bg', bg, TyleType.BG);
		let stage = new Stage('Stage');
		stage.setBg(bg);
		StageManger.shared().setStage(stage);
		StageManger.shared().initPIXIApp();
		// logger('stage', stage);
		// setupPIXIAppBg(stage);
	});

});

Hooks.once('init', () => {
	// registerSettings();
	// registerCanvasLayer();
	Hooks.on('getSceneControlButtons', (controls) => {});
});
