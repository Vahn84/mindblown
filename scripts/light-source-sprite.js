export function createLightSourceSprite(PIXIApp, {
	pX = 0,
	pY = 0,
	radius = 256,
	color = 0xffffff,
	alpha = 1.0,
	animated = 'pulse',
} = {}) {
	const canvas = document.createElement('canvas');
	canvas.width = radius * 2;
	canvas.height = radius * 2;

	const ctx = canvas.getContext('2d');
	const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
	const [r, g, b] = [
		(color >> 16) & 0xff,
		(color >> 8) & 0xff,
		color & 0xff
	];
	gradient.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
	gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const baseTexture = PIXI.BaseTexture.from(canvas);
	const texture = new PIXI.Texture(baseTexture);
	const sprite = new PIXI.Sprite(texture);

	sprite.anchor.set(0.5);
	sprite.position.set(pX,pY);
	sprite.width = radius * 2;
	sprite.height = radius * 2;
	sprite.blendMode = PIXI.BLEND_MODES.ADD;
	sprite.alpha = alpha;

	if (animated) {
		const ticker = PIXI.Ticker.shared;
		const update = (delta) => {
			sprite.alpha = 1.0; // for debug or pulsing effect
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
