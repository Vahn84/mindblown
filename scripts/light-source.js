import { Light } from './light.js';
import { Stage } from './stage.js';
import { IS_GM, logger } from './utilities.js';

export class LightSource extends PIXI.Container {
	constructor(pixiOptions) {
		super();
		const {
			pX = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.pX,
			pY = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.pY,
			radius = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.radius,
			color = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color,
			colorIntensity = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
				.colorIntensity,
			alpha = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.alpha,
			type = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.type,
			angle = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.angle,
			rotation = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.rotation,
			screenWidth = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.screenWidth,
			screenHeight = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.screenHeight,
			enableColor = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.enableColor,
			visible = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.visible,
			anchor = Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.anchor,
		} = pixiOptions;

		this.pixiOptions = {};
		this.pixiOptionsRuntime = {};

		this.pixiOptions.pX = pX;
		this.pixiOptions.pY = pY;
		this.pixiOptions.radius = radius;
		this.pixiOptions.color = color;
		this.pixiOptions.colorIntensity = colorIntensity;
		this.pixiOptions.alpha = alpha;
		this.pixiOptions.type = type;
		this.pixiOptions.angle = angle;
		this.pixiOptions.rotation = rotation;
		this.pixiOptions.screenWidth = screenWidth;
		this.pixiOptions.screenHeight = screenHeight;
		this.pixiOptions.enableColor = enableColor;
		this.pixiOptions.visible = visible;
		this.pixiOptions.anchor = anchor;
		this._tickerUpdate = null;
	}

	cleanup() {
		if (this._ticker && this._tickerUpdate) {
			this._ticker.remove(this._tickerUpdate);
			this._tickerUpdate = null;
		}
		this.ticker = null;
		this.removeChildren();
	}

	getOptions() {
		return this.pixiOptions;
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setPixiOptionsRuntime(pixiOptionsRuntime) {
		this.pixiOptionsRuntime = pixiOptionsRuntime;
		return this;
	}

	static create(PIXIApp, pixiOptions, callback) {
		const lightSource = new LightSource(pixiOptions);

		if (!lightSource.pixiOptions.visible) {
			if (IS_GM()) {
				PIXI.Assets.load('/icons/svg/light.svg').then((icon) => {
					const sprite = new PIXI.Sprite(icon);
					sprite.anchor.set(0.5, 0.5);
					sprite.width = 32;
					sprite.height = 32;
					sprite.position.set(0, 0);
					sprite.alpha = 0.5;
					sprite.tint = 0xffffff;

					lightSource.addChild(sprite);
				});
			}
			// lightSource.position.set(pixiOptions.pX, pixiOptions.pY);
			return lightSource;
		}

		lightSource._ticker = PIXIApp.ticker;
		// lightSource.anchor.set(pixiOptions.anchor.x, pixiOptions.anchor.y);
		// lightSource.position.set(pixiOptions.pX, pixiOptions.pY);
		const radius = pixiOptions.radius;

		switch (lightSource.pixiOptions.type) {
			case Light.TYPE.smokePatch: {
				logger('color', lightSource.pixiOptions.color);
				const light = Light.SmokePatch(
					lightSource.pixiOptions.radius,
					lightSource.pixiOptions.blendMode,
					{
						maxAlpha: lightSource.pixiOptions.alpha,
						color: lightSource.pixiOptions.enableColor
							? lightSource.pixiOptions.color
							: Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color,
						colorIntensity: lightSource.pixiOptions.colorIntensity,
					}
				);

				lightSource.addChild(light.illumination);
				lightSource.addChild(light.coloration);

				lightSource._ticker = PIXIApp.ticker;
				lightSource._tickerUpdate = () => {
					const t = performance.now() * 0.001;
					light.coloration.shader.uniforms.time = t;
					callback(true);
				};
				lightSource._ticker.add(lightSource._tickerUpdate);
				break;
			}
			case Light.TYPE.pulse: {
				const light = Light.Pulse(
					lightSource.pixiOptions.radius,
					lightSource.pixiOptions.blendMode,
					{
						maxAlpha: lightSource.pixiOptions.alpha,
						color: lightSource.pixiOptions.enableColor
							? lightSource.pixiOptions.color
							: Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color,
						colorIntensity: lightSource.pixiOptions.colorIntensity,
					}
				);
				lightSource.addChild(light.illumination);

				lightSource._ticker = PIXIApp.ticker;
				lightSource._tickerUpdate = () => {
					const t = performance.now() * 0.002;
					light.illumination.shader.uniforms.pulse =
						0.3 + 0.1 * Math.sin(t);
					callback(true);
				};
				lightSource._ticker.add(lightSource._tickerUpdate);
				break;
			}
			case Light.TYPE.sunburst: {
				const light = Light.Sunburst(
					lightSource.pixiOptions.radius,
					lightSource.pixiOptions.blendMode,
					{
						maxAlpha: lightSource.pixiOptions.alpha,
						color: lightSource.pixiOptions.enableColor
							? lightSource.pixiOptions.color
							: Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color,
						colorIntensity: lightSource.pixiOptions.colorIntensity,
					}
				);
				lightSource.addChild(light.illumination);
				lightSource.addChild(light.coloration);
				lightSource._ticker = PIXIApp.ticker;
				lightSource._tickerUpdate = () => {
					const t = performance.now() * 0.001;
					light.coloration.shader.uniforms.time = t;
					light.illumination.shader.uniforms.pulse =
						0.3 + 0.1 * Math.sin(t);
					callback(true);
				};
				lightSource._ticker.add(lightSource._tickerUpdate);
				break;
			}
			case Light.TYPE.torch: {
				const light = Light.Torch(
					lightSource.pixiOptions.radius,
					lightSource.pixiOptions.blendMode,
					{
						maxAlpha: lightSource.pixiOptions.alpha,
						color: lightSource.pixiOptions.enableColor
							? lightSource.pixiOptions.color
							: Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color,
						colorIntensity: lightSource.pixiOptions.colorIntensity,
					}
				);
				lightSource.addChild(light.illumination);
				lightSource.addChild(light.coloration);

				lightSource._ticker = PIXIApp.ticker;
				lightSource._tickerUpdate = () => {
					const t = performance.now() * 0.001;
					light.coloration.shader.uniforms.time = t;
					// light.illumination.shader.uniforms.time = t;
					// const flicker = 0.3 + 0.15 * Math.sin(t * 5.0 + Math.sin(t * 2.0) * 3.0);
					// light.illumination.shader.uniforms.pulse = flicker;
					callback(true);
				};
				lightSource._ticker.add(lightSource._tickerUpdate);
				break;
			}
			case Light.TYPE.none:
			default:
				const light = Light.Default(
					lightSource.pixiOptions.radius,
					lightSource.pixiOptions.blendMode,
					{
						maxAlpha: lightSource.pixiOptions.alpha,
						color: lightSource.pixiOptions.color,
						colorIntensity: lightSource.pixiOptions.colorIntensity,
					}
				);
				lightSource.addChild(light.illumination);
				callback(true);
				break;
		}

		return lightSource;
	}
}
