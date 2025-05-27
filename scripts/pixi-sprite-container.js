export class PixiSpriteContainer extends PIXI.Container {
    constructor(pixiOptions) {
        super();
        this.pixiOptions = pixiOptions || {};
        this.pixiOptionsRuntime = {};
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
}