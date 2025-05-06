import { Tile } from './tile.js';
import { Stage } from './stage.js';
import { IS_GM, logger } from './utilities.js';
import { VFX, VFX_TYPES } from './effects.js';
import CONFIG from './config.js';
import { StageManager } from './stage-manager.js';
import { AmbientLightingManager } from './ambient-lighting-manager.js';

export class PIXIHandler {
	static customPixiParticles = CustomPixiParticles.customPixiParticles;
	static PIXI_WRAPPERS = {
		BG_ID: 'bgContainer',
		NPC_ID: 'npcContainer',
		VFX_ID: 'vfxContainer',
		FOCUS_ID: 'focusContainer',
		WEATHER_ID: 'weatherContainer',
		LIGHT_ID: 'lightContainer',
	};
	static PIXI_DO = {
		BG_ID: 'bgSprite',
		BG_ID_TMP: 'bgSpriteTmp',
		BBG_ID: 'blurryBgSprite',
		BBG_ID_TMP: 'blurryBgSpriteTmp',
		NPC_ID: 'npcSprite',
		NPC_ID_TMP: 'npcSpriteTmp',
		FOCUS_ID: 'focusSprite',
		FOCUS_ID_TMP: 'focusSpriteTmp',
		VFX_ID: 'vfxSprite',
		VFX_ID_TMP: 'vfxSpriteTmp',
		WEATHER_ID: 'weatherEmitter',
		WEATHER_ID_TMP: 'weatherEmitterTmp',
	};

	static async InitPIXIApp(PIXIApp) {
		logger('InitPIXIApp', PIXIApp);
		let originalWidth = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		);
		let originalHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		);

		if (!PIXI || !PIXI.Application) {
			console.error(
				'PIXI is not available. Make sure the pixi.js library is loaded.'
			);
			return;
		} else {
			logger('PIXIJS VERSION', PIXI.VERSION);
		}
		let _PIXIApp = PIXIApp || null;
		if (!_PIXIApp) {
			_PIXIApp = new PIXI.Application({
				resolution: 1,
				autoDensity: true,
				resizeTo: window,
				background: '#000000',
				backgroundAlpha: 0,
				antialias: false,
			});
		}

		_PIXIApp.view.id = CONFIG.MB_CANVAS_ID;
		const foundryCanvas = $(`#${CONFIG.FVTT_CANVAS_ID}`);
		const mbCanvas = $(`#${CONFIG.MB_CANVAS_ID}`);
		// if (!mbCanvas) {
		// 	mbCanvas.remove();
		// }
		foundryCanvas.after(_PIXIApp.view);
		_PIXIApp.stage.interactive = true;
		return _PIXIApp;
	}

	static async DestroySprite(sprite, path) {
		try {
			// PIXI.Assets.unload(path);
			sprite.destroy({
				children: true,
				texture: false,
				baseTexture: false,
			});
		} catch (error) {
			logger('Error unloading asset:', error);
		}
	}

	static async setTileOnStage(
		PIXIApp,
		tileType,
		tile,
		shouldTransition = false
	) {
		let containerName = '';
		let spriteName = '';
		let tmpSpriteName = '';

		switch (tileType) {
			case Tile.TileType.NPC:
				containerName = PIXIHandler.PIXI_WRAPPERS.NPC_ID;
				spriteName = PIXIHandler.PIXI_DO.NPC_ID;
				tmpSpriteName = PIXIHandler.PIXI_DO.NPC_ID_TMP;
				break;
			case Tile.TileType.FOCUS:
				containerName = PIXIHandler.PIXI_WRAPPERS.FOCUS_ID;
				spriteName = PIXIHandler.PIXI_DO.FOCUS_ID;
				tmpSpriteName = PIXIHandler.PIXI_DO.FOCUS_ID_TMP;
				break;
			case Tile.TileType.VFX:
				containerName = PIXIHandler.PIXI_WRAPPERS.VFX_ID;
				spriteName = PIXIHandler.PIXI_DO.VFX_ID;
				tmpSpriteName = PIXIHandler.PIXI_DO.VFX_ID_TMP;
				break;
			default:
				break;
		}

		const spriteContainer = PIXIApp.stage.getChildByName(containerName);

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const sprite = spriteContainer.getChildByName(spriteName);
		if (!tile) {
			const tileSpriteTickerOut = new PIXI.Ticker();
			tileSpriteTickerOut.maxFPS = 30;
			tileSpriteTickerOut.add(
				(delta) =>
					PIXIHandler.tileSpriteTickerTransitionOut(
						PIXIApp,
						delta,
						sprite,
						tileSpriteTickerOut,
						spriteContainer
					),
				this
			);
			tileSpriteTickerOut.start();
			return;
		}

		const texture = await PIXI.Assets.load(tile.path);
		if (texture && tile.mediaType === Tile.MediaType.VIDEO) {
			texture.baseTexture.resource.source.autoplay = true;
			texture.baseTexture.resource.source.loop = tile.loop;
			texture.baseTexture.resource.source.muted = tile.mute;
			texture.baseTexture.resource.source.play();
		}
		const newSprite = new PIXI.Sprite(texture);
		// const strokeShader = await VFX.strokeShader();
		// const outlineFilter = new PIXI.Filter(null, strokeShader, {
		// 	outlineColor: new Float32Array([1.0, 1.0, 1.0, 1.0]), // white RGBA
		// 	thickness: 2.0,
		// });

		// // Apply to your sprite
		// newSprite.filters = [outlineFilter];
		newSprite.name = tmpSpriteName;
		newSprite.alpha = 0;
		newSprite.width = tile.pixiOptions.width;
		newSprite.height = tile.pixiOptions.height;
		newSprite.position.set(tile.pixiOptions.pX, tile.pixiOptions.pY);
		spriteContainer.addChild(newSprite);

		let bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		if (!bgSprite) {
			bgSprite = bgContainer.getChildByName(
				PIXIHandler.PIXI_DO.BG_ID_TMP
			);
		}

		if (StageManager.shared().isBgTransitioning) {
			StageManager.shared().addEventListener(
				StageManager.EVENTS.BG_ENDED_TRANSITION,
				async () => {
					bgSprite = bgContainer.getChildByName(
						PIXIHandler.PIXI_DO.BG_ID
					);
					PIXIHandler.setNewTile(
						PIXIApp,
						spriteContainer,
						newSprite,
						sprite,
						bgSprite,
						tile,
						spriteName,
						shouldTransition
					);
				}
			);
		} else {
			PIXIHandler.setNewTile(
				PIXIApp,
				spriteContainer,
				newSprite,
				sprite,
				bgSprite,
				tile,
				spriteName,
				shouldTransition
			);
		}
	}

	static async setNewTile(
		PIXIApp,
		spriteContainer,
		newSprite,
		sprite,
		bgSprite,
		tile,
		spriteName,
		shouldTransition
	) {
		await PIXIHandler.ResizeSprite(newSprite, bgSprite, tile);
		if (shouldTransition) {
			const tileSpriteTicker = new PIXI.Ticker();
			tileSpriteTicker.maxFPS = 30;
			tileSpriteTicker.add(
				(delta) =>
					PIXIHandler.tileSpriteTickerTransition(
						PIXIApp,
						delta,
						newSprite,
						sprite,
						tile,
						spriteName,
						tileSpriteTicker
					),
				this
			);

			tileSpriteTicker.start();
		} else {
			const { visible, maxAlpha } = PIXIHandler.getVisibilityByRole(
				newSprite,
				tile
			);
			newSprite.visible = visible;
			newSprite.alpha = maxAlpha;
			newSprite.name = spriteName;
			PIXIHandler.addControlButtons(newSprite, tile.tileType);
			if (sprite) {
				if (sprite.__controls) {
					sprite.__controls.destroy();
				}

				PIXIHandler.DestroySprite(sprite, tile.path);
			}
		}
	}

	static async setBgOnStage(PIXIApp, bg) {
		if (!bg) {
			PIXIApp.ticker.maxFPS = 30;
			PIXIApp.ticker.add(PIXIHandler.bgTickerTransitionOut, this);
			return;
		}

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const blurryBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BBG_ID
		);

		const { texture, blurryTexture } = await PIXIHandler.loadBgTextures(
			PIXIApp,
			bg
		);

		const newBgSprite = new PIXI.Sprite(texture);
		const newBlurryBgSprite = new PIXI.Sprite(blurryTexture);
		newBgSprite.name = PIXIHandler.PIXI_DO.BG_ID_TMP;
		newBlurryBgSprite.name = PIXIHandler.PIXI_DO.BBG_ID_TMP;

		newBgSprite.alpha = 0;
		newBlurryBgSprite.alpha = 0;
		bgContainer.addChild(newBlurryBgSprite);
		bgContainer.addChild(newBgSprite);
		if (!bg.isDefault) {
			PIXIHandler.ResizeStageBg(
				newBgSprite,
				newBlurryBgSprite,
				window.innerWidth,
				window.innerHeight
			);

			newBlurryBgSprite.anchor.set(0.5);
			const blurFilter = new PIXI.BlurFilter();
			newBlurryBgSprite.filters = [blurFilter];
			blurFilter.blur = 5;
		} else {
			newBgSprite.width = window.innerWidth;
			newBgSprite.height = window.innerHeight;
			newBgSprite.position.set(0, 0);
			bgContainer.removeChild(blurryBgSprite);

			PIXIHandler.DestroySprite(newBlurryBgSprite, bg.thumbnail);

			// newBlurryBgSprite = null;
		}
		StageManager.shared().setIsBgTransitioning(true);
		PIXIApp.ticker.maxFPS = 30;
		PIXIApp.ticker.add(PIXIHandler.bgTickerTransition, this);
	}

	static async tileSpriteTickerTransition(
		PIXIApp,
		delta,
		newSprite,
		sprite,
		tile,
		spriteName,
		ticker
	) {
		const { visible, maxAlpha } = PIXIHandler.getVisibilityByRole(
			newSprite,
			tile
		);

		newSprite.alpha += 0.01 * delta;
		if (sprite) {
			sprite.alpha -= 0.01 * delta;
		}

		newSprite.visible = visible;

		if (newSprite.alpha >= maxAlpha) {
			try {
				ticker.stop();
				ticker.destroy();
				if (sprite) {
					logger('tileSpriteTickerTransition', sprite, newSprite);
					try {
						let container = null;
						switch (tile.tileType) {
							case Tile.TileType.NPC:
								container = PIXIApp.stage.getChildByName(
									PIXIHandler.PIXI_WRAPPERS.NPC_ID
								);
								break;
							case Tile.TileType.FOCUS:
								container = PIXIApp.stage.getChildByName(
									PIXIHandler.PIXI_WRAPPERS.FOCUS_ID
								);
								break;
							case Tile.TileType.VFX:
								container = PIXIApp.stage.getChildByName(
									PIXIHandler.PIXI_WRAPPERS.VFX_ID
								);
								break;
							default:
								container = PIXIApp.stage.getChildByName(
									PIXIHandler.PIXI_WRAPPERS.NPC_ID
								);
								break;
						}
						if (sprite.__controls) {
							sprite.__controls.destroy();
						}
						PIXIHandler.DestroySprite(sprite, tile.path);
					} catch (error) {
						logger('Error removing old sprite:', error);
					}
				}
			} catch (error) {
				logger('Error removing old NPC sprite:', error);
			}
			newSprite.name = spriteName;

			// Always add the control buttons at the end
			PIXIHandler.addControlButtons(newSprite, tile.tileType);
		}
	}

	static async tileSpriteTickerTransitionOut(
		PIXIApp,
		delta,
		sprite,
		ticker,
		spriteContainer
	) {
		if (!sprite) return;

		sprite.alpha -= 0.01 * delta;

		if (sprite.alpha <= 0) {
			try {
				ticker.stop();
				ticker.destroy();

				if (sprite.__controls) {
					sprite.__controls.destroy();
				}
				sprite.destroy({
					children: true,
					texture: true,
					baseTexture: false,
				});
			} catch (error) {
				logger('Error removing NPC sprite:', error);
			}
		}
	}

	static async bgTickerTransition(delta) {
		let PIXIApp = StageManager.shared().PIXIApp;

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const blurryBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BBG_ID
		);
		const newBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BG_ID_TMP
		);
		const newBlurryBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BBG_ID_TMP
		);

		newBgSprite.alpha += 0.01 * delta;

		if (newBlurryBgSprite) {
			newBlurryBgSprite.alpha += 0.01 * delta;
		}
		if (bgSprite) {
			bgSprite.alpha -= 0.01 * delta;
		}
		if (blurryBgSprite) {
			blurryBgSprite.alpha -= 0.01 * delta;
		}

		const maxAlpha =
			StageManager.shared().stage?.bg?.pixiOptionsRuntime?.alpha ||
			StageManager.shared().stage?.bg?.pixiOptions?.alpha ||
			1;
		if (
			newBgSprite.alpha >= maxAlpha &&
			(!bgSprite || bgSprite?.alpha <= 0)
		) {
			try {
				PIXIApp.ticker.remove(PIXIHandler.bgTickerTransition, this);
				if (bgSprite) {
					PIXIHandler.DestroySprite(
						bgSprite,
						StageManager.shared().stage?.bg.path
					);
				}
				if (blurryBgSprite) {
					PIXIHandler.DestroySprite(
						blurryBgSprite,
						StageManager.shared().stage?.bg?.thumbnail
					);
				}
			} catch (error) {
				logger('Error removing old background:', error);
			}
			newBgSprite.name = PIXIHandler.PIXI_DO.BG_ID;
			if (newBlurryBgSprite) {
				newBlurryBgSprite.name = PIXIHandler.PIXI_DO.BBG_ID;
			}
			logger('setting bg sprite Name finally');

			if (
				bgContainer &&
				StageManager.shared().stage?.bg?.mediaType ===
					Tile.MediaType.IMAGE
			) {
				// bgContainer.cacheAsBitmap = true;
			}
			StageManager.shared().setIsBgTransitioning(false);

			const lighting = PIXIApp.stage.getChildByName('lighting');
			if (lighting) {
				PIXIApp.stage.setChildIndex(
					lighting,
					PIXIApp.stage.children.length - 1
				);
			}

			StageManager.shared().dispatchEvent(
				StageManager.EVENTS.BG_ENDED_TRANSITION,
				{}
			);
		}
	}

	static async bgTickerTransitionOut(delta) {
		let PIXIApp = StageManager.shared().PIXIApp;
		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);

		if (!bgSprite) return;

		bgSprite.alpha -= 0.01 * delta;

		if (bgSprite.alpha <= 0) {
			try {
				PIXIApp.ticker.remove(PIXIHandler.bgTickerTransitionOut, this);
				bgSprite.destroy({
					children: true,
					texture: true,
					baseTexture: false,
				});
			} catch (error) {
				logger('Error removing background sprite:', error);
			}
		}
	}

	static async loadBgTextures(PIXIApp, bg) {
		const texture = await PIXI.Assets.load(bg?.path ? bg.path : '');

		if (texture && bg.mediaType === Tile.MediaType.VIDEO) {
			texture.baseTexture.resource.source.autoplay = true;
			texture.baseTexture.resource.source.loop = bg.loop;
			texture.baseTexture.resource.source.muted = bg.mute;
			texture.baseTexture.resource.source.play();
		}
		const blurryTexture = await PIXI.Assets.load(
			bg?.thumbnail ? bg.thumbnail : ''
		);

		return {
			texture,
			blurryTexture,
		};
	}

	static async SetupPIXIAppStage(
		PIXIApp,
		bg = null,
		originalWidth,
		originalHeight
	) {
		const bgContainer = new PIXI.Container();
		const npcContainer = new PIXI.Container();
		const focusContainer = new PIXI.Container();
		const vfxContainer = new PIXI.Container();
		const weatherContainer = new PIXI.Container();

		bgContainer.name = PIXIHandler.PIXI_WRAPPERS.BG_ID;
		npcContainer.name = PIXIHandler.PIXI_WRAPPERS.NPC_ID;
		focusContainer.name = PIXIHandler.PIXI_WRAPPERS.FOCUS_ID;
		vfxContainer.name = PIXIHandler.PIXI_WRAPPERS.VFX_ID;
		weatherContainer.name = PIXIHandler.PIXI_WRAPPERS.WEATHER_ID;

		// bgContainer.addChild(vfxContainer);
		PIXIApp.stage.addChild(bgContainer);
		PIXIApp.stage.addChild(npcContainer);
		PIXIApp.stage.addChild(focusContainer);
		PIXIApp.stage.addChild(vfxContainer);
		PIXIApp.stage.addChild(weatherContainer);

		bgContainer.position.set(0, 0);
		npcContainer.position.set(0, 0);
		focusContainer.position.set(0, 0);
		vfxContainer.position.set(0, 0);
		weatherContainer.position.set(0, 0);

		// await PIXIHandler.AddPIXIParticlesEffect(
		// 	PIXIApp,
		// 	VFX_TYPES.SWIRLING_FOG,
		// 	{
		// 		x: originalWidth / 2,
		// 		y: originalHeight / 2,
		// 	}
		// );

		// Change darkness dynamically
		// lighting.setDarknessLevel(0.2); // sunrise

		window.addEventListener('resize', () => {
			PIXIHandler.ResizeStage(
				PIXIApp,
				originalWidth,
				originalHeight,
				true
			);
		});
		if (bg) {
			PIXIHandler.setBgOnStage(PIXIApp, bg);
		}

		const lighting = new AmbientLightingManager({
			width: originalWidth,
			height: originalHeight,
			darkness: 0.8, // night
		});
		lighting.name = PIXIHandler.PIXI_WRAPPERS.LIGHT_ID;
		PIXIApp.stage.addChild(lighting);

		// Add some lights
	}

	static async setFilterEffect(PIXIApp, effect) {
		VFX.setFilterEffect(effect, PIXIApp.stage);
	}

	static async addLightSourceOnStage(PIXIApp, tile) {
		const lightingContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.LIGHT_ID
		);

		const light = lightingContainer.addLight(PIXIApp, tile);
		PIXIHandler.addControlButtons(light, tile.tileType);
		PIXIApp.ticker.maxFPS = 30;
		PIXIApp.ticker.add(() => {
			if (lightingContainer && lightingContainer.updateLightMask) {
				lightingContainer.updateLightMask(PIXIApp.renderer);
			}
		});
	}

	static async ToggleWeatherEffectOnStage(
		PIXIApp,
		weather,
		originalWidth,
		originalHeight
	) {
		if (weather) {
			await PIXIHandler.AddPIXIParticlesEffect(
				PIXIApp,
				weather,
				{
					x: originalWidth / 2,
					y: originalHeight / 2,
				},
				PIXIHandler.PIXI_WRAPPERS.WEATHER_ID
			);
		} else {
			const weatherContainer = PIXIApp.stage.getChildByName(
				PIXIHandler.PIXI_WRAPPERS.WEATHER_ID
			);
			if (weatherContainer) {
				weatherContainer.removeChildren();
			}
		}
	}

	static async AddPIXIParticlesEffect(
		PIXIApp,
		effect,
		defaultPosition,
		particlesContainerName = PIXIHandler.PIXI_WRAPPERS.WEATHER_ID
	) {
		const initialX = defaultPosition.x || 0;
		const initialY = defaultPosition.y || 0;
		let particles = null;
		let response = null;
		switch (effect) {
			case VFX_TYPES.CAMPFIRE:
				response = await VFX.campfire();
				break;
			case VFX_TYPES.SNOW:
				response = await VFX.snow();
				break;
			case VFX_TYPES.STARS:
				response = await VFX.stars();
				break;
			case VFX_TYPES.RAIN:
				response = await VFX.rain();
				break;
			case VFX_TYPES.WARP:
				response = await VFX.warp();
				break;
			case VFX_TYPES.WARP_CLOUDS:
				response = await VFX.warp_clouds();
				break;
			case VFX_TYPES.RUNES:
				response = await VFX.runes();
				break;
			case VFX_TYPES.LIGHT:
				response = await VFX.light();
				break;
			case VFX_TYPES.SWIRLING_FOG:
				response = await VFX.swirling_fog();
				break;
			case VFX_TYPES.SANDSTORM:
				response = await VFX.sandstorm();
				break;
			default:
				response = await VFX.swirling_fog();
				break;
		}
		if (!response) {
			errorLogger(
				'No particles created. Check the effect type or the emitter creation.'
			);
			return;
		}
		const { emitterConfig, textures } = response;
		particles = PIXIHandler.customPixiParticles.create({
			textures,
			emitterConfig,
		});

		if (!particles) {
			errorLogger(
				'No particles created. Check the effect type or the emitter creation.'
			);
			return;
		}

		// Draw red edit mode square if user is GM
		let wrapper = new PIXI.Container();

		wrapper.addChild(particles);

		particles.play();
		particles.interactive = false;

		wrapper.position.set(initialX, initialY);

		// Store relative position based on bgSprite
		if (StageManager.shared().isBgTransitioning) {
			StageManager.shared().addEventListener(
				StageManager.EVENTS.BG_ENDED_TRANSITION,
				async () => {
					PIXIHandler.addParticlesToContainer(
						PIXIApp,
						wrapper,
						particlesContainerName,
						initialX,
						initialY
					);
				}
			);
		} else {
			PIXIHandler.addParticlesToContainer(
				PIXIApp,
				wrapper,
				particlesContainerName,
				initialX,
				initialY
			);
		}

		// Make the wrapper draggable
		// wrapper.interactive = true;
		// wrapper.interactiveChildren = false; // << Prevent children from stealing events
		// wrapper.buttonMode = true;

		// weatherContainer.interactive = true;
	}

	static async addParticlesToContainer(
		PIXIApp,
		wrapper,
		particlesContainerName,
		initialX,
		initialY
	) {
		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const particlesContainer = PIXIApp.stage.getChildByName(
			particlesContainerName
		);

		if (bgSprite) {
			wrapper.__relativePosition = {
				x: (initialX - bgSprite.position.x) / bgSprite.width,
				y: (initialY - bgSprite.position.y) / bgSprite.height,
			};
		}
		particlesContainer.addChild(wrapper);
	}

	static async ResizeStage(
		PIXIApp,
		originalWidth,
		originalHeight,
		isBgTransition = false
	) {
		let screenWidth = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		);
		let screenHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		);

		console.trace('setTileOnStage called');
		logger('ResizeStage called', screenWidth, screenHeight);
		PIXIHandler.ResizeRenderer(PIXIApp, screenWidth, screenHeight);

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const vfxContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.VFX_ID
		);

		const npcContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.NPC_ID
		);
		const focusContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.FOCUS_ID
		);

		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const blurryBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BBG_ID
		);
		const npcSprite = npcContainer.getChildByName(
			PIXIHandler.PIXI_DO.NPC_ID
		);
		const focusSprite = focusContainer.getChildByName(
			PIXIHandler.PIXI_DO.FOCUS_ID
		);
		const vfxSprite = vfxContainer.getChildByName(
			PIXIHandler.PIXI_DO.VFX_ID
		);
		const weatherContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.WEATHER_ID
		);

		const bgTile = StageManager.shared().stage?.bg;

		if (!bgTile?.isDefault) {
			PIXIHandler.ResizeStageBg(
				bgSprite,
				blurryBgSprite,
				originalWidth,
				originalHeight
			);
		} else {
			bgSprite.width = window.innerWidth;
			bgSprite.height = window.innerHeight;
			bgSprite.position.set(0, 0);
		}

		const lightingContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.LIGHT_ID
		);
		if (lightingContainer) {
			lightingContainer.resize(
				PIXIApp,
				{
					width: screenWidth,
					height: screenHeight,
				},
				bgSprite
			);
		}

		const npc = StageManager.shared().stage?.npc;
		const focus = StageManager.shared().stage?.focus;
		const vfx = StageManager.shared().stage?.vfx;
		if (npc) {
			logger('RESIZE SPRITE CALL FROM: ResizeStage - NPC');
			PIXIHandler.ResizeSprite(npcSprite, bgSprite, npc, isBgTransition);
		}
		if (focus) {
			logger('RESIZE SPRITE CALL FROM: ResizeStage - FOCUS');
			PIXIHandler.ResizeSprite(
				focusSprite,
				bgSprite,
				focus,
				isBgTransition
			);
		}
		if (vfx) {
			logger('RESIZE SPRITE CALL FROM: ResizeStage - VFX');
			PIXIHandler.ResizeSprite(vfxSprite, bgSprite, vfx, isBgTransition);
		}
		// PIXIHandler.ResizeSprite(objSprite, bgRef);
		PIXIHandler.ResizeParticlesEffects(weatherContainer, bgSprite);
	}

	static async ResizeRenderer(PIXIApp, screenWidth, screenHeight) {
		PIXIApp.renderer.resize(screenWidth, screenHeight);
	}

	static async ResizeStageBg(
		bgSprite,
		blurryBgSprite,
		originalWidth,
		originalHeight
	) {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const imageAspectRatio =
			bgSprite.texture.width / bgSprite.texture.height;
		const screenAspectRatio = screenWidth / screenHeight;
		let newWidth, newHeight;

		if (screenAspectRatio > imageAspectRatio) {
			// Screen is wider than image — fit by height
			newHeight = screenHeight;
			newWidth = newHeight * imageAspectRatio;
		} else {
			// Screen is taller than image — fit by width
			newWidth = screenWidth;
			newHeight = newWidth / imageAspectRatio;
		}
		bgSprite.width = newWidth;
		bgSprite.height = newHeight;
		// Center the sprite
		bgSprite.position.x = (screenWidth - newWidth) / 2;
		bgSprite.position.y = (screenHeight - newHeight) / 2;

		PIXIHandler.AdjustImageToCover(
			{ width: screenWidth, height: screenHeight },
			blurryBgSprite
		);

		// Maintain particle emitter's relative position on resize
	}

	static async ResizeParticlesEffects(vfxContainer, bgRef) {
		if (!vfxContainer || !vfxContainer.children?.length) return;

		const scale = bgRef.width / bgRef.texture.width;
		logger('bgRef', bgRef, scale);
		for (const wrapper of vfxContainer.children) {
			if (!wrapper.__relativePosition) continue;
			const rel = wrapper.__relativePosition;
			const newX = bgRef.position.x + bgRef.width * rel.x;
			const newY = bgRef.position.y + bgRef.height * rel.y;

			wrapper.scale.set(1); // Prevent any previous scaling issues
			wrapper.position.set(newX, newY);

			const emitter = wrapper.children.find(
				(c) => typeof c.play === 'function'
			);
			if (emitter) emitter.scale.set(scale); // scale only the inner emitter
		}
	}

	static async ResizeSprite(sprite, bgRef, tile, isBgTransition = false) {
		if (!sprite || !bgRef || !tile) return;

		const options = tile.pixiOptionsRuntime || tile.pixiOptions || {};
		const {
			width: originalWidth,
			height: originalHeight,
			pX: originalPX,
			pY: originalPY,
			screenWidth = 1920,
			screenHeight = 1080,
		} = options;

		// Scaling ratio compared to reference screen
		const scaleX = bgRef.width / screenWidth;
		const scaleY = bgRef.height / screenHeight;

		// Calculate new width and height based on bg scaling
		const spriteWidth = originalWidth * scaleX;
		const spriteHeight = originalHeight * scaleY;

		sprite.width = spriteWidth;
		sprite.height = spriteHeight;

		// Position, scaled accordingly
		const newX = bgRef.position.x + originalPX * scaleX;
		const newY = bgRef.position.y + originalPY * scaleY;

		sprite.position.set(newX, newY);

		// Maintain texture aspect ratio inside the sprite
		if (sprite.texture && sprite.texture.valid) {
			const texWidth = sprite.texture.width;
			const texHeight = sprite.texture.height;
			const texAspect = texWidth / texHeight;
			const spriteAspect = spriteWidth / spriteHeight;

			let scaleFit;
			if (spriteAspect > texAspect) {
				// Fit texture by height
				scaleFit = sprite.height / texHeight;
			} else {
				// Fit texture by width
				scaleFit = sprite.width / texWidth;
			}

			sprite.scale.set(scaleFit);

			const anchor =
				options.anchor &&
				options.anchor.x !== undefined &&
				options.anchor.y !== undefined
					? options.anchor
					: { x: 0.5, y: 0.5 };
			sprite.anchor.set(anchor.x, anchor.y);

			// Position is aligned to the anchor
			sprite.position.set(newX, newY);

			// Update control buttons if present
			PIXIHandler.updateControlButtonsPosition(
				sprite,
				tile,
				isBgTransition
			);
		}
	}

	static async AdjustImageToCover(container, imageSprite) {
		const containerWidth = container.width;
		const containerHeight = container.height;

		const imageRatio = imageSprite.width / imageSprite.height;
		const containerRatio = containerWidth / containerHeight;

		let newWidth, newHeight;

		if (containerRatio > imageRatio) {
			// Fill width, crop top/bottom
			newWidth = containerWidth;
			newHeight = newWidth / imageRatio;
		} else {
			// Fill height, crop left/right
			newHeight = containerHeight;
			newWidth = newHeight * imageRatio;
		}

		imageSprite.width = newWidth;
		imageSprite.height = newHeight;

		// Center the image
		imageSprite.position.set(containerWidth / 2, containerHeight / 2);
		imageSprite.anchor.set(0.5);
	}

	// Add two control buttons (hide, clear) and a resize handle to a sprite, and add drag/resize functionality.
	static addControlButtons(sprite, type) {
		if (!IS_GM()) return;

		// Destroy old controls if they exist
		if (sprite.__controls) {
			sprite.__controls.destroy({
				children: true,
				texture: true,
				baseTexture: false,
			});
		}

		const controls = new PIXI.Container();
		controls.interactive = true;
		controls.interactiveChildren = true;

		function getTileForType(type) {
			switch (type) {
				case Tile.TileType.NPC:
					return StageManager.shared()?.stage?.npc;
				case Tile.TileType.FOCUS:
					return StageManager.shared()?.stage?.focus;
				case Tile.TileType.VFX:
					return StageManager.shared()?.stage?.vfx;
				case Tile.TileType.LIGHT:
					// Find the light by the sprite's name (assumed to be id)
					const name = sprite.name;
					return StageManager.shared()?.stage?.lights?.find(
						(l) => l.id === name
					);
				default:
					return null;
			}
		}

		function createButton(drawFunc, drawFuncArgs, callback, opts = {}) {
			const button = new PIXI.Container();

			const background = new PIXI.Graphics();
			background.beginFill(0x000000, 0.6).drawCircle(0, 0, 12).endFill();
			background.interactive = true;
			background.buttonMode = true;
			background.cursor = opts.cursor || 'pointer';
			background.hitArea = new PIXI.Circle(0, 0, 12);

			const icon = new PIXI.Graphics();
			drawFunc(icon, ...(drawFuncArgs || []));

			button.addChild(background);
			button.addChild(icon);

			button.interactive = true;
			button.buttonMode = true;
			button.cursor = opts.cursor || 'pointer';
			button.hitArea = new PIXI.Circle(0, 0, 12);
			if (callback) button.on('pointerdown', callback);

			button.__icon = icon;
			button.__drawFunc = drawFunc;
			button.__drawFuncArgs = drawFuncArgs;

			return button;
		}

		// Draws an eye icon. If isOpen is true, open eye; if false, closed (crossed) eye.
		function drawEyeIcon(g, isOpen) {
			g.clear();
			g.lineStyle(2, 0xffffff);
			g.drawEllipse(0, 0, 6, 4);
			if (isOpen) {
				g.moveTo(-2, 0);
				g.drawCircle(0, 0, 1.5);
			} else {
				// Draw a line across the eye to indicate closed
				g.moveTo(-6, -4);
				g.lineTo(6, 4);
			}
		}

		function drawXIcon(g) {
			g.clear();
			g.lineStyle(2, 0xffffff)
				.moveTo(-4, -4)
				.lineTo(4, 4)
				.moveTo(-4, 4)
				.lineTo(4, -4);
		}

		// Draws a clear diagonal cross for resize (bottom-right corner style).
		function drawResizeHandleIcon(g) {
			g.clear();
			g.lineStyle(2, 0xffffff);
			g.moveTo(-6, 6);
			g.lineTo(6, -6);
			g.moveTo(0, 6);
			g.lineTo(6, 0);
			g.moveTo(3, 6);
			g.lineTo(6, 3);
			// Optionally: add a small L-corner for visual hint
			g.moveTo(6, 6);
			g.lineTo(6, 2);
			g.moveTo(6, 6);
			g.lineTo(2, 6);
		}

		// Determine if the sprite is visible to players (not just GM)
		let tile = null;
		switch (type) {
			case Tile.TileType.NPC:
				tile = StageManager.shared()?.stage?.npc;
				break;
			case Tile.TileType.FOCUS:
				tile = StageManager.shared()?.stage?.focus;
				break;
			case Tile.TileType.VFX:
				tile = StageManager.shared()?.stage?.vfx;
				break;
			case Tile.TileType.LIGHT:
				// Find the light by the sprite's name (assumed to be id)
				const name = sprite.name;
				tile = StageManager.shared()?.stage?.lights?.find(
					(l) => l.id === name
				);
				break;
			default:
				tile = StageManager.shared()?.stage?.npc;
		}
		const isVisibleToPlayers = tile?.pixiOptionsRuntime?.visible ?? false;

		const hideButton = createButton(
			drawEyeIcon,
			[isVisibleToPlayers],
			() => {
				const tile = getTileForType(type);
				if (!tile) return;
				tile.pixiOptionsRuntime.visible =
					!tile.pixiOptionsRuntime.visible;
				StageManager.shared().toggleTileVisibility(type);
				drawEyeIcon(hideButton.__icon, tile.pixiOptionsRuntime.visible);
			}
		);

		const clearButton = createButton(drawXIcon, [], () => {
			const tile = getTileForType(type);
			if (!tile) return;
			StageManager.shared().clearTile(type, tile);
		});

		// --- Resize handle button ---
		let resizing = false;
		let resizeStart = null;
		let origSize = null;
		let origPos = null;
		let origScale = null;
		let lastPointer = null;
		const resizeHandle = createButton(drawResizeHandleIcon, [], null, {
			cursor: 'nwse-resize',
		});
		resizeHandle.on('pointerdown', (event) => {
			event.stopPropagation();
			resizing = true;
			const pos = event.data.global;
			resizeStart = { x: pos.x, y: pos.y };
			origSize = { width: sprite.width, height: sprite.height };
			origPos = { x: sprite.position.x, y: sprite.position.y };
			lastPointer = { x: pos.x, y: pos.y };
			resizeHandle.data = event.data;
			// Prevent sprite drag while resizing
			sprite.dragging = false;
			sprite.dragOffset = null;
			sprite.pixiOptionsRuntime.isResizing =
				tile.pixiOptionsRuntime.isResizing = true;
			// Listen on stage for global pointermove/up
			const stage = StageManager.shared()?.PIXIApp?.stage;
			if (stage) {
				stage.on('pointermove', onResizeMove);
				stage.on('pointerup', onResizeEnd);
				stage.on('pointerupoutside', onResizeEnd);
			}
		});

		function onResizeMove(event) {
			if (!resizing) return;
			const pointer = resizeHandle.data.global;
			const dx = pointer.x - resizeStart.x;
			const dy = pointer.y - resizeStart.y;
			// Special handling for LIGHT tile type: scale instead of resize
			if (type === Tile.TileType.LIGHT) {
				const avgScaleDelta = (dx + dy) / 2;
				const baseScale = tile.pixiOptions?.baseScale ?? 1;
				const newScale = Math.max(0.1, baseScale + avgScaleDelta / 200); // Adjustable factor
				sprite.scale.set(newScale);
				// tile.pixiOptions.baseScale = newScale;
				// return;
			}
			let newWidth = Math.max(10, origSize.width + dx);
			let newHeight = Math.max(10, origSize.height + dy);
			const aspect = origSize.width / origSize.height;
			let forceProportional = true;
			if (
				event.data.originalEvent &&
				(event.data.originalEvent.shiftKey ||
					event.data.originalEvent.ctrlKey)
			) {
				forceProportional = false;
			}
			if (forceProportional) {
				// Always keep aspect ratio unless Shift or Ctrl
				if (Math.abs(dx) > Math.abs(dy)) {
					newHeight = newWidth / aspect;
				} else {
					newWidth = newHeight * aspect;
				}
			}
			sprite.width = newWidth;
			sprite.height = newHeight;
			// Do not snap/jump: update immediately and keep anchor fixed
		}

		function onResizeEnd() {
			if (!resizing) return;
			resizing = false;
			sprite.pixiOptionsRuntime.isResizing = false;
			resizeStart = null;
			origSize = null;
			origPos = null;
			lastPointer = null;
			resizeHandle.data = null;
			const stage = StageManager.shared()?.PIXIApp?.stage;
			if (stage) {
				stage.off('pointermove', onResizeMove);
				stage.off('pointerup', onResizeEnd);
				stage.off('pointerupoutside', onResizeEnd);
			}
			// Special handling for LIGHT tile type: persist scale as baseScale
	
			PIXIHandler.updateControlButtonsPosition(sprite, tile);
			PIXIHandler.sendSpriteChangesToSocket(tile);
		}

		controls.addChild(hideButton);
		controls.addChild(clearButton);
		controls.addChild(resizeHandle);

		// --- Make the parent sprite draggable (no jump on drag, no conflict with resize) ---
		sprite.interactive = true;
		sprite.buttonMode = true;
		sprite
			.on('pointerdown', (event) => {
				// Prevent drag if pointerdown was on a control button (especially resizeHandle)
				if (
					event.target &&
					controls.children.includes(event.target.parent)
				) {
					const idx = controls.children.indexOf(event.target.parent);
					if (idx === 2) return; // 2 = resizeHandle: do not drag
				}
				// Prevent drag if resizing is active
				if (resizing) return;
				sprite.dragging = true;
				const pos = event.data.getLocalPosition(sprite.parent);
				sprite.dragOffset = {
					x: pos.x - sprite.position.x,
					y: pos.y - sprite.position.y,
				};
			})
			.on('pointerup', () => {
				sprite.dragging = false;
				sprite.dragOffset = null;
				PIXIHandler.updateControlButtonsPosition(sprite, tile);
				PIXIHandler.sendSpriteChangesToSocket(tile);
			})
			.on('pointerupoutside', () => {
				sprite.dragging = false;
				sprite.dragOffset = null;
			})
			.on('pointermove', (event) => {
				if (resizing) return; // Never drag while resizing
				if (!sprite.dragging) return;
				const pos = event.data.getLocalPosition(sprite.parent);
				sprite.position.set(
					pos.x - sprite.dragOffset.x,
					pos.y - sprite.dragOffset.y
				);
			});

		if (sprite.parent) {
			sprite.parent.interactive = true;
			sprite.parent.interactiveChildren = true;
		}
		sprite.parent.addChild(controls);
		sprite.__controls = controls;

		// Clean up event listeners on destroy
		const origDestroy = controls.destroy.bind(controls);
		controls.destroy = function (...args) {
			const stage = StageManager.shared()?.PIXIApp?.stage;
			if (stage) {
				stage.off('pointermove', onResizeMove);
				stage.off('pointerup', onResizeEnd);
				stage.off('pointerupoutside', onResizeEnd);
			}
			origDestroy(...args);
		};

		PIXIHandler.updateControlButtonsPosition(sprite, tile);
	}

	static updateControlButtonsPosition(sprite, tile, isBgTransition = false) {
		if (!sprite.__controls || !IS_GM()) return;
		const controls = sprite.__controls;
		// Controls' position: align top-right for hide/clear, bottom-right for resize
		const w = sprite.width;
		const h = sprite.height;
		const anchorX = sprite.anchor?.x ?? 0;
		const anchorY = sprite.anchor?.y ?? 0;
		// The absolute top-right (for hide/clear) and bottom-right (for resize)
		const topRight = {
			x: sprite.position.x + w * (1 - anchorX),
			y: sprite.position.y - h * anchorY,
		};
		const bottomRight = {
			x: sprite.position.x + w * (1 - anchorX),
			y: sprite.position.y + h * (1 - anchorY),
		};
		// Controls container: put at top-right for hide/clear
		controls.position.set(topRight.x, topRight.y);
		if (controls.children.length >= 3) {
			controls.children[0].position.set(-32, 0); // Hide button
			controls.children[1].position.set(-8, 0); // Clear button
			// Resize handle: position at bottom-right relative to controls (which is at sprite's top-right)
			const resizeX = 0;
			const resizeY = h;
			controls.children[2].position.set(resizeX, resizeY);
		}

		if (tile && sprite) {
			const renderer = StageManager.shared().PIXIApp.renderer;
			const screenWidth = renderer.width;
			const screenHeight = renderer.height;
			const scale = sprite.scale.x || 1;

			PIXIHandler.storePixiRuntimeOptions(
				isBgTransition,
				tile,
				sprite,
				screenWidth,
				screenHeight,
				scale
			);
		}
	}

	static async storePixiRuntimeOptions(
		isBgTransition,
		tile,
		sprite,
		screenWidth,
		screenHeight,
		scale = 1
	) {
		// Prevent feedback loop during window resize events
		if (isBgTransition) return;

		if (!tile.pixiOptionsRuntime) tile.pixiOptionsRuntime = {};
		tile.pixiOptionsRuntime.width = sprite.width;
		tile.pixiOptionsRuntime.height = sprite.height;
		// Use new normalized position calculation
		tile.pixiOptionsRuntime.pX = sprite.position.x;
		tile.pixiOptionsRuntime.pY = sprite.position.y;
		tile.pixiOptionsRuntime.anchor = tile.pixiOptions.anchor;
		tile.pixiOptionsRuntime.screenWidth = screenWidth;
		tile.pixiOptionsRuntime.screenHeight = screenHeight;
		tile.pixiOptionsRuntime.scale = scale;
	}

	static async sendSpriteChangesToSocket(tile) {
		if (IS_GM()) {
			if (!StageManager._updateDebounceMap) {
				StageManager._updateDebounceMap = new Map();
			}
			const key = tile.tileType;
			if (StageManager._updateDebounceMap.has(key)) {
				clearTimeout(StageManager._updateDebounceMap.get(key));
			}
			const timeout = setTimeout(() => {
				StageManager._updateDebounceMap.delete(key);
				StageManager.shared().updateTile(tile);
			}, 1000);
			StageManager._updateDebounceMap.set(key, timeout);
		}
	}

	static async addBorderAroundSprite(sprite, borderTexturePath) {
		const texture = await PIXI.Assets.load(borderTexturePath);

		const border = new PIXI.NineSlicePlane(
			texture,
			10, // left slice
			10, // top slice
			10, // right slice
			10 // bottom slice
		);

		border.width = sprite.width;
		border.height = sprite.height;
		border.position.set(sprite.x, sprite.y);
		border.zIndex = sprite.zIndex - 1; // behind the sprite

		// Attach the border to the same parent
		sprite.parent.addChild(border);
		border.name = `${sprite.name}_border`;

		// Make a reference for later resize
		sprite.__border = border;
	}

	static async toggleSpriteVisibility(PIXIApp, tile) {
		if (!tile) return;
		let spriteContainer = null;
		let sprite = null;
		switch (tile.tileType) {
			case Tile.TileType.NPC:
				spriteContainer = PIXIApp.stage.getChildByName(
					PIXIHandler.PIXI_WRAPPERS.NPC_ID
				);
				sprite = spriteContainer.getChildByName(
					PIXIHandler.PIXI_DO.NPC_ID
				);
				break;
			case Tile.TileType.FOCUS:
				spriteContainer = PIXIApp.stage.getChildByName(
					PIXIHandler.PIXI_WRAPPERS.FOCUS_ID
				);
				sprite = spriteContainer.getChildByName(
					PIXIHandler.PIXI_DO.FOCUS_ID
				);
				break;
			case Tile.TileType.VFX:
				spriteContainer = PIXIApp.stage.getChildByName(
					PIXIHandler.PIXI_WRAPPERS.VFX_ID
				);
				sprite = spriteContainer.getChildByName(
					PIXIHandler.PIXI_DO.VFX_ID
				);
				break;
			default:
				break;
		}
		if (sprite && tile) {
			const { visible, maxAlpha } = PIXIHandler.getVisibilityByRole(
				sprite,
				tile
			);

			sprite.visible = visible;
			sprite.alpha = maxAlpha;
		}
	}

	static getVisibilityByRole(sprite, tile) {
		if (!sprite || !tile) return;

		const { visible, alpha } = tile.pixiOptionsRuntime ||
			tile.pixiOptions || {
				visible: false,
				alpha: 1,
			};

		let _visible = visible;
		let _alpha = alpha || 1;

		if (IS_GM()) {
			// GM: show it anyway, but half transparent if the tile was supposed to be invisible
			_visible = true;
			_alpha = visible ? _alpha : 0.5;
		} else {
			// Players: follow the tile visibility
			_alpha = visible ? _alpha : 0;
		}
		return { visible: _visible, maxAlpha: _alpha };
	}

	static async FadeOutAndRemovePIXIApp() {
		const mbCanvas = document.getElementById(CONFIG.MB_CANVAS_ID);
		if (!mbCanvas) return;

		return new Promise((resolve) => {
			mbCanvas.style.opacity = '0'; // Triggers the CSS transition
			setTimeout(() => {
				mbCanvas.remove();
				resolve();
			}, 1000); // Same as the CSS transition duration
		});
	}
}
