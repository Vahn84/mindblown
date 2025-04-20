import CONFIG from "./config.js";

export class Mindblown extends FormApplication {

    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: CONFIG.MOD_NAME,
            title: CONFIG.MOD_NAME,
            userId: game.userId,
            popOut: true,
            template: CONFIG.TEMPLATES.MINDBLOWN,
        });
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }

    
}