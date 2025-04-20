import { createContainer } from './canvas-handler.js';
import { VFX } from './effects.js';
import { Stage } from './stage.js';
import { Tile, TyleType } from './tile.js';
import { logger } from './utilities.js';

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
			'worlds/aetherium/tom-scenes/locations/Inemora/Ruined%20Citadel%20Palace.jpg';
		let bg = new Tile('bg', path);
		logger('bg', bg, TyleType.BG);
		let stage = new Stage('Stage');
		stage.setBg(bg);
		logger('stage', stage);
		createContainer(stage);
	});
});

Hooks.once('init', () => {
	// registerSettings();
	// registerCanvasLayer();
	Hooks.on('getSceneControlButtons', (controls) => {});
});
