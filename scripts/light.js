import {
	defaultIlluminationShader,
	smokePatchColorationShader,
	sunburstColorationShader,
	torchIlluminationShader,
	torchColorationShader,
	vertexShader,
} from './shaders.js';
import { getColorFromHex } from './utilities.js';

export class Light {
	static MESH = {
		illumination: 'LightMeshIllumination',
		coloration: 'LightMeshColoration',
	};

	static TYPE = {
		none: 'none',
		pulse: 'pulse',
		smokePatch: 'smokePatch',
		sunburst: 'sunburst',
		torch: 'torch',
	};

	static ICONS = {
		[Light.TYPE.none]: 'fa-circle',
		[Light.TYPE.pulse]: 'fa-wave-sine',
		[Light.TYPE.smokePatch]: 'fa-smog',
		[Light.TYPE.sunburst]: 'fa-sun',
		[Light.TYPE.torch]: 'fa-fire',
	};

	static LIST = [
		{
			name: 'Basic',
			id: 'basic',
			isFavourite: false,
			isActive: false,
			tiles: Object.keys(Light.TYPE).map((type) => ({
				id: type,
				name: type,
				type: type,
				icon: Light.ICONS[type],
			})),
		},
	];

	static PRESETS = {
		[Light.TYPE.none]: {
			shaders: {
				illumination: defaultIlluminationShader,
				coloration: null,
			},
			uniforms: {
				maxAlpha: 1,
				pulse: 0.5,
				color: [0, 0, 0],
				colorIntensity: 0.4,
			},
		},
		[Light.TYPE.pulse]: {
			shaders: {
				illumination: defaultIlluminationShader,
				coloration: null,
			},
			uniforms: {
				maxAlpha: 1,
				pulse: 0.5,
				color: [0, 0, 0],
				colorIntensity: 0.4,
			},
		},
		[Light.TYPE.smokePatch]: {
			shaders: {
				illumination: defaultIlluminationShader,
				coloration: smokePatchColorationShader,
			},
			uniforms: {
				maxAlpha: 1,
				time: 1,
				pulse: 0.5,
				color: [0, 0, 0],
				colorIntensity: 0.4,
			},
		},
		[Light.TYPE.sunburst]: {
			shaders: {
				illumination: defaultIlluminationShader,
				coloration: sunburstColorationShader,
			},
			uniforms: {
				maxAlpha: 1,
				time: 1,
				pulse: 0.5,
				color: [0, 0, 0],
				colorIntensity: 0.4,
			},
		},
		[Light.TYPE.torch]: {
			shaders: {
				illumination: torchIlluminationShader,
				coloration: torchColorationShader,
			},
			uniforms: {
				maxAlpha: 1,
				time: 1,
				pulse: 0.5,
				color: [0, 0, 0],
				colorIntensity: 0.4,
			},
		},
	};

	static Default(radius, blendMode, uniforms) {
		return {
			illumination: Light.Mesh(
				radius,
				blendMode,
				Light.MESH.illumination,
				Light.PRESETS[Light.TYPE.none].shaders.illumination,
				{
					...Light.PRESETS[Light.TYPE.none].uniforms,
					...uniforms,
					color: getColorFromHex(uniforms.color),
				}
			),
		};
	}

	static Pulse(radius, blendMode, uniforms) {
		return {
			illumination: Light.Mesh(
				radius,
				blendMode,
				Light.MESH.illumination,
				Light.PRESETS[Light.TYPE.pulse].shaders.illumination,
				{
					...Light.PRESETS[Light.TYPE.pulse].uniforms,
					...uniforms,
					color: getColorFromHex(uniforms.color),
				}
			),
		};
	}
	static SmokePatch(radius, blendMode, uniforms) {
		return {
			illumination: Light.Mesh(
				radius,
				blendMode,
				Light.MESH.illumination,
				Light.PRESETS[Light.TYPE.smokePatch].shaders.illumination,
				{
					...Light.PRESETS[Light.TYPE.smokePatch].uniforms,
					...uniforms,
					color: Light.PRESETS[Light.TYPE.smokePatch].uniforms.color,
				}
			),

			coloration: Light.Mesh(
				radius,
				PIXI.BLEND_MODES.NORMAL,
				Light.MESH.coloration,
				Light.PRESETS[Light.TYPE.smokePatch].shaders.coloration,
				{
					...Light.PRESETS[Light.TYPE.smokePatch].uniforms,
					...uniforms,
					color: getColorFromHex(uniforms.color),
				}
			),
		};
	}
	static Sunburst(radius, blendMode, uniforms) {
		return {
			illumination: Light.Mesh(
				radius,
				blendMode,
				Light.MESH.illumination,
				Light.PRESETS[Light.TYPE.sunburst].shaders.illumination,
				{
					...Light.PRESETS[Light.TYPE.sunburst].uniforms,
					...uniforms,
					color: Light.PRESETS[Light.TYPE.sunburst].uniforms.color,
				}
			),

			coloration: Light.Mesh(
				radius,
				PIXI.BLEND_MODES.NORMAL,
				Light.MESH.coloration,
				Light.PRESETS[Light.TYPE.sunburst].shaders.coloration,
				{
					...Light.PRESETS[Light.TYPE.sunburst].uniforms,
					...uniforms,
					color: getColorFromHex(uniforms.color),
				}
			),
		};
	}

	static Torch(radius, blendMode, uniforms) {
		return {
			illumination: Light.Mesh(
				radius,
				blendMode,
				Light.MESH.illumination,
				torchIlluminationShader,
				{
					...Light.PRESETS[Light.TYPE.torch].uniforms,
					...uniforms,
					color: Light.PRESETS[Light.TYPE.torch].uniforms.color,
				}
			),
			coloration: Light.Mesh(
				radius,
				PIXI.BLEND_MODES.NORMAL,
				Light.MESH.coloration,
				torchColorationShader,
				{
					...Light.PRESETS[Light.TYPE.torch].uniforms,
					...uniforms,
					color: getColorFromHex(uniforms.color),
				}
			),
		};
	}

	static Mesh(radius, blendMode, name, shader, uniforms) {
		const geometry = new PIXI.Geometry()
			// Normalized quad centered at (0,0) for proper scaling and positioning
			.addAttribute(
				'aVertexPosition',
				[-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
				2
			)
			.addIndex([0, 1, 2, 0, 2, 3]);

		const _shader = new PIXI.Shader(
			PIXI.Program.from(vertexShader, shader),
			uniforms
		);

		const mesh = new PIXI.Mesh(geometry, _shader);
		// Set the pivot to (0, 0) and position to (-0.5, -0.5) for visual centering
		mesh.pivot.set(0, 0);

		// Set scale to radius so the mesh is sized correctly
		if (radius < 50) radius = 50;
		mesh.scale.set(radius);
		// Set position to (-0.5, -0.5)
		mesh.position.set(-0.5, -0.5);

		mesh.blendMode = blendMode || PIXI.BLEND_MODES.ADD;
		mesh.name = name || Light.MESH.illumination;
		return mesh;
	}
}
