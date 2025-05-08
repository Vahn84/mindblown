import { createLightSourceSprite } from './light-source-sprite.js';
import { logger } from './utilities.js';
import { PIXIHandler } from './pixi-handler.js';
import { StageManager } from './stage-manager.js';

export class AmbientLightingManager extends PIXI.Container {
	constructor({ width, height, darkness = 1.0 }) {
		super();

		this.width = width;
		this.height = height;
		this.lights = [];

		this._ticker = new PIXI.Ticker();
		this._ticker.add(this._animateLights, this);
		this._ticker.start();

		this.lightContainer = new PIXI.Container();
		this.lightContainer.blendMode = PIXI.BLEND_MODES.ADD;

		this.lightMask = PIXI.RenderTexture.create({ width, height });
		// this.lightMaskSprite = new PIXI.Sprite(this.lightMask);
		// this.lightMaskSprite.visible = true; // for debugging

		const darknessTexture = PIXI.Texture.WHITE;
		this._darkness = new PIXI.Sprite(darknessTexture);
		this._darkness.width = width;
		this._darkness.height = height;
		this._darkness.interactive = false;
		this._darkness.interactiveChildren = false;
		this._darkness.eventMode = 'none'; // for PIXI v7+ (if you're using it)

		const fragment = `
  precision mediump float;
  varying vec2 vTextureCoord;
  uniform sampler2D uLightMask;
  uniform float uDarkness;
  uniform vec2 uResolution;

  void main(void) {
    vec2 uv = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uResolution;
    float light = texture2D(uLightMask, uv).r;
    float feather = 0.8; // Increase to make edges softer
    float lightFeathered = smoothstep(0.0, feather, light);
    float shadow = 1.0 - lightFeathered;
    float alpha = shadow * uDarkness;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
  `;

		this._darknessFilter = new PIXI.Filter(undefined, fragment, {
			uLightMask: this.lightMask,
			uDarkness: darkness,
			uResolution: [width, height],
		});

		this._darkness.filters = [this._darknessFilter];
		this._darkness.blendMode = PIXI.BLEND_MODES.NORMAL;

		// this.addChild(this.lightMaskSprite);
		this.addChild(this._darkness);
		this.addChild(this.lightContainer);
	}

	_animateLights() {
		const time = performance.now() * 0.002;

		for (const light of this.lights) {
			const isResizing = light.pixiOptionsRuntime?.isResizing;
			if (isResizing) continue; // Skip animation if resizing
			const mode = light.pixiOptions.animated;
			const baseScale = light.pixiOptionsRuntime?.scale ?? 1;
			const baseScaleX = light.pixiOptionsRuntime.finalScaleX ?? 1;
			const baseScaleY = light.pixiOptionsRuntime.finalScaleY ?? 1;
			let eased = 1;

			// Ensure stable seed and eased value for each light
			if (!light.seed) light.seed = Math.random() * 1000;
			if (light._eased === undefined) light._eased = 1;

			switch (mode) {
				case 'torch':
					// Random noisy flicker
					eased = 0.85 + 0.15 * Math.random();
					break;

				case 'pulse':
					const pulse = 0.5 + 0.5 * Math.cos(time + light.seed);
					const target = 0.8 + 0.2 * pulse;
					light._eased += (target - light._eased) * 0.1; // Smoothing
					eased = light._eased;
					break;

				case 'candle':
					// Slower noise-based flicker
					eased = 0.9 + 0.1 * Math.sin(time * 2 + light.x);
					break;

				case 'none':
				default:
					eased = 1;
					break;
			}

			light.alpha = eased;
			light.scale.set(baseScaleX * eased, baseScaleY * eased);
		}
	}

	/**
	 * Add a new light source.
	 * @param {Object} options - See LightSourceSprite for config
	 */
	addLight(PIXIApp, tile) {
		let light = createLightSourceSprite(PIXIApp, tile.pixiOptions);
		light.name = tile.id;
		light.pixiOptions = tile.pixiOptions;
		light.pixiOptionsRuntime = tile.pixiOptionsRuntime;
		this.lightContainer.addChild(light);
		this.lights.push(light);
		this.addDragAndDrop(PIXIApp, light);
		return light;
	}

	/**
	 * Set the overall darkness level (0 = day, 1 = night)
	 */
	setDarknessLevel(value) {
		this._darknessFilter.uniforms.uDarkness = Math.min(
			Math.max(value, 0),
			1
		);
	}

	clearLights() {
		this.lights.forEach((l) => l.destroy());
		this.lightContainer.removeChildren();
		this.lights = [];
	}

	resize(PIXIApp, { width, height }, bgSprite) {
		this.width = width;
		this.height = height;

		// Resize and reposition the darkness sprite
		this._darkness.width = width;
		this._darkness.height = height;
		this._darkness.position.set(0, 0);
		// this._darkness.scale.set(width, height);
		// Recreate the light mask render texture
		this.lightMask.destroy(true);
		logger(`Resizing light mask to ${width}, ${height}`);
		this.lightMask = PIXI.RenderTexture.create({ width, height });

		// Update the filter uniforms with new resolution and light mask
		this._darknessFilter.uniforms.uResolution = [width, height];
		this._darknessFilter.uniforms.uLightMask = this.lightMask;
		this._darkness.filters = [];
		this._darkness.filters = [this._darknessFilter];

		this.resizeLights(PIXIApp, width, height, bgSprite);
	}

	setDarknessLevel(PIXIApp, darkness) {
		this._darknessFilter.uniforms.uDarkness = darkness;
		this._darkness.filters = [];
		this._darkness.filters = [this._darknessFilter];
		this.updateLightMask(PIXIApp.renderer);
	}

	async resizeLights(PIXIApp, width, height, bgSprite) {
		for (const light of this.lights) {
			const options = light.pixiOptionsRuntime || light.pixiOptions || {};
			const {
				pX = 0,
				pY = 0,
				screenWidth = 1920,
				screenHeight = 1080,
				originalScaleX = 1,
				originalScaleY = 1,
				baseScale = 1,
			} = options;

			const pixiOptions = light.pixiOptions || {};

			// Use bgSprite for position and scale reference
			const scaleX = bgSprite.width / screenWidth;
			const scaleY = bgSprite.height / screenHeight;

			const newX = bgSprite.position.x + pX * scaleX;
			const newY = bgSprite.position.y + pY * scaleY;

			light.x = newX;
			light.y = newY;

			const scale = Math.min(scaleX, scaleY);
			logger(
				`scale: ${scale}, screenWith: ${screenWidth}, screenHeight: ${screenHeight}, width: ${width}, height: ${height}`
			);
			const finalScaleX = baseScale * scale;
			const finalScaleY = baseScale * scale;

			light.scale.set(finalScaleX, finalScaleY);

			light.pixiOptionsRuntime.finalScaleX = finalScaleX;
			light.pixiOptionsRuntime.finalScaleY = finalScaleY;

			logger(light);
		}
		this.updateLightMask(PIXIApp.renderer);
	}
	/**
	 * Render the current lights into the light mask render texture.
	 * Should be called every frame from the main render loop.
	 * @param {PIXI.Renderer} renderer
	 */
	updateLightMask(renderer) {
		this.lightContainer.position.set(0, 0);
		this.lightContainer.pivot.set(0, 0);
		this.lightContainer.scale.set(1);
		// // Defensive: ensure all lights use screen positions
		this.lights.forEach((light) => {
			light.position.set(light.x, light.y); // enforce screen alignment
		});
		// // Render the light container into the mask texture

		renderer.render(this.lightContainer, {
			renderTexture: this.lightMask,
			clear: true,
		});
	}

	async addDragAndDrop(PIXIApp, sprite) {
		sprite.interactive = true;
		sprite.buttonMode = true;
		sprite
			.on('pointerdown', (event) => {
				// Prevent drag if resizing is active
				if (sprite.resizing) return;
				sprite.dragging = true;
				const pos = event.data.getLocalPosition(sprite.parent);
				sprite.dragOffset = {
					x: pos.x - sprite.position.x,
					y: pos.y - sprite.position.y,
				};
			})
			.on('pointerup', async () => {
				sprite.dragging = false;
				sprite.dragOffset = null;
				const bgContainer =
					StageManager.shared().PIXIApp.stage.getChildByName(
						PIXIHandler.PIXI_WRAPPERS.BG_ID
					);
				const bgSprite = bgContainer.getChildByName(
					PIXIHandler.PIXI_DO.BG_ID
				);
				if (!bgSprite) {
					return;
				}
				const scaleX = bgSprite.width / sprite.pixiOptions.screenWidth;
				const scaleY =
					bgSprite.height / sprite.pixiOptions.screenHeight;

				sprite.pixiOptionsRuntime.pX =
					(sprite.x - bgSprite.position.x) / scaleX;
				sprite.pixiOptionsRuntime.pY =
					(sprite.y - bgSprite.position.y) / scaleY;

				this.updateLightMask(PIXIApp.renderer);
				const tile = StageManager.shared().getLightById(sprite.name);
				if (tile) {
					tile.pixiOptionsRuntime = sprite.pixiOptionsRuntime;
					PIXIHandler.sendSpriteChangesToSocket(tile);
				}
			})
			.on('pointerupoutside', () => {
				sprite.dragging = false;
				sprite.dragOffset = null;
			})
			.on('pointermove', (event) => {
				if (sprite.resizing) return; // Never drag while resizing
				if (!sprite.dragging) return;
				const pos = event.data.getLocalPosition(sprite.parent);
				sprite.position.set(
					pos.x - sprite.dragOffset.x,
					pos.y - sprite.dragOffset.y
				);
			});
	}
}
