import { Tile } from './tile.js';
import { Stage } from './stage.js';
import { logger } from './utilities.js';
import { VFX, VFX_TYPES } from './effects.js';
import CONFIG from './config.js';

export class PIXIHandler {
	static customPixiParticles = CustomPixiParticles.customPixiParticles;
	static PIXI_WRAPPERS = {
		BG_ID: 'bgContainer',
		NPC_ID: 'npcContainer',
		VFX_ID: 'vfxContainer',
		OBJ_ID: 'objContainer',
	};
	static PIXI_DO = {
		BG_ID: 'bgSprite',
		BBG_ID: 'blurryBgSprite',
		VFX_ID: 'particles',
		OBJ_ID: 'objSprite',
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
			});
		}

		_PIXIApp.view.id = CONFIG.MB_CANVAS_ID;
		const foundryCanvas = $(`#${CONFIG.FVTT_CANVAS_ID}`);
		const mbCanvas = $(`#${CONFIG.MB_CANVAS_ID}`);
		if (!mbCanvas) {
			mbCanvas.remove();
		}
		foundryCanvas.after(_PIXIApp.view);
		_PIXIApp.stage.interactive = true;
		return _PIXIApp;
	}

	static async SetupPIXIAppStage(PIXIApp, bg, originalWidth, originalHeight) {
		const texture = await PIXI.Assets.load(bg.path);

		const bgSprite = new PIXI.Sprite(texture);
		const blurryBgSprite = new PIXI.Sprite(texture);
		bgSprite.name = PIXIHandler.PIXI_DO.BG_ID;
		blurryBgSprite.name = PIXIHandler.PIXI_DO.BBG_ID;

		const bgContainer = new PIXI.Container();
		const npcContainer = new PIXI.Container();
		const objContainer = new PIXI.Container();
		const vfxContainer = new PIXI.Container();

		bgContainer.name = PIXIHandler.PIXI_WRAPPERS.BG_ID;
		npcContainer.name = PIXIHandler.PIXI_WRAPPERS.NPC_ID;
		objContainer.name = PIXIHandler.PIXI_WRAPPERS.OBJ_ID;
		vfxContainer.name = PIXIHandler.PIXI_WRAPPERS.VFX_ID;

		PIXIHandler.AdjustImageToCover(
			{ width: PIXIApp.screen.width, height: PIXIApp.screen.height },
			blurryBgSprite
		);

		bgSprite.position.set(0, 0);
		blurryBgSprite.anchor.set(0.5);
		const blurFilter = new PIXI.BlurFilter();
		blurryBgSprite.filters = [blurFilter];
		blurFilter.blur = 5;

		bgContainer.addChild(blurryBgSprite);
		bgContainer.addChild(bgSprite);
		// bgContainer.addChild(vfxContainer);
		PIXIApp.stage.addChild(bgContainer);
		PIXIApp.stage.addChild(npcContainer);
		PIXIApp.stage.addChild(objContainer);
		PIXIApp.stage.addChild(vfxContainer);

		bgContainer.position.set(0, 0);
		npcContainer.position.set(0, 0);
		objContainer.position.set(0, 0);
		vfxContainer.position.set(0, 0);

		await PIXIHandler.AddPIXIParticlesEffect(
			PIXIApp,
			VFX_TYPES.SWIRLING_FOG,
			{
				x: originalWidth / 2,
				y: originalHeight / 2,
			}
		);
		// PIXIHandler.ShaderFragment(PIXIApp);
		PIXIHandler.ResizeStage(PIXIApp, originalWidth, originalHeight);

		window.addEventListener('resize', () => {
			PIXIHandler.ResizeStage(PIXIApp, originalWidth, originalHeight);
		});
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

		PIXIHandler.ResizeStageBg(
			bgSprite,
			blurryBgSprite,
			originalWidth,
			originalHeight
		);
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

	static async ShaderFragment(PIXIApp) {
		const shaderFragment = new PIXI.Sprite();
		shaderFragment.width = window.innerWidth;
		shaderFragment.height = window.innerHeight;
		PIXIApp.stage.addChild(shaderFragment);

		const fogFragment = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_alpha;

float random(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b - c + a) * u.x * u.y;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    for (int i = 0; i < 6; ++i) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
  const vec3 c1 = vec3(0.8, 0.8, 0.8);
  const vec3 c2 = vec3(0.5, 0.5, 0.5);

  vec2 p = gl_FragCoord.xy * 8.0 / u_resolution.xx;
  float q = fbm(p - u_time * 0.1);
  vec2 r = vec2(fbm(p + q + u_time * 0.4 - p.x - p.y), fbm(p + q - u_time * 0.7));
  vec3 c = mix(c1, c2, fbm(p + r));
  float grad = gl_FragCoord.y / u_resolution.y;
  gl_FragColor = vec4(c * cos(1.4 * gl_FragCoord.y / u_resolution.y), u_alpha);
  gl_FragColor.xyz *= 0.5 + grad;
  gl_FragColor.a *= u_alpha;
}

`;

		const fogShader = new PIXI.Filter(null, fogFragment, {
			u_time: 0,
			u_resolution: {
				x: window.innerWidth * window.devicePixelRatio,
				y: window.innerHeight * window.devicePixelRatio,
			},
			u_alpha: 0.2,
		});
		shaderFragment.filters = [fogShader];

		PIXIApp.ticker.add((delta) => {
			if (fogShader) {
				fogShader.uniforms.u_time += 0.005;
			}
		});
	}
}

// Add resize handle to a wrapper, accounting for background scaling
function addResizeHandleToWrapper(wrapper, particles, bgSprite) {
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
