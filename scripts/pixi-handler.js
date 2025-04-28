import { Tile } from './tile.js';
import { Stage } from './stage.js';
import { IS_GM, logger } from './utilities.js';
import { VFX, VFX_TYPES } from './effects.js';
import CONFIG from './config.js';
import { StageManger } from './stage-manager.js';

export class PIXIHandler {
	static customPixiParticles = CustomPixiParticles.customPixiParticles;
	static PIXI_WRAPPERS = {
		BG_ID: 'bgContainer',
		NPC_ID: 'npcContainer',
		VFX_ID: 'vfxContainer',
		FOCUS_ID: 'focusContainer',
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
		VFX_ID: 'particles',
		VFX_ID_TMP: 'particlesTmp',
	};

	static async InitPIXIApp(PIXIApp) {
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
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
				resizeTo: window,
				background: '#000000',
				backgroundAlpha: 0,
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

	static async setNpcOnStage(PIXIApp, npc) {
		if (!npc) {
			PIXIApp.ticker.add(PIXIHandler.spriteTickerTransitionOut, this);
			return;
		}
		const npcContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.NPC_ID
		);
		const texture = await PIXI.Assets.load(npc.path);
		const newNpcSprite = new PIXI.Sprite(texture);
		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		let bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		newNpcSprite.name = PIXIHandler.PIXI_DO.NPC_ID_TMP;
		newNpcSprite.alpha = 0;
		newNpcSprite.width = npc.pixiOptions.width;
		newNpcSprite.height = npc.pixiOptions.height;
		newNpcSprite.position.set(npc.pixiOptions.pX, npc.pixiOptions.pY);
		npcContainer.addChild(newNpcSprite);
		if (!bgSprite) {
			bgSprite = bgContainer.getChildByName(
				PIXIHandler.PIXI_DO.BG_ID_TMP
			);
		}
		if (StageManger.shared().isBgTransioning) {
			StageManger.shared().addEventListener(
				StageManger.EVENTS.BG_ENDED_TRANSITION,
				async () => {
					await PIXIHandler.ResizeSprite(newNpcSprite, bgSprite, npc);
					PIXIApp.ticker.add(
						PIXIHandler.npcSpriteTickerTransition,
						this
					);
				}
			);
		} else {
			await PIXIHandler.ResizeSprite(newNpcSprite, bgSprite, npc);
			PIXIApp.ticker.add(PIXIHandler.npcSpriteTickerTransition, this);
		}
	}

	static async setBgOnStage(PIXIApp, bg) {
		if (!bg) {
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
			newBlurryBgSprite.destroy();
			// newBlurryBgSprite = null;
		}
		StageManger.shared().setIsBgTransitioning(true);
		PIXIApp.ticker.add(PIXIHandler.bgTickerTransition, this);
	}

	static async npcSpriteTickerTransition(delta) {
		let PIXIApp = StageManger.shared().PIXIApp;
		const npcContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.NPC_ID
		);
		const npcSprite = npcContainer.getChildByName(
			PIXIHandler.PIXI_DO.NPC_ID
		);
		const newNpcSprite = npcContainer.getChildByName(
			PIXIHandler.PIXI_DO.NPC_ID_TMP
		);
		newNpcSprite.alpha += 0.01 * delta;
		if (npcSprite) {
			npcSprite.alpha -= 0.01 * delta;
			if (npcSprite.__controls) {
				npcSprite.__controls.destroy();
			}
		}

		const tile = StageManger.shared().stage?.npc;
		const { visible, maxAlpha } = PIXIHandler.getVisibilityByRole(
			newNpcSprite,
			tile
		);

		newNpcSprite.visible = visible;

		if (
			newNpcSprite.alpha >= maxAlpha &&
			(!npcSprite || npcSprite?.alpha <= 0)
		) {
			try {
				PIXIApp.ticker.remove(
					PIXIHandler.npcSpriteTickerTransition,
					this
				);
				if (npcSprite) {
					npcSprite.destroy();
				}
			} catch (error) {
				logger('Error removing old NPC sprite:', error);
			}
			newNpcSprite.name = PIXIHandler.PIXI_DO.NPC_ID;

			// Always add the control buttons at the end
			PIXIHandler.addControlButtons(newNpcSprite, Tile.TileType.NPC);
		}
	}

	static async spriteTickerTransitionOut(delta) {
		let PIXIApp = StageManger.shared().PIXIApp;
		const npcContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.NPC_ID
		);
		const npcSprite = npcContainer.getChildByName(
			PIXIHandler.PIXI_DO.NPC_ID
		);
		if (!npcSprite) return;

		npcSprite.alpha -= 0.01 * delta;

		if (npcSprite.alpha <= 0) {
			try {
				PIXIApp.ticker.remove(
					PIXIHandler.spriteTickerTransitionOut,
					this
				);
				npcSprite.destroy();
				if (npcSprite.__controls) {
					npcSprite.__controls.destroy();
				}
			} catch (error) {
				logger('Error removing NPC sprite:', error);
			}
		}
	}

	static async bgTickerTransition(delta) {
		let PIXIApp = StageManger.shared().PIXIApp;

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
			StageManger.shared().stage?.bg?.pixiOptions?.alpha || 1;
		if (
			newBgSprite.alpha >= maxAlpha &&
			(!bgSprite || bgSprite?.alpha <= 0)
		) {
			try {
				PIXIApp.ticker.remove(PIXIHandler.bgTickerTransition, this);
				if (bgSprite) {
					bgSprite.destroy();
				}
				if (blurryBgSprite) {
					blurryBgSprite.destroy();
				}
			} catch (error) {
				logger('Error removing old background:', error);
			}
			newBgSprite.name = PIXIHandler.PIXI_DO.BG_ID;
			if (newBlurryBgSprite) {
				newBlurryBgSprite.name = PIXIHandler.PIXI_DO.BBG_ID;
			}
			logger('setting bg sprite Name finally');
			PIXIHandler.ResizeStage(
				PIXIApp,
				window.innerWidth,
				window.innerHeight
			);
			StageManger.shared().setIsBgTransitioning(false);
			StageManger.shared().dispatchEvent(
				StageManger.EVENTS.BG_ENDED_TRANSITION,
				{}
			);
		}
	}

	static async bgTickerTransitionOut(delta) {
		let PIXIApp = StageManger.shared().PIXIApp;
		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);

		if (!bgSprite) return;

		bgSprite.alpha -= 0.01 * delta;

		if (bgSprite.alpha <= 0) {
			try {
				PIXIApp.ticker.remove(PIXIHandler.bgTickerTransitionOut, this);
				bgSprite.destroy();
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

		bgContainer.name = PIXIHandler.PIXI_WRAPPERS.BG_ID;
		npcContainer.name = PIXIHandler.PIXI_WRAPPERS.NPC_ID;
		focusContainer.name = PIXIHandler.PIXI_WRAPPERS.FOCUS_ID;
		vfxContainer.name = PIXIHandler.PIXI_WRAPPERS.VFX_ID;

		// bgContainer.addChild(vfxContainer);
		PIXIApp.stage.addChild(bgContainer);
		PIXIApp.stage.addChild(npcContainer);
		PIXIApp.stage.addChild(focusContainer);
		PIXIApp.stage.addChild(vfxContainer);

		bgContainer.position.set(0, 0);
		npcContainer.position.set(0, 0);
		focusContainer.position.set(0, 0);
		vfxContainer.position.set(0, 0);

		// await PIXIHandler.AddPIXIParticlesEffect(
		// 	PIXIApp,
		// 	VFX_TYPES.SWIRLING_FOG,
		// 	{
		// 		x: originalWidth / 2,
		// 		y: originalHeight / 2,
		// 	}
		// );

		window.addEventListener('resize', () => {
			PIXIHandler.ResizeStage(PIXIApp, originalWidth, originalHeight);
		});
		if (bg) {
			PIXIHandler.setBgOnStage(PIXIApp, bg);
		}
	}

	static async AddPIXIParticlesEffect(PIXIApp, effect, defaultPosition) {
		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const vfxContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.VFX_ID
		);
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
		if (game.user?.isGM) {
			const boxWidth = 50;
			const boxHeight = 20;

			const debugBox = new PIXI.Graphics();
			debugBox.beginFill(0xff0000, 0.3);
			// Always draw box at top-left corner of wrapper
			debugBox.drawRect(0, 0, boxWidth, boxHeight);
			debugBox.endFill();
			debugBox.interactive = false;
			wrapper.hitArea = new PIXI.Rectangle(0, 0, boxWidth, boxHeight);
			wrapper.addChild(debugBox);
		}

		particles.play();
		particles.interactive = false;

		wrapper.position.set(initialX, initialY);

		// Store relative position based on bgSprite
		wrapper.__relativePosition = {
			x: (initialX - bgSprite.position.x) / bgSprite.width,
			y: (initialY - bgSprite.position.y) / bgSprite.height,
		};

		// Make the wrapper draggable
		wrapper.interactive = true;
		wrapper.interactiveChildren = false; // << Prevent children from stealing events
		wrapper.buttonMode = true;

		function onDragMove(event) {
			if (!wrapper.dragging) return;
			const newPos = event.data.getLocalPosition(wrapper.parent);
			const dx = newPos.x - wrapper.dragOffset.x;
			const dy = newPos.y - wrapper.dragOffset.y;
			wrapper.position.set(dx, dy);
			wrapper.__relativePosition = {
				x: (dx - bgSprite.position.x) / bgSprite.width,
				y: (dy - bgSprite.position.y) / bgSprite.height,
			};
		}

		PIXIApp.stage.on('pointerdown', (event) => {
			logger('pointerdown', event);
		});

		wrapper.on('pointerdown', (event) => {
			wrapper.dragging = true;
			const pos = event.data.getLocalPosition(wrapper.parent);
			wrapper.dragOffset = {
				x: pos.x - wrapper.position.x,
				y: pos.y - wrapper.position.y,
			};
			PIXIApp.stage.on('pointermove', onDragMove);
		});

		wrapper.on('pointerup', () => {
			wrapper.dragging = false;
			PIXIApp.stage.off('pointermove', onDragMove);
		});

		wrapper.on('pointerupoutside', () => {
			wrapper.dragging = false;
			PIXIApp.stage.off('pointermove', onDragMove);
		});

		vfxContainer.interactive = true;
		vfxContainer.addChild(wrapper);

		// Add resize handle for GM
		if (game.user?.isGM) {
			addResizeHandleToWrapper(wrapper, particles, bgSprite);
		}
	}

	static async ResizeStage(PIXIApp, originalWidth, originalHeight) {
		let screenWidth = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		);
		let screenHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		);
		PIXIHandler.ResizeRenderer(PIXIApp, screenWidth, screenHeight);

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const vfxContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.VFX_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		const blurryBgSprite = bgContainer.getChildByName(
			PIXIHandler.PIXI_DO.BBG_ID
		);

		const npcContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.NPC_ID
		);
		const npcSprite = npcContainer.getChildByName(
			PIXIHandler.PIXI_DO.NPC_ID
		);
		const focusContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.FOCUS_ID
		);
		const focusSprite = focusContainer.getChildByName(
			PIXIHandler.PIXI_DO.OBJ_ID
		);

		const bgTile = StageManger.shared().stage?.bg;

		if (!bgTile.isDefault) {
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

		const npc = StageManger.shared().stage?.npc;
		const focus = StageManger.shared().stage?.focus;
		const vfxs = StageManger.shared().stage?.vfxs;
		if (npc) {
			PIXIHandler.ResizeSprite(npcSprite, bgSprite, npc);
		}
		if (focus) {
			PIXIHandler.ResizeSprite(focusSprite, bgSprite, focus);
		}
		// PIXIHandler.ResizeSprite(objSprite, bgRef);
		PIXIHandler.ResizeParticlesEffects(vfxContainer, bgSprite);
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

	static async ResizeSprite(sprite, bgRef, tile) {
		if (!sprite || !bgRef || !tile) return;

		const {
			width: originalWidth,
			height: originalHeight,
			pX: originalPX,
			pY: originalPY,
			screenWidth = 1920,
			screenHeight = 1080,
		} = tile.pixiOptions || {};

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

			sprite.anchor.set(0.5, 1); // Center
			sprite.position.set(newX + spriteWidth / 2, newY + spriteHeight);

			// Update control buttons if present
			PIXIHandler.updateControlButtonsPosition(sprite);
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

	// Add two control buttons (hide, clear) to a sprite.
	static addControlButtons(sprite, type) {
		if (!IS_GM()) return;

		// Destroy old controls if they exist
		if (sprite.__controls) {
			sprite.__controls.destroy({
				children: true,
				texture: true,
				baseTexture: true,
			});
		}

		const controls = new PIXI.Container();
		controls.interactive = true;
		controls.interactiveChildren = true;

		function getTileForType(type) {
			if (type === Tile.TileType.NPC)
				return StageManger.shared()?.stage?.npc;
			if (type === Tile.TileType.FOCUS)
				return StageManger.shared()?.stage?.focus;
			if (type === Tile.TileType.VFX)
				return StageManger.shared()?.stage?.vfxs;
			return null;
		}

		function createButton(drawFunc, drawFuncArgs, callback) {
		    const button = new PIXI.Container();

		    const background = new PIXI.Graphics();
		    background.beginFill(0x000000, 0.6).drawCircle(0, 0, 12).endFill();
		    background.interactive = true;
		    background.buttonMode = true;
		    background.cursor = 'pointer';
		    background.hitArea = new PIXI.Circle(0, 0, 12);

		    const icon = new PIXI.Graphics();
		    drawFunc(icon, ...(drawFuncArgs || []));

		    button.addChild(background);
		    button.addChild(icon);

		    button.interactive = true;
		    button.buttonMode = true;
		    button.cursor = 'pointer';
		    button.hitArea = new PIXI.Circle(0, 0, 12);
		    button.on('pointerdown', callback);

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

		// Determine if the sprite is visible to players (not just GM)
		let tile = StageManger.shared()?.stage?.npc;
		if (type === Tile.TileType.FOCUS)
			tile = StageManger.shared()?.stage?.focus;
		if (type === Tile.TileType.VFX)
			tile = StageManger.shared()?.stage?.vfxs;
		const isVisibleToPlayers = tile?.pixiOptions?.visible ?? true;

		const hideButton = createButton(
			drawEyeIcon,
			[isVisibleToPlayers],
			() => {
				const tile = getTileForType(type); // <<< Fetch tile fresh when clicked
				if (!tile) return;

				tile.pixiOptions.visible = !tile.pixiOptions.visible;
				StageManger.shared().toggleTileVisibility(type);
				drawEyeIcon(hideButton.__icon, tile.pixiOptions.visible);
			}
		);

		const clearButton = createButton(drawXIcon, [], () => {
			const tile = getTileForType(type);
			if (!tile) return;
		  
			StageManger.shared().clearTile(type); // You can make a generic clearTile method!
		  });

		controls.addChild(hideButton);
		controls.addChild(clearButton);

		if (sprite.parent) {
		    sprite.parent.interactive = true;
		    sprite.parent.interactiveChildren = true;
		}
		sprite.parent.addChild(controls);
		sprite.__controls = controls;

		PIXIHandler.updateControlButtonsPosition(sprite);
	}

	static updateControlButtonsPosition(sprite) {
		if (!sprite.__controls) return;

		const controls = sprite.__controls;

		const offsetX = sprite.width / 2 - 30;
		const offsetY = -sprite.height;

		controls.position.set(
			sprite.position.x + offsetX,
			sprite.position.y + offsetY
		);

		if (controls.children.length >= 2) {
			controls.children[0].position.set(0, 0); // Hide button
			controls.children[1].position.set(30, 0); // Clear button
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
					PIXIHandler.PIXI_DO.OBJ_ID
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

		const { visible, alpha } = tile.pixiOptions || {
			visible: false,
			alpha: 1,
		};

		let _visible = visible;
		let _alpha = alpha;

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

	static addResizeHandleToWrapper(wrapper, particles, bgSprite) {
		const handleSize = 16;

		const handle = new PIXI.Graphics();
		handle
			.beginFill(0xff0000, 0.6)
			.drawRect(0, 0, handleSize, handleSize)
			.endFill();

		handle.cursor = 'nwse-resize';
		handle.interactive = true;
		handle.buttonMode = true;

		let dragging = false;
		let originalSize = null;

		const updateHandlePosition = () => {
			handle.x = wrapper.width;
			handle.y = wrapper.height;
		};

		handle.on('pointerdown', (event) => {
			dragging = true;
			handle.dragData = event.data;

			const local = handle.dragData.getLocalPosition(wrapper.parent);
			const bgScale = bgSprite.width / bgSprite.texture.width;

			originalSize = {
				x: local.x / (particles.scale.x * bgScale),
				y: local.y / (particles.scale.y * bgScale),
			};
		});

		handle.on('pointerup', () => {
			dragging = false;
			handle.dragData = null;
		});
		handle.on('pointerupoutside', () => {
			dragging = false;
			handle.dragData = null;
		});

		handle.on('pointermove', () => {
			if (!dragging) return;

			const newPos = handle.dragData.getLocalPosition(wrapper.parent);
			const bgScale = bgSprite.width / bgSprite.texture.width;

			const scaleX = Math.max(newPos.x / originalSize.x / bgScale, 0.5);
			const scaleY = Math.max(newPos.y / originalSize.y / bgScale, 0.5);
			const uniform = Math.min(scaleX, scaleY);

			particles.scale.set(uniform);
			updateHandlePosition();
		});

		wrapper.addChild(handle);
		updateHandlePosition();
	}
}
