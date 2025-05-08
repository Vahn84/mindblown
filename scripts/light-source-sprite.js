export function createLightSourceSprite(
	PIXIApp,
	{
		pX = 0,
		pY = 0,
		radius = 256,
		color = 0xffffff,
		alpha = 1.0,
		animated = 'pulse',
		shape = 'circle', // NEW: shape type
		angle = 90, // NEW: cone angle in degrees
		rotation = 0, // NEW: cone direction in radians
	} = {}
) {
	let canvas = null;

	if (shape === 'cone') {
		const screenW = window.innerWidth || 1920;
		const screenH = window.innerHeight || 1080;
		const baseRadius = Math.sqrt((screenW / 2) ** 2 + (screenH / 2) ** 2);
		const reach = baseRadius * 1.5;

		canvas = document.createElement('canvas');
		canvas.width = reach * 2;
		canvas.height = reach * 2;

		const ctx = canvas.getContext('2d');
		const [r, g, b] = [
			(color >> 16) & 0xff,
			(color >> 8) & 0xff,
			color & 0xff,
		];

		const radAngle = angle * (Math.PI / 180);
		const defaultDirection = Math.atan2(screenH, screenW);
		const adjustedRotation = rotation - defaultDirection;

		ctx.save();
		ctx.translate(0, 0);
		ctx.rotate(adjustedRotation);

		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.arc(0, 0, reach, -radAngle / 2, radAngle / 2);
		ctx.closePath();

		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, reach);
		gradient.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
		gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.4)`);
		gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

		ctx.fillStyle = gradient;
		ctx.fill();
		ctx.restore();

		// No position offset
	} else if (shape === 'circle') {
		canvas = document.createElement('canvas');

		canvas.width = radius * 2;
		canvas.height = radius * 2;

		const ctx = canvas.getContext('2d');
		const [r, g, b] = [
			(color >> 16) & 0xff,
			(color >> 8) & 0xff,
			color & 0xff,
		];

		const gradient = ctx.createRadialGradient(
			radius,
			radius,
			0,
			radius,
			radius,
			radius
		);
		gradient.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
		gradient.addColorStop(0.1, `rgba(${r},${g},${b},0.7)`);
		gradient.addColorStop(0.2, `rgba(${r},${g},${b},0.6)`);
		gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	if (!canvas) {
		return;
	}

	const baseTexture = PIXI.BaseTexture.from(canvas);
	const texture = new PIXI.Texture(baseTexture);
	const sprite = new PIXI.Sprite(texture);

	sprite.anchor.set(0, 0);
	sprite.position.set(pX, pY);
	sprite.width = canvas.width;
	sprite.height = canvas.height;
	sprite.blendMode = PIXI.BLEND_MODES.ADD;
	sprite.alpha = alpha;

	if (animated) {
		const ticker = PIXI.Ticker.shared;
		const update = (delta) => {
			sprite.alpha = 1.0;
		};
		ticker.add(update);
		sprite._tickerUpdate = update;
		sprite._ticker = ticker;
	}

	sprite.cleanup = () => {
		if (sprite._ticker && sprite._tickerUpdate) {
			sprite._ticker.remove(sprite._tickerUpdate);
		}
	};

	return sprite;
}
