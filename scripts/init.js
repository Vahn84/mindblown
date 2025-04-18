import { createContainer } from './canvas-handler';
import { Stage } from './stage';

Hooks.on('ready', () => {
	console.log('Mindblown ready');
});

Hooks.once('init', () => {
	// registerSettings();
	// registerCanvasLayer();
});

Hooks.on('getSceneControlButtons', (controls) => {
	if (!game.user.isGM) return;
	controls.push({
		name: 'mindblown',
		title: 'Mindblown',
		icon: 'fas fa-mask-ventilator',
		activeTool: 'showCanvas',
		layer: 'mindblown',
		tools: [
			{
				name: 'showCanvas',
				title: 'Show Canvas',
				icon: 'fas fa-compress-arrows-alt',
				visible: true,
				button: true,
				onClick: () => {
					createContainer(
						new Stage({
							bg: 'worlds/aetherium/tom-scenes/locations/Inemora/Inemora.jpg',
						})
					);
				},
			},
		],
	});
});
