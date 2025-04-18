import * as PIXI from 'pixi.js';
import { Tile } from './tile';
import { Stage } from './stage';

export const createContainer = async (stage: Stage) => {
	// Create a new application
	const app = new PIXI.Application();
	// Initialize the application
	await app.init({ background: '#1099bb', resizeTo: window });
	document.body.appendChild(app.canvas);
	const texture = await Assets.load(stage.bg.path);
	const sprite = new PIXI.Sprite.from(texture);
	const container = new PIXI.Container();
	container.x = 0;
	container.y = 0;
	container.addChild(sprite);
	app.stage.addChild(container);
};
