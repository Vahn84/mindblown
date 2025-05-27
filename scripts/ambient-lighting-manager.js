import { LightSource } from './light-source.js';
import { hexToRgb, IS_GM, logger } from './utilities.js';
import { PIXIHandler } from './pixi-handler.js';
import { StageManager } from './stage-manager.js';
import { Stage } from './stage.js';
import { Light } from './light.js';

export class AmbientLightingManager extends PIXI.Container {
	constructor({ PIXIApp, width, height, darkness = 1.0 }) {
		super();

		this.width = width;
		this.height = height;
		this.lights = [];
		this._needsLightMaskUpdate = true;

		this._ticker = new PIXI.Ticker();
		this._ticker.maxFPS = 30;
		this._lastUpdate = 0;

		this.lightContainer = new PIXI.Container();
		this.lightContainer.blendMode = PIXI.BLEND_MODES.ADD;

		this.lightMask = PIXI.RenderTexture.create({ width, height });

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

			void main(void) {
			vec2 uv = vTextureCoord;
			float light = texture2D(uLightMask, uv).a;

			float alpha = uDarkness * (1.0 - light);
			gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
			}
			`;

		this._darknessFilter = new PIXI.Filter(undefined, fragment, {
			uLightMask: this.lightMask,
			uDarkness: darkness,
		});

		this._darknessFilter.autoFit = true;
		this._darkness.filterArea = new PIXI.Rectangle(0, 0, width, height);
		this._darkness.filters = [this._darknessFilter];

		this._darkness.blendMode = PIXI.BLEND_MODES.NORMAL;

		this.addChild(this._darkness);
		this.addChild(this.lightContainer);
		// Debug: print children draw order after construction
		console.log('Children draw order after construction:');
		this.children.forEach((c) => console.log(c.name || c.constructor.name));

		this._ticker.add((delta) => {
			// const now = performance.now();
			// if (now - this._lastUpdate > 300) {
			// 	this._animateLights();
			// 	this._lastUpdate = now;
			// }
			this.updateLightMask(PIXIApp.renderer);
		});
		this._ticker.start();
	}
	/**
	 * Add a new light source.
	 * @param {Object} options - See LightSourceSprite for config
	 */
	addLight(PIXIApp, tile) {
		const lightMeshContainer = LightSource.create(
			PIXIApp,
			tile.pixiOptions,
			() => {
				this._needsLightMaskUpdate = true;
				this.updateLightMask(PIXIApp.renderer);
			}
		)
			.setName(tile.id)
			.setPixiOptionsRuntime(tile.pixiOptionsRuntime);

		const openConfig = () => {
			this.openLightConfigDialog(lightMeshContainer);
		};

		lightMeshContainer.onDoubleClick = openConfig;
		this.removeLight(tile);
		this.lightContainer.addChild(lightMeshContainer);
		this.addDragAndDrop(PIXIApp, lightMeshContainer);

		const bgContainer = PIXIApp.stage.getChildByName(
			PIXIHandler.PIXI_WRAPPERS.BG_ID
		);
		const bgSprite = bgContainer.getChildByName(PIXIHandler.PIXI_DO.BG_ID);
		this.setLightScaleAndPosition(
			tile.pixiOptionsRuntime,
			lightMeshContainer,
			bgSprite,
			false
		);

		return lightMeshContainer;
	}

	updateLight(PIXIApp, lightTile) {
		this.addLight(PIXIApp, lightTile);
	}

	setLightScaleAndPosition(
		pixiOptionsRuntime,
		lightMeshContainer,
		bgSprite,
		adjustForDelta = false
	) {
		const relativeX = pixiOptionsRuntime.pX;
		const relativeY = pixiOptionsRuntime.pY;

		const oldBgPosX = pixiOptionsRuntime.bgPosX || 0;
		const oldBgPosY = pixiOptionsRuntime.bgPosY || 0;
		const oldBgWidth = pixiOptionsRuntime.bgWidth || bgSprite.width;
		const oldBgHeight = pixiOptionsRuntime.bgHeight || bgSprite.height;

		// Adjust based on difference between current and old bg positioning
		const deltaX = adjustForDelta ? bgSprite.position.x - oldBgPosX : 0;
		const deltaY = adjustForDelta ? bgSprite.position.y - oldBgPosY : 0;

		const anchorX = bgSprite.anchor?.x ?? 0.5;
		const anchorY = bgSprite.anchor?.y ?? 0.5;

		const newX = bgSprite.position.x + relativeX * bgSprite.width;
		const newY = bgSprite.position.y + relativeY * bgSprite.height;

		lightMeshContainer.x = adjustForDelta ? newX + deltaX : newX;
		lightMeshContainer.y = adjustForDelta ? newY + deltaY : newY;

		lightMeshContainer.pixiOptionsRuntime.pX = relativeX;
		lightMeshContainer.pixiOptionsRuntime.pY = relativeY;
		lightMeshContainer.pixiOptionsRuntime.bgWidth = bgSprite.width;
		lightMeshContainer.pixiOptionsRuntime.bgHeight = bgSprite.height;
		if (adjustForDelta) {
			lightMeshContainer.pixiOptionsRuntime.bgPosX = bgSprite.position.x;
			lightMeshContainer.pixiOptionsRuntime.bgPosY = bgSprite.position.y;
		}

		const scaleX = bgSprite.width / oldBgWidth;
		const scaleY = bgSprite.height / oldBgHeight;
		const finalScale = Math.min(scaleX, scaleY); // or max() if more appropriate
		const baseScale = pixiOptionsRuntime.baseScale || 1;
		lightMeshContainer.scale.set(baseScale * finalScale);

		let log = '';
		Object.keys(pixiOptionsRuntime).forEach((key) => {
			if (pixiOptionsRuntime[key] !== undefined) {
				const value =
					typeof pixiOptionsRuntime[key] === 'object'
						? JSON.stringify(pixiOptionsRuntime[key])
						: pixiOptionsRuntime[key];
				log += `${key}: ${value}, `;
				log += '\n';
			}
		});

		logger('setLightScaleAndPosition', log);
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
		for (const lightMeshContainer of this.lightContainer.children) {
			lightMeshContainer.cleanup();
		}
		this.lightContainer.removeChildren();
	}

	removeLight(lightTile) {
		for (const lightMeshContainer of this.lightContainer.children) {
			if (lightMeshContainer.name === lightTile.id) {
				lightMeshContainer.cleanup();
				this.lightContainer.removeChild(lightMeshContainer);
				break;
			}
		}
	}

	stopUpdatingLightingMask() {
		this._ticker.stop();
		this._needsLightMaskUpdate = false;
	}

	clearDarkness() {
		this._darkness.destroy();
		this._darknessFilter.destroy();
	}

	remove() {
		this.clearLights();
		this.stopUpdatingLightingMask();
		this.clearDarkness();
	}

	resize(PIXIApp, { width, height }, bgSprite) {
		this.width = width;
		this.height = height;

		// Resize and reposition the darkness sprite
		this._darkness.width = width;
		this._darkness.height = height;
		this._darknessFilter.autoFit = true;
		this._darkness.filterArea = new PIXI.Rectangle(0, 0, width, height);
		this._darkness.position.set(0, 0);
		// this._darkness.scale.set(width, height);
		// Recreate the light mask render texture
		this.lightMask.destroy(true);
		// logger(`Resizing light mask to ${width}, ${height}`);
		this.lightMask = PIXI.RenderTexture.create({ width, height });

		// Update the filter uniforms with new light mask
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
		for (const lightMeshContainer of this.lightContainer.children) {
			this.setLightScaleAndPosition(
				lightMeshContainer.pixiOptionsRuntime,
				lightMeshContainer,
				bgSprite,
				false
			);
		}
		const scaleFactor = 1;
		this.lightMask.destroy(true);
		this.lightMask = PIXI.RenderTexture.create({
			width: Math.floor(width * scaleFactor),
			height: Math.floor(height * scaleFactor),
		});
		this._darknessFilter.uniforms.uLightMask = this.lightMask;

		this.updateLightMask(PIXIApp.renderer);
	}
	/**
	 * Render the current lights into the light mask render texture.
	 * Should be called every frame from the main render loop.
	 * @param {PIXI.Renderer} renderer
	 */
	updateLightMask(renderer) {
		// if (!this._needsLightMaskUpdate) return;
		// this.lightContainer.position.set(0, 0);
		this.lightContainer.pivot.set(0.5, 0.5);
		// this.lightContainer.scale.set(1); // match scaleFactor above
		// // Defensive: ensure all lights use screen positions

		renderer.render(this.lightContainer, {
			renderTexture: this.lightMask,
			clear: true,
			skipUpdateTransform: false,
		});
		this._needsLightMaskUpdate = false;
		// this._darknessFilter.uniforms.uLightMask = this.lightMask;
	}

	updateLightCenter() {
		// No longer needed: uCenter uniform is now baked into shaders.
	}

	async addDragAndDrop(PIXIApp, lightMeshContainer) {
		if (!IS_GM()) return;
		let lastClickTime = 0;
		lightMeshContainer.interactive = true;
		lightMeshContainer.buttonMode = true;
		lightMeshContainer
			.on('pointerdown', (event) => {
				if (lightMeshContainer.resizing) return;
				const clickTime = performance.now();
				if (clickTime - lastClickTime < 300) {
					if (
						typeof lightMeshContainer.onDoubleClick === 'function'
					) {
						lightMeshContainer.dragging = false;
						lightMeshContainer.onDoubleClick();
					}
					lastClickTime = clickTime;
				} else {
					lightMeshContainer.dragging = true;
					const pos = event.data.getLocalPosition(
						lightMeshContainer.parent
					);
					lightMeshContainer.dragOffset = {
						x: pos.x - lightMeshContainer.position.x,
						y: pos.y - lightMeshContainer.position.y,
					};
					lastClickTime = clickTime;
				}
			})
			.on('pointerup', async () => {
				const shouldUpdate = lightMeshContainer.dragging ? true : false;
				lightMeshContainer.dragging = false;
				lightMeshContainer.dragOffset = null;

				const bgContainer =
					StageManager.shared().PIXIApp.stage.getChildByName(
						PIXIHandler.PIXI_WRAPPERS.BG_ID
					);
				const bgSprite = bgContainer.getChildByName(
					PIXIHandler.PIXI_DO.BG_ID
				);
				lightMeshContainer.pixiOptionsRuntime.pX =
					(lightMeshContainer.position.x - bgSprite.position.x) /
					bgSprite.width;
				lightMeshContainer.pixiOptionsRuntime.pY =
					(lightMeshContainer.position.y - bgSprite.position.y) /
					bgSprite.height;

				lightMeshContainer.pixiOptionsRuntime.bgWidth = bgSprite.width;
				lightMeshContainer.pixiOptionsRuntime.bgHeight =
					bgSprite.height;
				lightMeshContainer.pixiOptionsRuntime.bgPosX =
					bgSprite.position.x;
				lightMeshContainer.pixiOptionsRuntime.bgPosY =
					bgSprite.position.y;

				let log = '';
				Object.keys(lightMeshContainer.pixiOptionsRuntime).forEach(
					(key) => {
						if (
							lightMeshContainer.pixiOptionsRuntime[key] !==
							undefined
						) {
							const value =
								typeof lightMeshContainer.pixiOptionsRuntime[
									key
								] === 'object'
									? JSON.stringify(
											lightMeshContainer
												.pixiOptionsRuntime[key]
									  )
									: lightMeshContainer.pixiOptionsRuntime[
											key
									  ];
							log += `${key}: ${value}, `;
							log += '\n';
						}
					}
				);

				logger('setLightScaleAndPosition', log);

				this._needsLightMaskUpdate = true;
				this.updateLightMask(PIXIApp.renderer);
				const tile = await StageManager.shared().getLightById(
					lightMeshContainer.name
				);
				if (tile) {
					tile.pixiOptionsRuntime =
						lightMeshContainer.pixiOptionsRuntime;
					tile.pixiOptions = lightMeshContainer.pixiOptions;

					if (shouldUpdate) {
						StageManager.shared().updateLight(tile);
					}
				}
			})
			.on('pointerupoutside', () => {
				lightMeshContainer.dragging = false;
				lightMeshContainer.dragOffset = null;
			})
			.on('pointermove', (event) => {
				if (lightMeshContainer.resizing) return;
				if (!lightMeshContainer.dragging) return;
				const pos = event.data.getLocalPosition(
					lightMeshContainer.parent
				);
				lightMeshContainer.position.set(
					pos.x - lightMeshContainer.dragOffset.x,
					pos.y - lightMeshContainer.dragOffset.y
				);
			});
	}

	async openLightConfigDialog(currentLightMeshContainer) {
		const currentColor =
			currentLightMeshContainer.pixiOptions.color ||
			Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.color;
		const currentRadius =
			currentLightMeshContainer.pixiOptions.radius ||
			Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.radius;
		const currentType =
			currentLightMeshContainer.pixiOptions.type || Light.TYPE.none;
		const colorHex =
			typeof currentColor !== 'string'
				? rgbToHex(currentColor)
				: currentColor;
		logger('colorHex', colorHex);
		logger('currentColor', currentColor);
		const currentAlpha =
			currentLightMeshContainer.pixiOptions.alpha ||
			Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.alpha;
		const currentEnableColor =
			typeof currentLightMeshContainer.pixiOptions.enableColor ===
			'boolean'
				? currentLightMeshContainer.pixiOptions.enableColor
				: true;
		const currentColorIntensity =
			currentLightMeshContainer.pixiOptions.colorIntensity ||
			Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT.colorIntensity;

		let animOptions = '';
		Object.values(Light.TYPE).map((type) => {
			animOptions += `<option value="${type}" ${
				currentType === type ? 'selected' : ''
			}>${type}</option>`;
		});
		new Dialog({
			title: 'Light Configuration',
			content: `
				<form>
					<div class="form-group">
						<label>Radius</label>
						<input type="number" name="radius" value="${currentRadius}" min="50"/>
					</div>
					<div class="form-group">
						<label>Color</label>
						<input type="color" name="color" value="${colorHex}" />
					</div>
					<div class="form-group">
						<label>Max Alpha</label>
						<input type="number" name="maxAlpha" value="${
							currentAlpha || 1
						}" min="0" max="1" step="0.01"/>
					</div>
					<div class="form-group">
						<label>Color Intensity</label>
						<input type="range" name="colorIntensity" min="0" max="1" step="0.1" value="${currentColorIntensity}">
					</div>
					<div class="form-group">
						<label>Animation</label>
						<select name="animation">
							${animOptions}
						</select>
					</div>
					<div class="form-group">
						<label>Light Visibility</label>
						<input type="checkbox" name="visible" ${
							currentLightMeshContainer.pixiOptions.visible !==
							false
								? 'checked'
								: ''
						} />
					</div>
					<div class="form-group">
						<label>Enable Color</label>
						<input type="checkbox" name="enableColor" ${
							currentEnableColor ? 'checked' : ''
						}/>
					</div>
				</form>
			`,
			buttons: {
				save: {
					label: 'Save',
					callback: async (html) => {
						const form = html[0].querySelector('form');
						const radius = parseInt(form.radius.value);
						const color = form.color.value;
						const type = form.animation.value;
						const enableColor = form.enableColor.checked;
						const colorIntensity = parseFloat(
							form.colorIntensity.value
						);

						const previousPixiOptions =
							currentLightMeshContainer.pixiOptions;
						const previousPixiOptionsRuntime =
							currentLightMeshContainer.pixiOptionsRuntime;
						const visible = form.visible.checked;
						previousPixiOptions.visible = visible;
						// update runtime options and recreate light
						previousPixiOptions.radius = radius;
						previousPixiOptions.color = color;
						previousPixiOptions.type = type;
						previousPixiOptions.alpha = parseFloat(
							form.maxAlpha.value
						);
						previousPixiOptions.enableColor = enableColor;
						previousPixiOptions.colorIntensity = colorIntensity;

						const lightName = currentLightMeshContainer.name;
						const x = currentLightMeshContainer.x;
						const y = currentLightMeshContainer.y;

						this.lightContainer.removeChild(
							currentLightMeshContainer
						);
						currentLightMeshContainer.cleanup();

						const tile = await StageManager.shared().getLightById(
							lightName
						);
						// Compose pixiOptions with enableColor
						const newPixiOptions = {
							...previousPixiOptions,
						};
						const newLightMeshContainer = LightSource.create(
							StageManager.shared().PIXIApp,
							newPixiOptions,
							(_needsLightMaskUpdate) => {
								this._needsLightMaskUpdate =
									_needsLightMaskUpdate;
								this.updateLightMask(
									StageManager.shared().PIXIApp.renderer
								);
							}
						).setPixiOptionsRuntime(previousPixiOptionsRuntime);

						newLightMeshContainer.name = lightName;
						newLightMeshContainer.x = x;
						newLightMeshContainer.y = y;
						newLightMeshContainer.onDoubleClick = () =>
							this.openLightConfigDialog(newLightMeshContainer);

						StageManager.shared().updateLight(tile);

						const index = this.lightContainer.children.findIndex(
							(lightMeshContainer) =>
								lightMeshContainer.name ===
								newLightMeshContainer.name
						);
						if (index !== -1) {
							this.lightContainer.removeChildAt(index);
						}

						this.lightContainer.addChild(newLightMeshContainer);
						this.addDragAndDrop(
							StageManager.shared().PIXIApp,
							newLightMeshContainer
						);
						this._needsLightMaskUpdate = true;
						this.updateLightMask(
							StageManager.shared().PIXIApp.renderer
						);
					},
				},
				delete: {
					label: 'Delete',
					callback: async () => {
						const index = this.lightContainer.children.findIndex(
							(lightMeshContainer) =>
								lightMeshContainer.name ===
								currentLightMeshContainer.name
						);
						if (index !== -1) {
							const lightMeshContainer =
								this.lightContainer.getChildAt(index);
							if (lightMeshContainer) {
								lightMeshContainer.cleanup();
							}
							this.lightContainer.removeChildAt(index);
						}
						this._needsLightMaskUpdate = true;
						this.updateLightMask(
							StageManager.shared().PIXIApp.renderer
						);
						const tile = await StageManager.shared().getLightById(
							currentLightMeshContainer.name
						);
						StageManager.shared().removeLight(tile);
					},
				},
				cancel: {
					label: 'Cancel',
				},
			},
			default: 'save',
		}).render(true);
	}
}
