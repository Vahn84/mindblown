import { Tile } from './tile.js';
import { Stage } from './stage.js';
import { logger } from './utilities.js';
import { VFX } from './effects.js';
import CONFIG from './config.js';

export async function createContainer(stage) {
	const app = new PIXI.Application({
		resizeTo: window,
	});
	app.view.id = 'mbCanvas';
	logger('app', app);
	const foundryCanvas = $('#board');
	foundryCanvas.after(app.view); // app.canvas is called `app.view` in v6
	const texture = await PIXI.Assets.load(stage.bg.path);

	const sprite = new PIXI.Sprite(texture);

	logger('sprite', sprite);
	logger('texture', texture);
	const container = new PIXI.Container();
	container.x = 0;
	container.y = 0;
	container.spawnPos = { x: 0, y: 0 };

	container.addChild(sprite);

	app.stage.addChild(container);
	createFogEmitter(container);
}

export async function createFogEmitter(container) {
	const fogTexture = await PIXI.Assets.load(
		`modules/${CONFIG.MOD_NAME}/assets/textures/smoke.png`
	);
	const sprite = new PIXI.Sprite(fogTexture);
	logger('fogTexture', sprite);

	if (!PIXI.particles || !PIXI.particles.Emitter) {
		console.error(
			'PIXI.particles.Emitter is not available. Make sure the particle-emitter library is loaded.'
		);
		return;
	}

	const tex = PIXI.Texture.from(
		`modules/${CONFIG.MOD_NAME}/assets/textures/smoke.png`
	);

	logger('tex', tex);
	let config = {
		alpha: {
			start: 0.17,
			end: 0.33,
		},
		scale: {
			start: 1,
			end: 3,
			minimumScaleMultiplier: 1.8,
		},
		color: {
			start: '#bdbdbd',
			end: '#5e5e5e',
		},
		speed: {
			start: 2,
			end: 3,
			minimumSpeedMultiplier: 1,
		},
		acceleration: {
			x: 1,
			y: 2,
		},
		maxSpeed: 2,
		startRotation: {
			min: 1,
			max: 0,
		},
		noRotation: true,
		rotationSpeed: {
			min: 1,
			max: 1,
		},
		lifetime: {
			min: 3,
			max: 10,
		},
		blendMode: 'screen',
		frequency: 0.3,
		emitterLifetime: 10,
		maxParticles: 100,
		pos: {
			x: 0,
			y: 0,
		},
		addAtBack: false,
		spawnType: 'ring',
		spawnCircle: {
			x: 0,
			y: 0,
			r: 150,
			minR: 10,
		},
	};
	const emitter = new PIXI.particles.Emitter(
		container,
		PIXI.particles.upgradeConfig(config, tex)
	);
	logger('em', emitter);
	// const emitter = new PIXI.particles.Emitter(
	// 	// The PIXI.Container to put the emitter in
	// 	// if using blend modes, it's important to put this
	// 	// on top of a bitmap, and not use the root stage Container
	// 	container,

	// 	// Emitter configuration, edit this to change the look
	// 	// of the emitter
	// 	{
	// 		lifetime: {
	// 			min: 0.5,
	// 			max: 0.5,
	// 		},
	// 		frequency: 0.008,
	// 		spawnChance: 1,
	// 		particlesPerWave: 1,
	// 		emitterLifetime: 0.31,
	// 		maxParticles: 1000,
	// 		pos: {
	// 			x: 0,
	// 			y: 0,
	// 		},

	// 		spawnPos: {
	// 			x: 0,
	// 			y: 0,
	// 		},
	// 		addAtBack: false,
	// 		behaviors: [
	// 			{
	// 				type: 'alpha',
	// 				config: {
	// 					alpha: {
	// 						list: [
	// 							{
	// 								value: 0.8,
	// 								time: 0,
	// 							},
	// 							{
	// 								value: 0.1,
	// 								time: 1,
	// 							},
	// 						],
	// 					},
	// 				},
	// 			},
	// 			{
	// 				type: 'scale',
	// 				config: {
	// 					scale: {
	// 						list: [
	// 							{
	// 								value: 1,
	// 								time: 0,
	// 							},
	// 							{
	// 								value: 0.3,
	// 								time: 1,
	// 							},
	// 						],
	// 					},
	// 				},
	// 			},
	// 			{
	// 				type: 'color',
	// 				config: {
	// 					color: {
	// 						list: [
	// 							{
	// 								value: 'fb1010',
	// 								time: 0,
	// 							},
	// 							{
	// 								value: 'f5b830',
	// 								time: 1,
	// 							},
	// 						],
	// 					},
	// 				},
	// 			},
	// 			{
	// 				type: 'moveSpeed',
	// 				config: {
	// 					speed: {
	// 						list: [
	// 							{
	// 								value: 200,
	// 								time: 0,
	// 							},
	// 							{
	// 								value: 100,
	// 								time: 1,
	// 							},
	// 						],
	// 						isStepped: false,
	// 					},
	// 				},
	// 			},
	// 			{
	// 				type: 'rotationStatic',
	// 				config: {
	// 					min: 0,
	// 					max: 360,
	// 				},
	// 			},
	// 			{
	// 				type: 'spawnShape',
	// 				config: {
	// 					type: 'torus',
	// 					data: {
	// 						x: 0,
	// 						y: 0,
	// 						radius: 10,
	// 					},
	// 				},
	// 			},
	// 			{
	// 				type: 'textureSingle',
	// 				config: {
	// 					texture: PIXI.Texture.from(
	// 						`modules/${CONFIG.MOD_NAME}/assets/textures/smoke.png`
	// 					),
	// 				},
	// 			},
	// 		],
	// 	}
	// );

	// Calculate the current time
	let elapsed = Date.now();

	// Update function every frame
	const update = function () {
		// Update the next frame
		requestAnimationFrame(update);

		let now = Date.now();

		// The emitter requires the elapsed
		// number of seconds since the last update
		emitter.update((now - elapsed) * 0.001);
		elapsed = now;
	};
	emitter.ownerPos = { x: 0, y: 0 };
	// Start emitting
	emitter.emit = true;

	// Start the update
	update();
}
