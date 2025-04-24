(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('pixi.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'pixi.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CustomPixiParticles = {}, global.PIXI));
})(this, (function (exports, pixi_js) { 'use strict';

  var controller = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get AbstractEmission () { return AbstractEmission; },
    get EmissionTypes () { return EmissionTypes; },
    get RandomEmission () { return RandomEmission; },
    get StandardEmission () { return StandardEmission; },
    get UniformEmission () { return UniformEmission; }
  });

  var EmissionTypes = {
    DEFAULT: "UniformEmission",
    RANDOM: "RandomEmission",
    UNIFORM: "StandardEmission"
  };

  const deepClone = (obj, hash = /* @__PURE__ */ new WeakMap()) => {
    if (Object(obj) !== obj || obj instanceof Function) return obj;
    if (hash.has(obj)) return hash.get(obj);
    let result;
    try {
      result = new obj.constructor();
    } catch (e) {
      result = Object.create(Object.getPrototypeOf(obj));
    }
    hash.set(obj, result);
    if (obj instanceof Map) {
      obj.forEach((value, key) => {
        result.set(deepClone(key, hash), deepClone(value, hash));
      });
    } else if (obj instanceof Set) {
      obj.forEach((value) => {
        result.add(deepClone(value, hash));
      });
    } else {
      for (const key of Reflect.ownKeys(obj)) {
        if (typeof obj[key] === "function") {
          result[key] = obj[key];
        } else {
          result[key] = deepClone(obj[key], hash);
        }
      }
    }
    return result;
  };
  class BehaviourParser {
    /**
     * Constructs a BehaviourParser object.
     * @param {any} behaviour The behaviour to be parsed.
     */
    constructor(behaviour) {
      /**
       * Writes the behaviour to a config object.
       * @returns {object} The config object.
       */
      this.write = () => {
        const config = deepClone(this._behaviour.getProps());
        config.name = this._behaviour.getName();
        return config;
      };
      /**
       * Reads a config object and sets the behaviour appropriately.
       * @param {object} config The config object to be read.
       */
      this.read = (config) => {
        for (const key in config) {
          if (this._behaviour[key] instanceof Object && typeof this._behaviour[key].copyFromRawData === "function") {
            this._behaviour[key].copyFromRawData(config[key]);
          } else {
            this._behaviour[key] = config[key];
          }
        }
      };
      this._behaviour = behaviour;
    }
  }

  class CompatibilityHelper {
  }
  /**
   * Reads the duration from the given configuration.
   *
   * @param {Object} config - The configuration object.
   * @return {Number} The duration from the given configuration, or -1 if not found.
   */
  CompatibilityHelper.readDuration = (config) => {
    if (config.duration) {
      return config.duration;
    }
    return -1;
  };

  class EmitControllerParser {
    /**
     * The constructor of the class.
     *
     * @constructor
     * @param {any} controller The controller object.
     */
    constructor(controller) {
      /**
       * Writes the configuration data to a JSON format.
       *
       * @returns {object} The configuration object.
       */
      this.write = () => {
        const config = JSON.parse(JSON.stringify(this._controller));
        config.name = this._controller.getName();
        return config;
      };
      /**
       * Reads the configuration data from a JSON format.
       *
       * @param {object} config The configuration object.
       */
      this.read = (config) => {
        for (const key in config) {
          if (!(this._controller[key] instanceof Object)) {
            this._controller[key] = config[key];
          }
        }
      };
      this._controller = controller;
    }
  }

  const behaviourNames = {
    ANGULAR_BEHAVIOUR: "AngularVelocityBehaviour",
    LIFE_BEHAVIOUR: "LifeBehaviour",
    COLOR_BEHAVIOUR: "ColorBehaviour",
    POSITION_BEHAVIOUR: "PositionBehaviour",
    SIZE_BEHAVIOUR: "SizeBehaviour",
    EMIT_DIRECTION: "EmitDirectionBehaviour",
    ROTATION_BEHAVIOUR: "RotationBehaviour",
    TURBULENCE_BEHAVIOUR: "TurbulenceBehaviour",
    COLLISION_BEHAVIOUR: "CollisionBehaviour",
    ATTRACTION_REPULSION_BEHAVIOUR: "AttractionRepulsionBehaviour",
    NOISE_BASED_MOTION_BEHAVIOUR: "NoiseBasedMotionBehaviour",
    FORCE_FIELDS_BEHAVIOUR: "ForceFieldsBehaviour",
    SPAWN_BEHAVIOUR: "SpawnBehaviour",
    TIMELINE_BEHAVIOUR: "TimelineBehaviour",
    GROUPING_BEHAVIOUR: "GroupingBehaviour",
    SOUND_REACTIVE_BEHAVIOUR: "SoundReactiveBehaviour",
    LIGHT_EFFECT_BEHAVIOUR: "LightEffectBehaviour",
    STRETCH_BEHAVIOUR: "StretchBehaviour",
    TEMPERATURE_BEHAVIOUR: "TemperatureBehaviour"
  };

  class EmitterBehaviours {
    constructor() {
      this.behaviours = [];
      /**
       * Gets all the enabled behaviours
       *
       * @return {any[]} The enabled behaviours
       */
      this.getAll = () => {
        return this.behaviours.filter((behaviour) => {
          return behaviour.enabled;
        });
      };
      /**
       * Clears all the stored behaviours
       */
      this.clear = () => {
        this.behaviours = [];
      };
      /**
       * Adds a behaviour
       *
       * @param {any} behaviour The behaviour to add
       *
       * @return {any} The added behaviour
       */
      this.add = (behaviour) => {
        if (this.getByName(behaviour.getName()) !== null) {
          throw new Error("Emitter duplicate");
        }
        this.behaviours.push(behaviour);
        this.behaviours.sort((a, b) => {
          return b.priority - a.priority;
        });
        return behaviour;
      };
      /**
       * Checks if there are no behaviours stored
       *
       * @return {boolean} True if there are no behaviours stored, false otherwise
       */
      this.isEmpty = () => {
        return this.getAll().length === 0;
      };
      /**
       * Gets a behaviour by name
       *
       * @param {string} name The name of the behaviour to get
       *
       * @return {any | null} The behaviour with the given name or null if not found
       */
      this.getByName = (name) => {
        for (let i = 0; i < this.behaviours.length; ++i) {
          if (this.behaviours[i].getName() === name) {
            return this.behaviours[i];
          }
        }
        return null;
      };
      /**
       * Removes a behaviour by name
       *
       * @param {string} name The name of the behaviour to remove
       */
      this.removeByName = (name) => {
        const behaviours = [];
        for (let i = 0; i < this.behaviours.length; ++i) {
          if (this.behaviours[i].getName() !== name) {
            behaviours.push(this.behaviours[i]);
          }
        }
        this.behaviours = behaviours;
      };
      /**
       * Initialises the behaviours
       *
       * @param {Particle} particle The particle
       * @param {Model} model The model
       * @param {Model} turbulencePool The turbulencePool
       */
      this.init = (particle, model, turbulencePool) => {
        for (let i = 0; i < this.behaviours.length; ++i) {
          this.behaviours[i].init(particle, model, turbulencePool);
        }
      };
      /**
       * Applies the behaviours
       *
       * @param {Particle} particle The particle
       * @param {number} deltaTime The delta time
       * @param {Model} model The model
       */
      this.apply = (particle, deltaTime, model) => {
        for (let i = 0; i < this.behaviours.length; ++i) {
          model.updateCamera(deltaTime);
          this.behaviours[i].apply(particle, deltaTime, model);
        }
      };
      /**
       * Update once per frame
       *
       * @param {number} deltaTime The delta time
       */
      this.update = (deltaTime) => {
        for (let i = 0; i < this.behaviours.length; ++i) {
          if (this.behaviours[i].update) this.behaviours[i].update(deltaTime);
        }
      };
    }
  }

  class Color {
    constructor(r, g, b, alpha) {
      /**
       * @function copyFrom
       * @memberof Color
       * @description Copies the values of an IColor object to the Color object
       * @param {IColor} color - The IColor object to copy from
       */
      this.copyFrom = (color) => {
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        this.alpha = color.alpha;
      };
      /**
       * @function copyFromRawData
       * @memberof Color
       * @description Copies the values of a raw data object to the Color object
       * @param {object} data - The raw data object to copy from
       */
      this.copyFromRawData = (data) => {
        this.r = data._r;
        this.g = data._g;
        this.b = data._b;
        this.alpha = data._alpha;
      };
      /**
       * @function add
       * @memberof Color
       * @description Adds the values of a color object to the Color object
       * @param {IColor} color - The IColor object to add
       */
      this.add = (color) => {
        this.r += color.r;
        this.g += color.g;
        this.b += color.b;
        this.alpha += color.alpha;
      };
      /**
       * @function set
       * @memberof Color
       * @description Sets the values of the color object
       * @param {number} r - The red component of the color
       * @param {number} g - The green component of the color
       * @param {number} b - The blue component of the color
       * @param {number} alpha - The alpha component of the color
       */
      this.set = (r, g, b, alpha) => {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.alpha = alpha;
      };
      this.r = r || 0;
      this.g = g || 0;
      this.b = b || 0;
      this.alpha = alpha || 1;
    }
    /**
     * @function r
     * @memberof Color
     * @description Gets the red component of the Color object
     * @returns {number} The red component of the Color object
     */
    get r() {
      return this._r;
    }
    /**
     * @function r
     * @memberof Color
     * @description Sets the red component of the Color object
     * @param {number} value - The red component value to set
     */
    set r(value) {
      const newValue = value === void 0 ? 0 : value;
      this._r = newValue;
    }
    /**
     * @function g
     * @memberof Color
     * @description Gets the green component of the Color object
     * @returns {number} The green component of the Color object
     */
    get g() {
      return this._g;
    }
    /**
     * @function g
     * @memberof Color
     * @description Sets the green component of the Color object
     * @param {number} value - The green component value to set
     */
    set g(value) {
      const newValue = value === void 0 ? 0 : value;
      this._g = newValue;
    }
    /**
     * @function b
     * @memberof Color
     * @description Gets the blue component of the Color object
     * @returns {number} The blue component of the Color object
     */
    get b() {
      return this._b;
    }
    /**
     * @function b
     * @memberof Color
     * @description Sets the blue component of the Color object
     * @param {number} value - The blue component value to set
     */
    set b(value) {
      const newValue = value === void 0 ? 0 : value;
      this._b = newValue;
    }
    /**
     * @function alpha
     * @memberof Color
     * @description Gets the alpha value of the Color object
     * @returns {number} The alpha value of the Color object
     */
    get alpha() {
      return this._alpha;
    }
    /**
     * @function hex
     * @memberof Color
     * @description Gets the Color object's hex value
     * @returns {number} The hex value of the Color object
     */
    set alpha(value) {
      const newValue = value === void 0 ? 1 : value;
      this._alpha = newValue;
    }
    /**
     * @function hex
     * @memberof Color
     * @description Gets the Color object's hex value
     * @returns {number} The hex value of the Color object
     */
    get hex() {
      let hex = this.r << 16;
      hex = hex | this.g << 8;
      hex = hex | this.b;
      return hex;
    }
    /**
     * @function hex
     * @memberof Color
     * @description Sets the Color object's value from a hex value
     * @param {number} value - The hex value to set the Color object from
     */
    set hex(value) {
      this.r = (value & 16711680) >> 16;
      this.g = (value & 65280) >> 8;
      this.b = value & 255;
    }
  }

  class Point {
    constructor(x, y) {
      /**
       * Sets the x and y coordinates of a Point
       * @param {number} x - The x coordinate
       * @param {number} y - The y coordinate
       * @return {Point} - The Point instance
       */
      this.set = (x, y) => {
        this.x = x;
        this.y = y === void 0 ? this.y : y;
        return this;
      };
      /**
       * Copies the x and y coordinates from another Point
       * @param {IPoint} point - The Point instance to copy from
       * @return {Point} - The Point instance
       */
      this.copyFrom = (point) => {
        this.x = point.x || 0;
        this.y = point.y || 0;
        return this;
      };
      /**
       * Copies the x and y coordinates from an object with numeric x and y properties
       * @param {IPoint} data - The object to copy from
       * @return {Point} - The Point instance
       */
      this.copyFromRawData = (data) => {
        this.copyFrom(data);
      };
      /**
       * Adds the x and y coordinates of another Point to this Point
       * @param {IPoint} point - The other Point instance
       * @return {Point} - The Point instance
       */
      this.add = (point) => {
        this.x += point.x;
        this.y += point.y;
        return this;
      };
      this.x = x || 0;
      this.y = y || 0;
    }
  }

  const DEGREES_MULTIPLIER = Math.PI / 180;
  var math = {
    EPSILON: 2220446049250313e-31,
    /**
     * Converts degrees to radians
     * @param {number} degrees - the number of degrees
     * @returns {number} - the number of radians
     */
    degreesToRadians: (degrees) => {
      return degrees * DEGREES_MULTIPLIER;
    }
  };

  const _Random = class _Random {
  };
  /**
   * @static
   * @method get
   * @returns {number} A random number between 0 and 1
   *
   * @description Generates a random number between 0 and 1.
   */
  _Random.get = () => {
    return _Random.uniform(0, 1);
  };
  /**
   * Returns a random number between a specified range
   *
   * @param {number} min - The lowest number in the range
   * @param {number} max - The highest number in the range
   *
   * @returns {number} A random number between min and max
   */
  _Random.uniform = (min, max) => {
    return Math.random() * (max - min) + min;
  };
  let Random = _Random;

  class Behaviour {
    constructor() {
      /**
       * A protected property used to store the priority of the behaviour
       *
       * @protected
       */
      this.priority = 0;
      /**
       * Calculates the variance from a given value
       *
       * @param {number} value - a given value
       * @returns {number} the variance based on the given value
       */
      this.varianceFrom = (value) => {
        if (value === 0) return 0;
        return Random.uniform(-1, 1) * value;
      };
      /**
       * Gets the parser for the behaviour
       *
       * @returns {BehaviourParser} The parser for the behaviour
       */
      this.getParser = () => {
        return new BehaviourParser(this);
      };
    }
    /**
     * Gets the name of the behaviour
     *
     * @returns {string} The name of the behaviour
     */
    getName() {
      throw new Error("This method has to be overridden in subclass");
    }
  }

  class LifeBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 1e4;
      this.maxLifeTime = 0;
      this.timeVariance = 0;
      /**
       * Sets the particle's life time and maximum life time.
       *
       * @param {Particle} particle - The particle to set the life time of.
       * @returns {void}
       */
      this.init = (particle) => {
        particle.lifeTime = 0;
        particle.lifeProgress = 0;
        particle.maxLifeTime = Math.max(this.maxLifeTime + this.varianceFrom(this.timeVariance), 0);
      };
      /**
       * Updates the particle's life time and progress.
       *
       * @param {Particle} particle - The particle to update.
       * @param {number} deltaTime - The time since the last update.
       * @returns {void}
       */
      this.apply = (particle, deltaTime) => {
        const { maxLifeTime } = particle;
        const lifeTime = particle.lifeTime + deltaTime;
        particle.lifeTime = lifeTime;
        if (maxLifeTime > 0) {
          particle.lifeProgress = Math.min(1, lifeTime / maxLifeTime);
        }
      };
    }
    /**
     * Returns the name of this behaviour.
     *
     * @returns {string} - The name of the behaviour.
     */
    getName() {
      return behaviourNames.LIFE_BEHAVIOUR;
    }
    /**
     * Returns the properties of the behaviour.
     *
     * @returns {Object} - The properties of the behaviour.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        maxLifeTime: this.maxLifeTime,
        timeVariance: this.timeVariance,
        name: this.getName()
      };
    }
  }

  class MinMax {
    constructor(min, max) {
      /**
       * Sets the x and y coordinates of a Point
       * @param {number} min - The x coordinate
       * @param {number} max - The y coordinate
       * @return {MinMax} - The MinMax instance
       */
      this.set = (min, max) => {
        this.min = min;
        this.max = max === void 0 ? this.max : max;
        return this;
      };
      /**
       * Copies the x and y coordinates from another Point
       * @param {IMinMax} data - The Point instance to copy from
       * @return {MinMax} - The MinMax instance
       */
      this.copyFrom = (data) => {
        this.min = data.min;
        this.max = data.max;
        return this;
      };
      /**
       * Copies the x and y coordinates from an object with numeric x and y properties
       * @param {IMinMax} data - The object to copy from
       * @return {MinMax} - The MinMax instance
       */
      this.copyFromRawData = (data) => {
        this.copyFrom(data);
      };
      /**
       * Adds the x and y coordinates of another Point to this Point
       * @param {IMinMax} data - The other Point instance
       * @return {MinMax} - The MinMax instance
       */
      this.add = (data) => {
        this.min += data.min;
        this.max += data.max;
        return this;
      };
      this.min = min || 0;
      this.max = max || 0;
    }
  }

  class ThereBack {
    constructor(x, y, ease) {
      this.set = (x, y, ease) => {
        this.x = x || "";
        this.y = y || "";
        this.ease = ease || "";
        return this;
      };
      this.copyFrom = (data) => {
        this.x = data.x || "";
        this.y = data.y || "";
        this.ease = data.ease || "";
        return this;
      };
      this.copyFromRawData = (data) => {
        this.copyFrom(data);
      };
      this.x = x || "";
      this.y = y || "";
      this.ease = ease || "";
    }
  }

  class PositionBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = false;
      this.priority = 100;
      this.warp = false;
      this.warpSpeed = 0;
      this.warpBaseSpeed = 0;
      this.sinX = false;
      this.sinY = false;
      this.sinXVal = new Point();
      this.sinYVal = new Point();
      this.sinXValVariance = new Point();
      this.sinYValVariance = new Point();
      this.positionVariance = new Point();
      this.velocity = new Point();
      this.velocityVariance = new Point();
      this.acceleration = new Point();
      this.accelerationVariance = new Point();
      this.cameraZConverter = 10;
      this.warpFov = 20;
      this.warpStretch = 5;
      this.warpDistanceScaleConverter = 2e3;
      this.warpDistanceToCenter = false;
      this.fromAtoB = false;
      this.fromAtoBTwoWays = false;
      this.pointA = new Point();
      this.pointB = new Point();
      this.thereDuration = new MinMax();
      this.thereAmplitude = new MinMax();
      this.backDuration = new MinMax();
      this.backAmplitude = new MinMax();
      this.there = new ThereBack();
      this.back = new ThereBack();
      /**
       * Function that initializes a particle
       * @param {Particle} particle - The particle to be initialized
       * @param {Model} model - The model of the particle
       */
      this.init = (particle, model) => {
        if (!this.fromAtoB) {
          particle.velocity.x = this.calculate(this.velocity.x, this.velocityVariance.x);
          particle.velocity.y = this.calculate(this.velocity.y, this.velocityVariance.y);
          particle.acceleration.x = this.calculate(this.acceleration.x, this.accelerationVariance.x);
          particle.acceleration.y = this.calculate(this.acceleration.y, this.accelerationVariance.y);
          if (this.sinX) {
            particle.sinXVal.x = this.calculate(this.sinXVal.x, this.sinXValVariance.x);
            particle.sinXVal.y = this.calculate(this.sinXVal.y, this.sinXValVariance.y);
          }
          if (this.sinY) {
            particle.sinYVal.x = this.calculate(this.sinYVal.x, this.sinYValVariance.x);
            particle.sinYVal.y = this.calculate(this.sinYVal.y, this.sinYValVariance.y);
          }
          particle.x = particle.movement.x;
          particle.y = particle.movement.y;
          this.restartWarp(particle, true, model);
        } else {
          particle.thereDuration = Math.random() * (this.thereDuration.max - this.thereDuration.min) + this.thereDuration.min;
          particle.thereAmplitude = Math.random() * (this.thereAmplitude.max - this.thereAmplitude.min) + this.thereAmplitude.min;
          particle.backDuration = Math.random() * (this.backDuration.max - this.backDuration.min) + this.backDuration.min;
          particle.backAmplitude = Math.random() * (this.backAmplitude.max - this.backAmplitude.min) + this.backAmplitude.min;
          particle.pointA.copyFrom(this.pointA);
          particle.pointB.copyFrom(this.pointB);
          particle.xStart = this.pointA.x;
          particle.yStart = this.pointA.y;
          particle.xTarget = this.pointB.x;
          particle.yTarget = this.pointB.y;
          particle.there.copyFrom(this.there);
          particle.back.copyFrom(this.back);
        }
      };
      /**
       * Restarts the warp of a particle
       * @param {Particle} particle - The particle to restart the warp on
       * @param {boolean} initial - True if this is the initial warp, false if it is a subsequent one
       * @param {Model} model - The model containing the camera Z property
       */
      this.restartWarp = (particle, initial, model) => {
        if (!this.warp) return;
        const { sizeStart } = particle;
        if (initial) {
          particle.z = Math.random() * this.warpDistanceScaleConverter;
        } else {
          particle.z = model.cameraZ + Math.random() * this.warpDistanceScaleConverter;
        }
        const distance = Math.random() * this.positionVariance.x + 1;
        const deg = Math.random() * (Math.PI * 2);
        particle.warpSizeStart.x = (1 - distance / this.positionVariance.x) * 0.5 * sizeStart.x;
        particle.warpSizeStart.y = (1 - distance / this.positionVariance.y) * 0.5 * sizeStart.y;
        if (this.warpDistanceToCenter) {
          particle.movement.x = Math.cos(deg) * distance;
          particle.movement.y = Math.sin(deg) * distance;
        } else {
          particle.x = Math.cos(deg) * distance;
          particle.y = Math.sin(deg) * distance;
        }
        particle.color.alpha = (1 - distance / this.positionVariance.x) * 0.5;
      };
      /**
       * Adds a random variance to the given value
       * @param {number} value - The value to calculate
       * @param {number} variance - The random variance to add
       * @returns {number} The calculated value
       */
      this.calculate = (value, variance) => {
        return value + this.varianceFrom(variance);
      };
      /**
       * Applies the particle's velocity and acceleration to move it and calculate its size, rotation, and position.
       * @param {Particle} particle - The particle to be moved
       * @param {number} deltaTime - The time delta for the movement calculation
       * @param {Model} model - The model containing information about the particle's movement
       */
      this.apply = (particle, deltaTime, model) => {
        if (particle.skipPositionBehaviour) return;
        if (!this.fromAtoB) {
          const { acceleration, sinXVal, sinYVal, z, warpSizeStart, movement } = particle;
          const { cameraZ } = model;
          const PI = Math.PI;
          particle.velocity.x += acceleration.x * deltaTime;
          particle.velocity.y += acceleration.y * deltaTime;
          const movementX = movement.x + particle.velocity.x * deltaTime;
          const movementY = movement.y + particle.velocity.y * deltaTime;
          particle.movement.x = movementX;
          particle.movement.y = movementY;
          if (this.sinX) {
            particle.x = movementX + Math.sin(PI * (movementY / sinXVal.x)) * sinXVal.y;
          } else {
            particle.x = movementX;
          }
          if (this.sinY) {
            particle.y = movementY + Math.sin(PI * (movementX / sinYVal.x)) * sinYVal.y;
          } else {
            particle.y = movementY;
          }
          if (model.warp) {
            if (z < cameraZ) {
              this.restartWarp(particle, false, model);
            }
            const newZ = z - cameraZ;
            const dxCenter = movementX;
            const dyCenter = movementY;
            const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
            const distanceScale = Math.max(0, (this.warpDistanceScaleConverter - newZ) / this.warpDistanceScaleConverter);
            const fovZ = this.warpFov / newZ;
            particle.x = movementX * fovZ;
            particle.y = movementY * fovZ;
            particle.size.x = distanceScale * warpSizeStart.x;
            particle.size.y = distanceScale * warpSizeStart.y + distanceScale * this.warpSpeed * this.warpStretch * distanceCenter;
            particle.rotation = Math.atan2(dyCenter, dxCenter) + PI / 2;
          }
        } else {
          let progress = particle.progress;
          if (this.fromAtoBTwoWays && progress >= 1) {
            particle.direction = -particle.direction;
            particle.progress = 0;
            progress = 0;
            particle.time = 0;
          } else if (progress > 1) {
            return;
          }
          let easedProgress = progress;
          if (particle.direction === 1) {
            if (particle.there.ease === "back.inOut") {
              easedProgress = this._easeBackInOut(progress);
            } else if (particle.there.ease === "back.in") {
              easedProgress = this._easeBackIn(progress);
            } else if (particle.there.ease === "back.out") {
              easedProgress = this._easeBackOut(progress);
            } else if (particle.there.ease === "power1.in") {
              easedProgress = this._easePower1In(progress);
            } else if (particle.there.ease === "power1.out") {
              easedProgress = this._easePower1Out(progress);
            } else if (particle.there.ease === "power1.inOut") {
              easedProgress = this._easePower1InOut(progress);
            } else if (particle.there.ease === "bounce.in") {
              easedProgress = this._easeBounceIn(progress);
            } else if (particle.there.ease === "bounce.out") {
              easedProgress = this._easeBounceOut(progress);
            } else if (particle.there.ease === "bounce.inOut") {
              easedProgress = this._easeBounceInOut(progress);
            } else if (particle.there.ease === "elastic.in") {
              easedProgress = this._easeElasticIn(progress);
            } else if (particle.there.ease === "elastic.out") {
              easedProgress = this._easeElasticOut(progress);
            } else if (particle.there.ease === "elastic.inOut") {
              easedProgress = this._easeElasticInOut(progress);
            } else if (particle.there.ease === "steps") {
              easedProgress = this._easeSteps(progress);
            }
            const xInterpolated = this._lerp(particle.xStart, particle.xTarget, easedProgress);
            const yInterpolated = this._lerp(particle.yStart, particle.yTarget, easedProgress);
            if (particle.there.x === "Sin") {
              particle.x = xInterpolated + Math.sin(progress * Math.PI) * particle.thereAmplitude;
            } else if (particle.there.x === "Cos") {
              particle.x = xInterpolated + Math.cos(progress * Math.PI) * particle.thereAmplitude;
            } else if (particle.there.x === "Tan") {
              particle.x = xInterpolated + Math.tan(progress * Math.PI) * particle.thereAmplitude;
            } else {
              particle.x = xInterpolated + easedProgress;
            }
            if (particle.there.y === "Sin") {
              particle.y = yInterpolated + Math.sin(progress * Math.PI) * particle.thereAmplitude;
            } else if (particle.there.y === "Cos") {
              particle.y = yInterpolated + Math.cos(progress * Math.PI) * particle.thereAmplitude;
            } else if (particle.there.y === "Tan") {
              particle.y = yInterpolated + Math.tan(progress * Math.PI) * particle.thereAmplitude;
            } else {
              particle.y = yInterpolated + easedProgress;
            }
          } else {
            if (particle.back.ease === "back.inOut") {
              easedProgress = this._easeBackInOut(progress);
            } else if (particle.back.ease === "back.in") {
              easedProgress = this._easeBackIn(progress);
            } else if (particle.back.ease === "back.out") {
              easedProgress = this._easeBackOut(progress);
            } else if (particle.back.ease === "power1.in") {
              easedProgress = this._easePower1In(progress);
            } else if (particle.back.ease === "power1.out") {
              easedProgress = this._easePower1Out(progress);
            } else if (particle.back.ease === "power1.inOut") {
              easedProgress = this._easePower1InOut(progress);
            } else if (particle.back.ease === "bounce.in") {
              easedProgress = this._easeBounceIn(progress);
            } else if (particle.back.ease === "bounce.out") {
              easedProgress = this._easeBounceOut(progress);
            } else if (particle.back.ease === "bounce.inOut") {
              easedProgress = this._easeBounceInOut(progress);
            } else if (particle.back.ease === "elastic.in") {
              easedProgress = this._easeElasticIn(progress);
            } else if (particle.back.ease === "elastic.out") {
              easedProgress = this._easeElasticOut(progress);
            } else if (particle.back.ease === "elastic.inOut") {
              easedProgress = this._easeElasticInOut(progress);
            } else if (particle.back.ease === "steps") {
              easedProgress = this._easeSteps(progress);
            }
            const xInterpolated = this._lerp(particle.xTarget, particle.xStart, easedProgress);
            const yInterpolated = this._lerp(particle.yTarget, particle.yStart, easedProgress);
            if (particle.back.x === "Sin") {
              particle.x = xInterpolated + Math.sin(progress * Math.PI) * particle.backAmplitude;
            } else if (particle.back.x === "Cos") {
              particle.x = xInterpolated + Math.cos(progress * Math.PI) * particle.backAmplitude;
            } else if (particle.back.x === "Tan") {
              particle.x = xInterpolated + Math.tan(progress * Math.PI) * particle.backAmplitude;
            } else {
              particle.x = xInterpolated + easedProgress;
            }
            if (particle.back.y === "Sin") {
              particle.y = yInterpolated + Math.sin(progress * Math.PI) * particle.backAmplitude;
            } else if (particle.back.y === "Cos") {
              particle.y = yInterpolated + Math.cos(progress * Math.PI) * particle.backAmplitude;
            } else if (particle.back.y === "Tan") {
              particle.y = yInterpolated + Math.tan(progress * Math.PI) * particle.backAmplitude;
            } else {
              particle.y = yInterpolated + easedProgress;
            }
          }
          particle.time += deltaTime;
          if (particle.direction === 1) {
            particle.progress = particle.time / particle.thereDuration;
          } else {
            particle.progress = particle.time / particle.backDuration;
          }
        }
      };
    }
    /**
     * Gets the name of the behaviour
     * @return {BehaviourNames} The name of the behaviour
     */
    getName() {
      return behaviourNames.POSITION_BEHAVIOUR;
    }
    _lerp(start, end, t) {
      return start * (1 - t) + end * t;
    }
    _easeBackInOut(t, c1 = 1.70158, c2 = c1 * 1.525) {
      return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
    _easeBackIn(t, c1 = 1.70158) {
      t = Math.min(Math.max(t, 0), 1);
      return t * t * ((c1 + 1) * t - c1);
    }
    _easeBackOut(t, c1 = 1.70158) {
      t = Math.min(Math.max(t, 0), 1);
      const tInv = t - 1;
      return tInv * tInv * ((c1 + 1) * tInv + c1) + 1;
    }
    _easePower1In(t) {
      return t;
    }
    _easePower1Out(t) {
      return 1 - Math.pow(1 - t, 2);
    }
    _easePower1InOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    _easeBounceIn(t) {
      return 1 - this._easeBounceOut(1 - t);
    }
    _easeBounceOut(t) {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
    _easeBounceInOut(t) {
      return t < 0.5 ? (1 - this._easeBounceOut(1 - 2 * t)) / 2 : (1 + this._easeBounceOut(2 * t - 1)) / 2;
    }
    _easeElasticIn(t) {
      const c4 = 2 * Math.PI / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }
    _easeElasticOut(t) {
      const c4 = 2 * Math.PI / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    _easeElasticInOut(t) {
      const c5 = 2 * Math.PI / 4.5;
      return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2 : Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5) / 2 + 1;
    }
    _easeSteps(t, numSteps = 12) {
      const stepSize = 1 / numSteps;
      const stepIndex = Math.floor(t / stepSize);
      return stepIndex * stepSize;
    }
    /**
     * @description Retrieves the properties of the object.
     * @returns {Object} The properties of the object.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        fromAtoB: this.fromAtoB,
        fromAtoBTwoWays: this.fromAtoBTwoWays,
        there: {
          x: this.there.x,
          y: this.there.y,
          ease: this.there.ease
        },
        back: {
          x: this.back.x,
          y: this.back.y,
          ease: this.back.ease
        },
        pointA: {
          x: this.pointA.x,
          y: this.pointA.y
        },
        pointB: {
          x: this.pointB.x,
          y: this.pointB.y
        },
        thereDuration: {
          min: this.thereDuration.min,
          max: this.thereDuration.max
        },
        thereAmplitude: {
          min: this.thereAmplitude.min,
          max: this.thereAmplitude.max
        },
        backDuration: {
          min: this.backDuration.min,
          max: this.backDuration.max
        },
        backAmplitude: {
          min: this.backAmplitude.min,
          max: this.backAmplitude.max
        },
        warp: this.warp,
        sinX: this.sinX,
        sinY: this.sinY,
        sinXVal: this.sinXVal,
        sinYVal: this.sinYVal,
        sinXValVariance: this.sinXValVariance,
        sinYValVariance: this.sinYValVariance,
        positionVariance: {
          x: this.positionVariance.x,
          y: this.positionVariance.y
        },
        velocity: {
          x: this.velocity.x,
          y: this.velocity.y
        },
        velocityVariance: {
          x: this.velocityVariance.x,
          y: this.velocityVariance.y
        },
        acceleration: {
          x: this.acceleration.x,
          y: this.acceleration.y
        },
        accelerationVariance: {
          x: this.accelerationVariance.x,
          y: this.accelerationVariance.y
        },
        warpSpeed: this.warpSpeed,
        warpBaseSpeed: this.warpBaseSpeed,
        cameraZConverter: this.cameraZConverter,
        warpFov: this.warpFov,
        warpStretch: this.warpStretch,
        warpDistanceScaleConverter: this.warpDistanceScaleConverter,
        warpDistanceToCenter: this.warpDistanceToCenter,
        name: this.getName()
      };
    }
  }

  class ColorBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = false;
      this.priority = 0;
      this.start = new Color();
      this.end = new Color();
      this.startVariance = new Color(0, 0, 0, 0);
      this.endVariance = new Color(0, 0, 0, 0);
      this.sinus = false;
      // New properties
      this.colorStops = [];
      // Multi-gradient stops
      this.usePerlin = false;
      // Enable Perlin noise-based color changes
      this.pulseSpeed = 0;
      // Speed of the pulse effect
      this.pulseIntensity = 0;
      // Intensity of the pulse effect
      this.mirrorTransition = false;
      // Mirror the color transition midway
      this.fadeToGray = false;
      // Desaturate color over time
      this.fadeToTransparent = false;
      // Fade alpha over time
      this.flickerIntensity = 0;
      // Intensity of random flickering
      this.init = (particle) => {
        if (!this.enabled) return;
        function clamp(val, min, max) {
          return Math.min(Math.max(val, min), max);
        }
        particle.colorStart.copyFrom(this.start);
        particle.colorStart.r += this.varianceFrom(this.startVariance.r);
        particle.colorStart.g += this.varianceFrom(this.startVariance.g);
        particle.colorStart.b += this.varianceFrom(this.startVariance.b);
        particle.colorStart.alpha += this.varianceFrom(this.startVariance.alpha);
        particle.colorStart.r = clamp(particle.colorStart.r, 0, 255);
        particle.colorStart.g = clamp(particle.colorStart.g, 0, 255);
        particle.colorStart.b = clamp(particle.colorStart.b, 0, 255);
        particle.colorStart.alpha = clamp(particle.colorStart.alpha, 0, 255);
        particle.colorEnd.copyFrom(this.end);
        particle.colorEnd.r += this.varianceFrom(this.endVariance.r);
        particle.colorEnd.g += this.varianceFrom(this.endVariance.g);
        particle.colorEnd.b += this.varianceFrom(this.endVariance.b);
        particle.colorEnd.alpha += this.varianceFrom(this.endVariance.alpha);
        particle.colorEnd.r = clamp(particle.colorEnd.r, 0, 255);
        particle.colorEnd.g = clamp(particle.colorEnd.g, 0, 255);
        particle.colorEnd.b = clamp(particle.colorEnd.b, 0, 255);
        particle.colorEnd.alpha = clamp(particle.colorEnd.alpha, 0, 255);
        particle.color.copyFrom(particle.colorStart);
      };
      this.apply = (particle) => {
        if (!this.enabled) return;
        if (particle.skipColorBehaviour) return;
        const { lifeProgress } = particle;
        if (this.colorStops.length > 0) {
          this.applyColorStops(particle, lifeProgress);
          if (this.sinus) {
            particle.color.alpha = Math.sin(lifeProgress * 3.1);
          } else if (this.fadeToTransparent) {
            particle.color.alpha = (1 - lifeProgress) * this.start.alpha;
          }
          return;
        }
        if (this.usePerlin) {
          this.applyPerlinColor(particle, lifeProgress);
          return;
        }
        const { colorStart, colorEnd } = particle;
        let effectiveProgress = lifeProgress;
        if (this.mirrorTransition) {
          effectiveProgress = lifeProgress < 0.5 ? lifeProgress * 2 : (1 - lifeProgress) * 2;
        }
        particle.color.copyFrom(colorStart);
        particle.color.r += (colorEnd.r - colorStart.r) * effectiveProgress;
        particle.color.g += (colorEnd.g - colorStart.g) * effectiveProgress;
        particle.color.b += (colorEnd.b - colorStart.b) * effectiveProgress;
        if (!this.sinus) {
          particle.color.alpha += (colorEnd.alpha - colorStart.alpha) * effectiveProgress;
        } else {
          if (!this.fadeToTransparent) {
            particle.color.alpha = Math.sin(effectiveProgress * 3.1);
            if (particle.color.alpha > particle.superColorAlphaEnd) {
              particle.color.alpha = particle.superColorAlphaEnd;
            }
          }
        }
        if (this.pulseIntensity > 0) {
          this.applyPulseEffect(particle, lifeProgress);
        }
        if (this.fadeToGray) {
          this.applyFadeToGray(particle);
        }
        if (this.fadeToTransparent && !this.sinus) {
          particle.color.alpha = (1 - lifeProgress) * this.start.alpha;
        }
        if (this.flickerIntensity) {
          this.applyFlickering(particle);
        }
      };
      this.applyColorStops = (particle, lifeProgress) => {
        const { colorStops } = this;
        if (colorStops.length < 2) {
          return;
        }
        const segment = Math.floor(lifeProgress * (colorStops.length - 1));
        const nextSegment = Math.min(segment + 1, colorStops.length - 1);
        const t = lifeProgress * (colorStops.length - 1) - segment;
        const startColor = colorStops[segment];
        const endColor = colorStops[nextSegment];
        particle.color.r = startColor.r + (endColor.r - startColor.r) * t;
        particle.color.g = startColor.g + (endColor.g - startColor.g) * t;
        particle.color.b = startColor.b + (endColor.b - startColor.b) * t;
        particle.color.alpha = startColor.alpha + (endColor.alpha - startColor.alpha) * t;
      };
      this.applyPerlinColor = (particle, lifeProgress) => {
        const time = lifeProgress * 10;
        particle.color.r = this.pseudoRandomNoise(time) * 255;
        particle.color.g = this.pseudoRandomNoise(time + 1) * 255;
        particle.color.b = this.pseudoRandomNoise(time + 2) * 255;
        particle.color.alpha = this.pseudoRandomNoise(time + 3);
      };
      this.applyPulseEffect = (particle, lifeProgress) => {
        const pulse = 1 + Math.sin(lifeProgress * this.pulseSpeed * Math.PI * 2) * this.pulseIntensity;
        particle.color.r = Math.max(0, Math.min(255, particle.color.r * pulse));
        particle.color.g = Math.max(0, Math.min(255, particle.color.g * pulse));
        particle.color.b = Math.max(0, Math.min(255, particle.color.b * pulse));
      };
      this.applyFadeToGray = (particle) => {
        const { color } = particle;
        const gray = (color.r + color.g + color.b) / 3;
        particle.color.r = gray;
        particle.color.g = gray;
        particle.color.b = gray;
      };
      this.applyFlickering = (particle) => {
        const flickerAmount = (Math.random() - 0.5) * this.flickerIntensity * 255;
        particle.color.r = Math.max(0, Math.min(255, particle.color.r + flickerAmount));
        particle.color.g = Math.max(0, Math.min(255, particle.color.g + flickerAmount));
        particle.color.b = Math.max(0, Math.min(255, particle.color.b + flickerAmount));
      };
    }
    pseudoRandomNoise(seed) {
      const x = Math.sin(seed) * 1e4;
      return x - Math.floor(x);
    }
    getName() {
      return behaviourNames.COLOR_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        start: {
          _r: this.start.r,
          _g: this.start.g,
          _b: this.start.b,
          _alpha: this.start.alpha
        },
        end: {
          _r: this.end.r,
          _g: this.end.g,
          _b: this.end.b,
          _alpha: this.end.alpha
        },
        startVariance: {
          _r: this.startVariance.r,
          _g: this.startVariance.g,
          _b: this.startVariance.b,
          _alpha: this.startVariance.alpha
        },
        endVariance: {
          _r: this.endVariance.r,
          _g: this.endVariance.g,
          _b: this.endVariance.b,
          _alpha: this.endVariance.alpha
        },
        sinus: this.sinus,
        colorStops: this.colorStops,
        usePerlin: this.usePerlin,
        pulseSpeed: this.pulseSpeed,
        pulseIntensity: this.pulseIntensity,
        mirrorTransition: this.mirrorTransition,
        fadeToGray: this.fadeToGray,
        fadeToTransparent: this.fadeToTransparent,
        flickerIntensity: this.flickerIntensity,
        name: this.getName()
      };
    }
  }

  class AttractionRepulsionBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 200;
      // Ensure this runs after PositionBehaviour if needed
      /**
       * List of influence points affecting particles.
       * Each point: { point: Point, strength: number, range: number }
       */
      this.influencePoints = [];
      /**
       * Initializes the particle, but does not modify position directly.
       * @param {Particle} particle - The particle to initialize.
       */
      this.init = (particle) => {
      };
      /**
       * Applies attraction or repulsion forces to the particle additively.
       * @param {Particle} particle - The particle to apply the behavior to.
       * @param {number} deltaTime - Time elapsed since the last frame.
       */
      this.apply = (particle, deltaTime) => {
        if (!this.enabled || particle.skipPositionBehaviour || particle.skipAttractionRepulsionBehaviour) return;
        let totalForceX = 0;
        let totalForceY = 0;
        this.influencePoints.forEach(({ point, strength, range }) => {
          const dx = point.x - particle.x;
          const dy = point.y - particle.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > range * range || distanceSquared === 0) return;
          const distance = Math.sqrt(distanceSquared);
          const force = strength * (1 - distance / range) * deltaTime;
          const normalizedDx = dx / distance;
          const normalizedDy = dy / distance;
          totalForceX += normalizedDx * force;
          totalForceY += normalizedDy * force;
        });
        particle.velocity.x += totalForceX;
        particle.velocity.y += totalForceY;
        particle.x += particle.velocity.x * deltaTime;
        particle.y += particle.velocity.y * deltaTime;
      };
    }
    /**
     * Gets the name of the behavior.
     * @returns {string} - The name of the behavior.
     */
    getName() {
      return behaviourNames.ATTRACTION_REPULSION_BEHAVIOUR;
    }
    /**
     * Gets the properties of the behavior.
     * @returns {object} - The properties of the behavior.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        influencePoints: this.influencePoints,
        name: this.getName()
      };
    }
  }

  class SizeBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.sizeStart = new Point(1, 1);
      this.sizeEnd = new Point(1, 1);
      this.startVariance = 0;
      this.endVariance = 0;
      this.maxSize = new Point(2, 2);
      // Maximum size clamp
      this.uniformScaling = true;
      // Toggle for uniform scaling
      this.pulsate = false;
      // Enable pulsating size effect
      this.pulsationSpeed = 1;
      // Speed of pulsation
      this.pulsationAmplitude = 0.2;
      // Amplitude of pulsation
      this.useNoise = false;
      // Use noise for size modulation
      this.noiseScale = 0.1;
      // Scale of the noise effect
      this.invertAtMidpoint = false;
      // Invert size at midpoint
      this.sizeSteps = [];
      // Array of size points for multi-step transitions
      this.timeOffset = 0;
      // Delay or advance size scaling
      this.xScalingFunction = "linear";
      // Easing for x-axis
      this.yScalingFunction = "linear";
      // Easing for y-axis
      this.sizeAlphaDependency = false;
      // Link size to alpha value
      this.init = (particle) => {
        if (!this.enabled) return;
        let variance = this.varianceFrom(this.startVariance);
        const sizeStartX = this.sizeStart.x + variance;
        const sizeStartY = this.sizeStart.y + variance;
        variance = this.varianceFrom(this.endVariance);
        const sizeEndX = this.sizeEnd.x + variance;
        const sizeEndY = this.sizeEnd.y + variance;
        particle.sizeDifference = {
          x: sizeEndX - sizeStartX,
          y: sizeEndY - sizeStartY
        };
        particle.sizeStart.x = sizeStartX;
        particle.sizeStart.y = sizeStartY;
        particle.sizeEnd.x = sizeEndX;
        particle.sizeEnd.y = sizeEndY;
        particle.size.copyFrom(particle.sizeStart);
      };
      this.apply = (particle, deltaTime) => {
        if (!this.enabled || particle.skipSizeBehaviour) return;
        let lifeProgress = particle.lifeProgress - this.timeOffset;
        if (lifeProgress < 0) return;
        if (this.invertAtMidpoint && lifeProgress > 0.5) {
          lifeProgress = 1 - lifeProgress;
        }
        if (this.sizeSteps.length > 0) {
          this.applyMultiStepSize(particle, lifeProgress);
          return;
        }
        let sizeX = particle.sizeStart.x + particle.sizeDifference.x * this.applyEasing(lifeProgress, this.xScalingFunction);
        let sizeY = this.uniformScaling ? sizeX : particle.sizeStart.y + particle.sizeDifference.y * this.applyEasing(lifeProgress, this.yScalingFunction);
        if (this.pulsate) {
          const pulseFactor = 1 + Math.sin(particle.lifeTime * this.pulsationSpeed * Math.PI * 2) * this.pulsationAmplitude;
          sizeX *= pulseFactor;
          sizeY *= pulseFactor;
        }
        if (this.useNoise) {
          const noiseFactor = this.pseudoRandomNoise(particle.lifeTime * this.noiseScale);
          sizeX *= noiseFactor;
          sizeY *= noiseFactor;
        }
        if (this.sizeAlphaDependency) {
          const alphaFactor = particle.color.alpha;
          sizeX *= alphaFactor;
          sizeY *= alphaFactor;
        }
        sizeX = Math.min(sizeX, this.maxSize.x);
        sizeY = Math.min(sizeY, this.maxSize.y);
        particle.size.x = sizeX;
        particle.size.y = sizeY;
      };
      this.applyMultiStepSize = (particle, lifeProgress) => {
        const stepCount = this.sizeSteps.length - 1;
        if (stepCount < 1) return;
        const currentStep = Math.floor(lifeProgress * stepCount);
        const nextStep = Math.min(currentStep + 1, stepCount);
        const t = lifeProgress * stepCount % 1;
        const sizeStart = this.sizeSteps[currentStep];
        const sizeEnd = this.sizeSteps[nextStep];
        particle.size.x = sizeStart.x + (sizeEnd.x - sizeStart.x) * this.applyEasing(t, this.xScalingFunction);
        particle.size.y = sizeStart.y + (sizeEnd.y - sizeStart.y) * this.applyEasing(t, this.yScalingFunction);
      };
      this.applyEasing = (progress, easingType) => {
        switch (easingType) {
          case "easeIn":
            return progress * progress;
          case "easeOut":
            return 1 - Math.pow(1 - progress, 2);
          case "easeInOut":
            return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          case "linear":
          default:
            return progress;
        }
      };
      this.pseudoRandomNoise = (seed) => {
        const prime = 2654435761;
        const x = Math.sin(seed * prime) * 1e4;
        return x - Math.floor(x);
      };
    }
    getName() {
      return behaviourNames.SIZE_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        sizeStart: {
          x: this.sizeStart.x,
          y: this.sizeStart.y
        },
        sizeEnd: {
          x: this.sizeEnd.x,
          y: this.sizeEnd.y
        },
        startVariance: this.startVariance,
        endVariance: this.endVariance,
        maxSize: {
          x: this.maxSize.x,
          y: this.maxSize.y
        },
        uniformScaling: this.uniformScaling,
        pulsate: this.pulsate,
        pulsationSpeed: this.pulsationSpeed,
        pulsationAmplitude: this.pulsationAmplitude,
        useNoise: this.useNoise,
        noiseScale: this.noiseScale,
        invertAtMidpoint: this.invertAtMidpoint,
        sizeSteps: this.sizeSteps,
        timeOffset: this.timeOffset,
        xScalingFunction: this.xScalingFunction,
        yScalingFunction: this.yScalingFunction,
        sizeAlphaDependency: this.sizeAlphaDependency,
        name: this.getName()
      };
    }
  }

  class AngularVelocityBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.priority = 100;
      this.enabled = false;
      this.degrees = 0;
      this.degreesVariance = 0;
      this.maxRadius = 0;
      this.maxRadiusVariance = 0;
      this.minRadius = 0;
      this.minRadiusVariance = 0;
      this.oscillate = false;
      // Oscillate angular velocity
      this.oscillationSpeed = 1;
      // Speed of oscillation
      this.oscillationAmplitude = 10;
      // Amplitude of oscillation in degrees
      this.linearRadiusReduction = true;
      // Linear or exponential radius reduction
      this.dynamicRadius = false;
      // Allow dynamic radius changes during lifetime
      /**
       * Initializes particle properties of the behaviour
       *
       * @param {Particle} particle - The current particle
       * @memberof AngularVelocityBehaviour
       */
      this.init = (particle) => {
        if (!this.enabled) return;
        particle.radiansPerSecond = math.degreesToRadians(this.degrees + this.varianceFrom(this.degreesVariance));
        const radiusStart = this.maxRadius + this.varianceFrom(this.maxRadiusVariance);
        const radiusEnd = this.minRadius + this.varianceFrom(this.minRadiusVariance);
        particle.radiusStart = radiusStart;
        particle.radiusEnd = radiusEnd;
        particle.velocityAngle = 0;
        particle.x = 0;
        particle.y = 0;
        particle.radius = radiusStart;
        particle.angle = 0;
      };
      /**
       * Applies the behaviour to the particle
       *
       * @param {Particle} particle - The current particle
       * @param {number} deltaTime - Time elapsed since the last frame
       * @memberof AngularVelocityBehaviour
       */
      this.apply = (particle, deltaTime) => {
        if (!this.enabled) return;
        if (particle.skipAngularVelocityBehaviour) return;
        const { radiusStart, radiusEnd, radiansPerSecond, lifeProgress, velocityAngle } = particle;
        let angleVelocity = radiansPerSecond;
        if (this.oscillate) {
          const oscillationFactor = Math.sin(particle.lifeTime * this.oscillationSpeed) * this.oscillationAmplitude;
          angleVelocity += math.degreesToRadians(oscillationFactor);
        }
        const newVelocityAngle = velocityAngle + angleVelocity * deltaTime;
        let newRadius;
        if (this.linearRadiusReduction) {
          newRadius = radiusStart + (radiusEnd - radiusStart) * lifeProgress;
        } else {
          const progressFactor = Math.pow(lifeProgress, 2);
          newRadius = radiusStart + (radiusEnd - radiusStart) * progressFactor;
        }
        if (this.dynamicRadius) {
          newRadius += Math.sin(particle.lifeTime * 2 * Math.PI) * 5;
        }
        const movementX = Math.cos(newVelocityAngle) * newRadius;
        const movementY = Math.sin(newVelocityAngle) * newRadius;
        particle.velocityAngle = newVelocityAngle;
        particle.radius = newRadius;
        particle.movement.x = movementX;
        particle.movement.y = movementY;
        particle.x = movementX;
        particle.y = movementY;
      };
    }
    /**
     * Returns the name of the behaviour
     *
     * @returns {string} Name of the behaviour
     * @memberof AngularVelocityBehaviour
     */
    getName() {
      return behaviourNames.ANGULAR_BEHAVIOUR;
    }
    /**
     * Returns the properties of the behaviour
     *
     * @returns {object} Properties of the behaviour
     * @memberof AngularVelocityBehaviour
     */
    getProps() {
      return {
        enabled: this.enabled,
        degrees: this.degrees,
        degreesVariance: this.degreesVariance,
        maxRadius: this.maxRadius,
        maxRadiusVariance: this.maxRadiusVariance,
        minRadius: this.minRadius,
        minRadiusVariance: this.minRadiusVariance,
        oscillate: this.oscillate,
        oscillationSpeed: this.oscillationSpeed,
        oscillationAmplitude: this.oscillationAmplitude,
        linearRadiusReduction: this.linearRadiusReduction,
        dynamicRadius: this.dynamicRadius,
        priority: this.priority,
        name: this.getName()
      };
    }
  }

  let _tmp = 0;
  class EmitDirectionBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.angle = 0;
      this.variance = 0;
      // New properties
      this.oscillate = false;
      // Enable directional oscillation
      this.oscillationSpeed = 1;
      // Speed of oscillation
      this.oscillationAmplitude = 0;
      // Amplitude of oscillation
      this.useNoise = false;
      // Use Perlin noise for direction changes
      this.noiseScale = 0.1;
      // Scale of the noise effect
      this.velocityScaling = false;
      // Scale velocity based on life progress
      /**
       * Initializes the particle's direction.
       * @param {Particle} particle - The particle that is being initialized.
       * @memberof EmitDirectionBehaviour
       */
      this.init = (particle) => {
        if (!this.enabled) return;
        const baseAngle = this.angle + this.varianceFrom(this.variance);
        particle.initialDirectionCos = Math.cos(baseAngle);
        particle.initialDirectionSin = Math.sin(baseAngle);
        particle.directionCos = particle.initialDirectionCos;
        particle.directionSin = particle.initialDirectionSin;
        particle.velocityScale = 1;
      };
      /**
       * Applies the behavior to the particle.
       * @param {Particle} particle - The particle to which the behavior is being applied.
       * @param {number} deltaTime - The amount of time since the behavior was last applied.
       * @memberof EmitDirectionBehaviour
       */
      this.apply = (particle, deltaTime) => {
        if (!this.enabled) return;
        if (particle.skipEmitDirectionBehaviour) return;
        const { x, y, directionSin, directionCos, lifeProgress } = particle;
        if (this.oscillate) {
          const oscillation = Math.sin(particle.lifeTime * this.oscillationSpeed) * this.oscillationAmplitude;
          particle.directionCos = Math.cos(oscillation);
          particle.directionSin = Math.sin(oscillation);
        }
        if (this.useNoise) {
          const noiseValue = this.pseudoRandomNoise(particle.lifeTime * this.noiseScale);
          const noiseAngle = noiseValue * 2 * Math.PI;
          particle.directionCos = Math.cos(noiseAngle);
          particle.directionSin = Math.sin(noiseAngle);
        }
        if (this.velocityScaling) {
          particle.velocityScale = lifeProgress;
        }
        _tmp = directionCos * x - directionSin * y;
        particle.y = directionSin * x + directionCos * y;
        particle.x = _tmp;
        particle.x *= particle.velocityScale;
        particle.y *= particle.velocityScale;
      };
    }
    pseudoRandomNoise(seed) {
      const prime = 2654435761;
      const x = Math.sin(seed * prime) * 1e4;
      return x - Math.floor(x);
    }
    /**
     * Gets the name of the behavior.
     * @returns {BehaviourNames.EMIT_DIRECTION}
     * @memberof EmitDirectionBehaviour
     */
    getName() {
      return behaviourNames.EMIT_DIRECTION;
    }
    /**
     * Gets the properties of the behavior.
     * @returns {object} - The properties of the behavior.
     * @memberof EmitDirectionBehaviour
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        angle: this.angle,
        variance: this.variance,
        oscillate: this.oscillate,
        oscillationSpeed: this.oscillationSpeed,
        oscillationAmplitude: this.oscillationAmplitude,
        useNoise: this.useNoise,
        noiseScale: this.noiseScale,
        velocityScaling: this.velocityScaling,
        name: this.getName()
      };
    }
  }

  class RotationBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = false;
      this.priority = 0;
      this.rotation = 0;
      // Base rotation speed
      this.variance = 0;
      // Variance in rotation speed
      this.oscillate = false;
      // Enable oscillation
      this.oscillationSpeed = 1;
      // Speed of oscillation
      this.oscillationAmplitude = 0;
      // Amplitude of oscillation
      this.useNoise = false;
      // Use Perlin noise for rotation
      this.noiseScale = 0.1;
      // Scale of Perlin noise
      this.acceleration = 0;
      // Rotation acceleration (positive or negative)
      this.clockwise = true;
      // Clockwise or counterclockwise rotation
      /**
       * Initialise the Behaviour for a particle
       * @param {Particle} particle - The particle to be initialised
       */
      this.init = (particle) => {
        if (!this.enabled) return;
        const baseRotation = this.rotation + this.varianceFrom(this.variance);
        particle.rotationDelta = this.clockwise ? baseRotation : -baseRotation;
        particle.rotationAcceleration = this.acceleration;
      };
      /**
       * Applies the Behaviour to a particle
       * @param {Particle} particle - The particle to apply the Behaviour to
       * @param {number} deltaTime - The delta time of the runtime
       */
      this.apply = (particle, deltaTime) => {
        if (!this.enabled) return;
        if (particle.skipRotationBehaviour) return;
        let deltaRotation = particle.rotationDelta;
        if (this.oscillate) {
          const oscillation = Math.sin(particle.lifeTime * this.oscillationSpeed) * this.oscillationAmplitude;
          deltaRotation += oscillation;
        }
        if (this.useNoise) {
          const noiseValue = this.pseudoRandomNoise(particle.lifeTime * this.noiseScale);
          deltaRotation += noiseValue * 2 - 1;
        }
        if (particle.rotationAcceleration) {
          particle.rotationDelta += particle.rotationAcceleration * deltaTime;
          deltaRotation = particle.rotationDelta;
        }
        particle.rotation += deltaRotation * deltaTime;
      };
    }
    /**
     * Pseudo-random noise generator for smooth transitions
     * @param {number} seed - Input seed for generating noise
     * @returns {number} - Noise value between 0 and 1
     */
    pseudoRandomNoise(seed) {
      const x = Math.sin(seed * 1e4) * 1e4;
      return x - Math.floor(x);
    }
    /**
     * Gets the name of the Behaviour
     * @returns {string} - The name of the Behaviour
     */
    getName() {
      return behaviourNames.ROTATION_BEHAVIOUR;
    }
    /**
     * Gets the properties of the Behaviour
     * @returns {object} - The properties of the Behaviour
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        rotation: this.rotation,
        variance: this.variance,
        oscillate: this.oscillate,
        oscillationSpeed: this.oscillationSpeed,
        oscillationAmplitude: this.oscillationAmplitude,
        useNoise: this.useNoise,
        noiseScale: this.noiseScale,
        acceleration: this.acceleration,
        clockwise: this.clockwise,
        name: this.getName()
      };
    }
  }

  class TurbulenceBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.priority = 1e3;
      this.position = new Point();
      this.positionVariance = new Point();
      this.velocity = new Point();
      this.velocityVariance = new Point();
      this.acceleration = new Point();
      this.accelerationVariance = new Point();
      this.sizeStart = new Point(1, 1);
      this.sizeEnd = new Point(1, 1);
      this.startVariance = 0;
      this.endVariance = 0;
      this.emitPerSecond = 0;
      this.duration = 0;
      this.maxLifeTime = 0;
      this.enabled = false;
      this.showVortices = false;
      this.effect = 0;
      this.turbulence = false;
      this.vortexOrgSize = 128;
      this.init = (particle, model, turbulencePool) => {
        if (!this.enabled) return;
        particle.showVortices = this.showVortices;
        particle.turbulence = this.turbulence;
        this.turbulencePool = turbulencePool;
      };
      this.apply = (particle) => {
        if (!this.enabled) return;
        if (particle.turbulence) return;
        this.turbulencePool.list.forEach((vortex) => {
          let vx = 0;
          let vy = 0;
          let factor = 0;
          const dx = particle.x - vortex.x;
          const dy = particle.y - vortex.y;
          if (dx > this.vortexOrgSize * vortex.size.x) return;
          if (dy > this.vortexOrgSize * vortex.size.x) return;
          if (this.effect === 0 || this.effect === 1) {
            if (!this.effect) {
              vx = -dy + vortex.velocity.x;
              vy = dx + vortex.velocity.y;
            } else {
              vx = dy + vortex.velocity.x;
              vy = -dx + vortex.velocity.y;
            }
            factor = 1 / (1 + (dx * dx + dy * dy) / (this.vortexOrgSize * vortex.size.x));
          } else if (this.effect === 2) {
            vx = dx + vortex.velocity.x;
            vy = dy + vortex.velocity.y;
            factor = 1 / (1 + (dx * dx + dy * dy) / (this.vortexOrgSize * vortex.size.x));
          } else if (this.effect === 3) {
            vx = dx - vortex.velocity.x;
            vy = dy - vortex.velocity.y;
            factor = 1 / (1 + (dx * dx + dy * dy) / (this.vortexOrgSize * vortex.size.x));
          } else if (this.effect === 4) {
            vx = -dx + vortex.velocity.x;
            vy = -dy + vortex.velocity.y;
            factor = 1 / (1 + (dx * dx + dy * dy) / (this.vortexOrgSize * vortex.size.x));
          } else if (this.effect === 5) {
            vx = -dx - vortex.velocity.x;
            vy = -dy - vortex.velocity.y;
            factor = 1 / (1 + (dx * dx + dy * dy) / (this.vortexOrgSize * vortex.size.x));
          }
          particle.velocity.x += (vx - particle.velocity.x) * factor;
          particle.velocity.y += (vy - particle.velocity.y) * factor;
        });
      };
    }
    getName() {
      return behaviourNames.TURBULENCE_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        position: {
          x: this.position.x,
          y: this.position.y
        },
        positionVariance: {
          x: this.positionVariance.x,
          y: this.positionVariance.y
        },
        velocity: {
          x: this.velocity.x,
          y: this.velocity.y
        },
        velocityVariance: {
          x: this.velocityVariance.x,
          y: this.velocityVariance.y
        },
        acceleration: {
          x: this.acceleration.x,
          y: this.acceleration.y
        },
        accelerationVariance: {
          x: this.accelerationVariance.x,
          y: this.accelerationVariance.y
        },
        sizeStart: {
          x: this.sizeStart.x,
          y: this.sizeStart.y
        },
        sizeEnd: {
          x: this.sizeEnd.x,
          y: this.sizeEnd.y
        },
        startVariance: this.startVariance,
        endVariance: this.endVariance,
        emitPerSecond: this.emitPerSecond,
        duration: this.duration,
        maxLifeTime: this.maxLifeTime,
        effect: this.effect,
        name: this.getName()
      };
    }
  }

  class CollisionBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = false;
      this.skipPositionBehaviourOnCollision = false;
      this.skipAngularVelocityBehaviourOnCollision = false;
      this.skipColorBehaviourOnCollision = false;
      this.skipAttractionRepulsionBehaviourOnCollision = false;
      this.skipEmitDirectionBehaviourOnCollision = false;
      this.skipRotationBehaviourOnCollision = false;
      this.skipSizeBehaviourOnCollision = false;
      this.priority = 1e4;
      this.distance = 10;
      this.lines = [
        { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }
      ];
      /**
       * Function that initializes a particle
       */
      this.init = () => {
      };
      /**
       * Applies the particle's velocity and acceleration to move it and calculate its size, rotation, and position.
       * @param {Particle} particle - The particle to be moved
       */
      this.apply = (particle) => {
        if (!this.enabled) return;
        this.checkCollisionAndReflect(particle);
      };
      this.reflectVelocity = (particle, normal) => {
        const dotProduct = particle.velocity.x * normal.x + particle.velocity.y * normal.y;
        particle.velocity.x = particle.velocity.x - 2 * dotProduct * normal.x;
        particle.velocity.y = particle.velocity.y - 2 * dotProduct * normal.y;
        if (this.skipPositionBehaviourOnCollision) {
          particle.skipPositionBehaviour = true;
        }
        if (this.skipAngularVelocityBehaviourOnCollision) {
          particle.skipAngularVelocityBehaviour = true;
        }
        if (this.skipColorBehaviourOnCollision) {
          particle.skipColorBehaviour = true;
        }
        if (this.skipAttractionRepulsionBehaviourOnCollision) {
          particle.skipAttractionRepulsionBehaviour = true;
        }
        if (this.skipEmitDirectionBehaviourOnCollision) {
          particle.skipEmitDirectionBehaviour = true;
        }
        if (this.skipRotationBehaviourOnCollision) {
          particle.skipRotationBehaviour = true;
        }
        if (this.skipSizeBehaviourOnCollision) {
          particle.skipSizeBehaviour = true;
        }
      };
      this.checkCollisionAndReflect = (particle) => {
        if (this.lines.length === 0) return false;
        for (const line of this.lines) {
          const { point1, point2 } = line;
          const dist = this.pointToLineDistance(particle.x, particle.y, point1.x, point1.y, point2.x, point2.y);
          if (dist <= this.distance) {
            const normal = this.calculateNormal(point1, point2);
            this.reflectVelocity(particle, normal);
            return true;
          }
        }
        return false;
      };
      this.calculateNormal = (point1, point2) => {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        return { x: -dy / length, y: dx / length };
      };
      this.pointToLineDistance = (x, y, x1, y1, x2, y2) => {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;
        let xx;
        let yy;
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
      };
    }
    /**
     * Gets the name of the behaviour
     * @return {BehaviourNames} The name of the behaviour
     */
    getName() {
      return behaviourNames.COLLISION_BEHAVIOUR;
    }
    /**
     * @description Retrieves the properties of the object.
     * @returns {Object} The properties of the object.
     */
    getProps() {
      return {
        enabled: this.enabled,
        skipPositionBehaviourOnCollision: this.skipPositionBehaviourOnCollision,
        skipAngularVelocityBehaviourOnCollision: this.skipAngularVelocityBehaviourOnCollision,
        skipColorBehaviourOnCollision: this.skipColorBehaviourOnCollision,
        skipAttractionRepulsionBehaviourOnCollision: this.skipAttractionRepulsionBehaviourOnCollision,
        skipEmitDirectionBehaviourOnCollision: this.skipEmitDirectionBehaviourOnCollision,
        skipRotationBehaviourOnCollision: this.skipRotationBehaviourOnCollision,
        skipSizeBehaviourOnCollision: this.skipSizeBehaviourOnCollision,
        priority: this.priority,
        lines: this.lines,
        distance: this.distance,
        name: this.getName()
      };
    }
  }

  /*
   * A fast javascript implementation of simplex noise by Jonas Wagner

  Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
  Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
  With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
  Better rank ordering method by Stefan Gustavson in 2012.

   Copyright (c) 2024 Jonas Wagner

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   */
  // these __PURE__ comments help uglifyjs with dead code removal
  //
  const SQRT3 = /*#__PURE__*/ Math.sqrt(3.0);
  const F2 = 0.5 * (SQRT3 - 1.0);
  const G2 = (3.0 - SQRT3) / 6.0;
  // I'm really not sure why this | 0 (basically a coercion to int)
  // is making this faster but I get ~5 million ops/sec more on the
  // benchmarks across the board or a ~10% speedup.
  const fastFloor = (x) => Math.floor(x) | 0;
  const grad2 = /*#__PURE__*/ new Float64Array([1, 1,
      -1, 1,
      1, -1,
      -1, -1,
      1, 0,
      -1, 0,
      1, 0,
      -1, 0,
      0, 1,
      0, -1,
      0, 1,
      0, -1]);
  /**
   * Creates a 2D noise function
   * @param random the random function that will be used to build the permutation table
   * @returns {NoiseFunction2D}
   */
  function createNoise2D(random = Math.random) {
      const perm = buildPermutationTable(random);
      // precalculating this yields a little ~3% performance improvement.
      const permGrad2x = new Float64Array(perm).map(v => grad2[(v % 12) * 2]);
      const permGrad2y = new Float64Array(perm).map(v => grad2[(v % 12) * 2 + 1]);
      return function noise2D(x, y) {
          // if(!isFinite(x) || !isFinite(y)) return 0;
          let n0 = 0; // Noise contributions from the three corners
          let n1 = 0;
          let n2 = 0;
          // Skew the input space to determine which simplex cell we're in
          const s = (x + y) * F2; // Hairy factor for 2D
          const i = fastFloor(x + s);
          const j = fastFloor(y + s);
          const t = (i + j) * G2;
          const X0 = i - t; // Unskew the cell origin back to (x,y) space
          const Y0 = j - t;
          const x0 = x - X0; // The x,y distances from the cell origin
          const y0 = y - Y0;
          // For the 2D case, the simplex shape is an equilateral triangle.
          // Determine which simplex we are in.
          let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
          if (x0 > y0) {
              i1 = 1;
              j1 = 0;
          } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
          else {
              i1 = 0;
              j1 = 1;
          } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
          // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
          // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
          // c = (3-sqrt(3))/6
          const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
          const y1 = y0 - j1 + G2;
          const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
          const y2 = y0 - 1.0 + 2.0 * G2;
          // Work out the hashed gradient indices of the three simplex corners
          const ii = i & 255;
          const jj = j & 255;
          // Calculate the contribution from the three corners
          let t0 = 0.5 - x0 * x0 - y0 * y0;
          if (t0 >= 0) {
              const gi0 = ii + perm[jj];
              const g0x = permGrad2x[gi0];
              const g0y = permGrad2y[gi0];
              t0 *= t0;
              // n0 = t0 * t0 * (grad2[gi0] * x0 + grad2[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
              n0 = t0 * t0 * (g0x * x0 + g0y * y0);
          }
          let t1 = 0.5 - x1 * x1 - y1 * y1;
          if (t1 >= 0) {
              const gi1 = ii + i1 + perm[jj + j1];
              const g1x = permGrad2x[gi1];
              const g1y = permGrad2y[gi1];
              t1 *= t1;
              // n1 = t1 * t1 * (grad2[gi1] * x1 + grad2[gi1 + 1] * y1);
              n1 = t1 * t1 * (g1x * x1 + g1y * y1);
          }
          let t2 = 0.5 - x2 * x2 - y2 * y2;
          if (t2 >= 0) {
              const gi2 = ii + 1 + perm[jj + 1];
              const g2x = permGrad2x[gi2];
              const g2y = permGrad2y[gi2];
              t2 *= t2;
              // n2 = t2 * t2 * (grad2[gi2] * x2 + grad2[gi2 + 1] * y2);
              n2 = t2 * t2 * (g2x * x2 + g2y * y2);
          }
          // Add contributions from each corner to get the final noise value.
          // The result is scaled to return values in the interval [-1,1].
          return 70.0 * (n0 + n1 + n2);
      };
  }
  /**
   * Builds a random permutation table.
   * This is exported only for (internal) testing purposes.
   * Do not rely on this export.
   * @private
   */
  function buildPermutationTable(random) {
      const tableSize = 512;
      const p = new Uint8Array(tableSize);
      for (let i = 0; i < tableSize / 2; i++) {
          p[i] = i;
      }
      for (let i = 0; i < tableSize / 2 - 1; i++) {
          const r = i + ~~(random() * (256 - i));
          const aux = p[i];
          p[i] = p[r];
          p[r] = aux;
      }
      for (let i = 256; i < tableSize; i++) {
          p[i] = p[i - 256];
      }
      return p;
  }

  class NoiseBasedMotionBehaviour extends Behaviour {
    constructor() {
      super();
      this.enabled = true;
      this.priority = 50;
      this.noiseScale = 0.01;
      this.noiseIntensity = 10;
      this.noiseSpeed = 0.1;
      this.noiseDirection = new Point(1, 1);
      this.init = (particle) => {
        if (!this.enabled) return;
        particle.noiseOffset = new Point(Math.random() * 1e3, Math.random() * 1e3);
      };
      this.apply = (particle, deltaTime) => {
        if (!this.enabled || particle.skipPositionBehaviour) return;
        const { noiseOffset } = particle;
        noiseOffset.x += this.noiseSpeed * deltaTime * this.noiseDirection.x;
        noiseOffset.y += this.noiseSpeed * deltaTime * this.noiseDirection.y;
        const noiseX = this.noise2D(noiseOffset.x * this.noiseScale, noiseOffset.y * this.noiseScale);
        const noiseY = this.noise2D(noiseOffset.y * this.noiseScale, noiseOffset.x * this.noiseScale);
        particle.movement.x += noiseX * this.noiseIntensity * deltaTime;
        particle.movement.y += noiseY * this.noiseIntensity * deltaTime;
      };
      this.noise2D = createNoise2D();
    }
    getName() {
      return behaviourNames.NOISE_BASED_MOTION_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        noiseScale: this.noiseScale,
        noiseIntensity: this.noiseIntensity,
        noiseSpeed: this.noiseSpeed,
        noiseDirection: {
          x: this.noiseDirection.x,
          y: this.noiseDirection.y
        },
        name: this.getName()
      };
    }
  }

  class ForceFieldsBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 300;
      // Executes after initial movement behaviors
      /**
       * List of force fields
       */
      this.fields = [];
      /**
       * Initializes the particle, but does not modify position directly.
       * @param {Particle} particle - The particle to initialize.
       */
      this.init = (particle) => {
      };
      /**
       * Applies the force field behavior to particles.
       * @param {Particle} particle - The particle to apply the behavior to.
       * @param {number} deltaTime - Time elapsed since the last frame.
       */
      this.apply = (particle, deltaTime) => {
        if (!this.enabled || particle.skipPositionBehaviour) return;
        this.fields.forEach((field) => {
          const distance = Math.sqrt((particle.x - field.position.x) ** 2 + (particle.y - field.position.y) ** 2);
          if (distance <= field.radius) {
            const influence = (field.radius - distance) / field.radius;
            switch (field.type) {
              case "wind":
                if (field.direction) {
                  particle.movement.x += field.direction.x * field.strength * influence * deltaTime;
                  particle.movement.y += field.direction.y * field.strength * influence * deltaTime;
                }
                break;
              case "gravity":
                const dx = field.position.x - particle.x;
                const dy = field.position.y - particle.y;
                const angle = Math.atan2(dy, dx);
                particle.movement.x += Math.cos(angle) * field.strength * influence * deltaTime;
                particle.movement.y += Math.sin(angle) * field.strength * influence * deltaTime;
                break;
              case "turbulence":
                const randomForceX = (Math.random() - 0.5) * 2 * field.strength * influence;
                const randomForceY = (Math.random() - 0.5) * 2 * field.strength * influence;
                particle.movement.x += randomForceX * deltaTime;
                particle.movement.y += randomForceY * deltaTime;
                break;
            }
          }
        });
      };
    }
    /**
     * Gets the name of the behaviour.
     * @returns {string} - The name of the behaviour.
     */
    getName() {
      return behaviourNames.FORCE_FIELDS_BEHAVIOUR;
    }
    /**
     * Gets the properties of the behaviour.
     * @returns {object} - The properties of the behaviour.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        fields: this.fields,
        name: this.getName()
      };
    }
  }

  let canvas = null;
  let imageData = null;
  let particleCount = 0;
  let pixelPositions = [];
  class SpawnBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.overOne = false;
      this.trailProgress = 0;
      // Progress along the trail (0-1)
      this.trailingEnabled = false;
      // Enable trailing
      this.spawnAlongTrail = false;
      // Spawn particles along the entire trail
      this.trailSpeed = 1;
      // Speed of the trail
      this.trailRepeat = true;
      // Loop the trail
      this.trailStart = 0;
      // Start the trail at 20% of its path
      this.currentProgress = 0;
      this.customPoints = [
        {
          spawnType: "Rectangle",
          word: "Hello",
          fontSize: 50,
          fontSpacing: 5,
          particleDensity: 1,
          fontMaxWidth: 1334,
          fontMaxHeight: 750,
          textAlign: "center",
          textBaseline: "middle",
          radius: 100,
          radiusX: 100,
          radiusY: 100,
          starPoints: 5,
          rows: 10,
          columns: 10,
          cellSize: 20,
          center: { x: 0, y: 0, z: 0 },
          apex: { x: 0, y: 0, z: 0 },
          spread: 360,
          baseRadius: 100,
          coneDirection: 1,
          height: 100,
          coneAngle: 45,
          position: { x: 0, y: 0 },
          positionVariance: { x: 0, y: 0 },
          perspective: 0,
          // Distance for perspective
          maxZ: 0,
          // Maximum z distance for effects
          frequency: { x: 3, y: 2 },
          start: { x: 10, y: 10 },
          end: { x: 20, y: 20 },
          control1: { x: 0, y: 0 },
          control2: { x: 0, y: 0 },
          delta: 1,
          pitch: 50,
          // Vertical distance between consecutive loops
          turns: 5,
          // Number of turns in the helix
          pathPoints: []
        }
      ];
      this.lastWordSettings = {};
      /**
       * Initialize particles for each custom point.
       * @param {Particle} particle - The particle to initialize.
       */
      this.init = (particle) => {
        if (this.customPoints.length === 0) return;
        const point = this.customPoints[Math.floor(Math.random() * this.customPoints.length)];
        if (this.trailingEnabled) {
          const { positions, probabilities } = this.spawnAlongTrail ? this.calculateTrailRangePositions(point) : { positions: [this.calculateTrailPosition(point)], probabilities: [1] };
          const positionIndex = this.weightedRandomIndex(probabilities);
          const position = positions[positionIndex];
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + position.x;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + position.y;
          particle.z = Math.random() * point.maxZ;
        } else {
          this.spawnParticleAtPoint(particle, point);
        }
        if (point.perspective && point.maxZ) {
          const scale = point.perspective / (point.perspective + particle.z);
          particle.movement.x *= scale;
          particle.movement.y *= scale;
          particle.superColorAlphaEnd = 1 - particle.z / point.maxZ;
          particle.size.x = 1 - particle.z / point.maxZ;
          particle.size.y = 1 - particle.z / point.maxZ;
        }
      };
      this.apply = () => {
      };
      /**
       * Calculate trail positions along the range from trailStart to currentProgress.
       * @param {Object} point - The custom point configuration.
       * @returns {Point[]} List of positions along the trail.
       */
      this.calculateTrailRangePositions = (point) => {
        const positions = [];
        const segments = 20;
        const trailStart = this.trailStart || 0;
        const weights = [];
        const startProgress = Math.max(trailStart, 0);
        const endProgress = Math.min(this.currentProgress, 1);
        for (let i = startProgress; i <= endProgress; i += (endProgress - startProgress) / segments) {
          const position = this.calculateTrailPosition(point, i);
          positions.push(position);
          const weightFactor = 4;
          const distanceToTrail = Math.abs(i - this.currentProgress);
          weights.push(Math.exp(-distanceToTrail * weightFactor));
        }
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const probabilities = weights.map((w) => w / totalWeight);
        return { positions, probabilities };
      };
      /**
       * Spawn particle at the specified point configuration.
       * @param {Particle} particle - The particle to be initialized.
       * @param {Object} point - The custom point configuration.
       */
      this.spawnParticleAtPoint = (particle, point) => {
        if (point.spawnType === "Word" && (this.lastWordSettings.word !== point.word || point.fontSize !== this.lastWordSettings.fontSize || point.fontSpacing !== this.lastWordSettings.fontSpacing || point.particleDensity !== this.lastWordSettings.particleDensity || point.textAlign !== this.lastWordSettings.textAlign || point.textBaseline !== this.lastWordSettings.textBaseline || point.fontMaxWidth !== this.lastWordSettings.fontMaxWidth || point.fontMaxHeight !== this.lastWordSettings.fontMaxHeight)) {
          this.lastWordSettings = {
            word: point.word,
            fontSize: point.fontSize,
            fontSpacing: point.fontSpacing,
            particleDensity: point.particleDensity,
            textAlign: point.textAlign,
            textBaseline: point.textBaseline,
            fontMaxWidth: point.fontMaxWidth,
            fontMaxHeight: point.fontMaxHeight
          };
          this.calculateCtx(point);
          particle.reset();
        }
        particle.z = Math.random() * point.maxZ;
        if (point.spawnType === "Rectangle") {
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x);
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y);
        } else if (point.spawnType === "Ring") {
          const angle = Math.random() * Math.PI * 2;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + Math.cos(angle) * point.radius;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + Math.sin(angle) * point.radius;
        } else if (point.spawnType === "Star") {
          const points = point.starPoints;
          const angle = Math.PI * 2 * particle.uid / points;
          const radius = particle.uid % 2 === 0 ? point.radius : point.radius / 2;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + Math.cos(angle) * radius;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + Math.sin(angle) * radius;
        } else if (point.spawnType === "FrameRectangle") {
          const w = point.radiusX;
          const h = point.radiusY;
          if (Math.random() < w / (w + h)) {
            particle.movement.x = Math.random() * w + particle.movement.x;
            particle.movement.y = Math.random() < 0.5 ? particle.movement.y : particle.movement.y + h - 1;
          } else {
            particle.movement.y = Math.random() * h + particle.movement.y;
            particle.movement.x = Math.random() < 0.5 ? particle.movement.x : particle.movement.x + w - 1;
          }
          particle.movement.x += this.calculate(point.position.x, point.positionVariance.x);
          particle.movement.y += this.calculate(point.position.y, point.positionVariance.y);
        } else if (point.spawnType === "Frame") {
          const w = point.radius;
          const h = point.radius;
          if (Math.random() < w / (w + h)) {
            particle.movement.x = Math.random() * w + particle.movement.x;
            particle.movement.y = Math.random() < 0.5 ? particle.movement.y : particle.movement.y + h - 1;
          } else {
            particle.movement.y = Math.random() * h + particle.movement.y;
            particle.movement.x = Math.random() < 0.5 ? particle.movement.x : particle.movement.x + w - 1;
          }
          particle.movement.x += this.calculate(point.position.x, point.positionVariance.x);
          particle.movement.y += this.calculate(point.position.y, point.positionVariance.y);
        } else if (point.spawnType === "Sphere") {
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * (point.spread / 180) * Math.PI;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + point.center.x + point.radius * Math.sin(theta) * Math.cos(phi);
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + point.center.y + point.radius * Math.sin(theta) * Math.sin(phi);
          particle.z = point.center.z + point.radius * Math.cos(theta);
        } else if (point.spawnType === "Cone") {
          const angle = (Math.random() * point.coneAngle - point.coneAngle / 2) * (Math.PI / 180);
          const distance = Math.random() * point.baseRadius;
          const localX = Math.cos(angle) * distance;
          const localY = Math.sin(angle) * distance;
          const coneDirectionRad = (point.coneDirection || 0) * (Math.PI / 180);
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + point.apex.x + Math.cos(coneDirectionRad) * localX - Math.sin(coneDirectionRad) * localY;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + point.apex.y + Math.sin(coneDirectionRad) * localX + Math.cos(coneDirectionRad) * localY;
          particle.z = point.apex.z + Math.random() * point.height;
        } else if (point.spawnType === "Grid") {
          const row = Math.floor(Math.random() * point.rows);
          const column = Math.floor(Math.random() * point.columns);
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + column * point.cellSize;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + row * point.cellSize;
        } else if (point.spawnType === "Word") {
          if (particleCount > 0 && pixelPositions.length > 0) {
            const selectedPixel = pixelPositions[Math.floor(Math.random() * particleCount)];
            particle.movement.x = point.position.x + selectedPixel.x - canvas.width / 2;
            particle.movement.y = point.position.y + selectedPixel.y - canvas.height / 2;
            particle.movement.x += Math.random() * point.positionVariance.x - point.positionVariance.x / 2;
            particle.movement.y += Math.random() * point.positionVariance.y - point.positionVariance.y / 2;
          }
        } else if (point.spawnType === "Lissajous") {
          const a = point.frequency.x;
          const b = point.frequency.y;
          const delta = point.delta || Math.PI / 2;
          const t = particle.uid * 0.1;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + Math.sin(a * t + delta) * point.radius;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + Math.sin(b * t) * point.radius;
        } else if (point.spawnType === "Bezier") {
          const t = Math.random();
          const cx1 = point.control1.x;
          const cy1 = point.control1.y;
          const cx2 = point.control2.x;
          const cy2 = point.control2.y;
          const x = this.calculate(point.position.x, point.positionVariance.x) + (1 - t) ** 3 * point.start.x + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * point.end.x;
          const y = this.calculate(point.position.x, point.positionVariance.x) + (1 - t) ** 3 * point.start.y + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * point.end.y;
          particle.movement.x = x;
          particle.movement.y = y;
        } else if (point.spawnType === "Heart") {
          const t = Math.random() * 2 * Math.PI;
          const scale = point.radius || 100;
          const x = scale * 16 * Math.sin(t) ** 3;
          const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + x;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + y;
        } else if (point.spawnType === "Helix") {
          const turns = point.turns || 5;
          const pitch = point.pitch || 50;
          const radius = point.radius || 100;
          const height = point.height || turns * pitch;
          const t = Math.random() * turns * Math.PI * 2;
          const z = Math.random() * height;
          const x = radius * Math.cos(t);
          const y = radius * Math.sin(t);
          const adjustedZ = z % pitch;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + x;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + y;
          particle.z = point.position.z + adjustedZ;
        } else if (point.spawnType === "Spring") {
          const turns = point.turns || 5;
          const pitch = point.pitch || 50;
          const radius = point.radius || 100;
          const t = Math.random() * turns * Math.PI * 2;
          const z = t / (Math.PI * 2) * pitch;
          const x = Math.cos(t) * radius;
          const y = Math.sin(t) * radius;
          if (point.perspective > 0 && point.maxZ > 0) {
            const scale = point.perspective / (point.perspective + z);
            particle.movement.x = (this.calculate(point.position.x, point.positionVariance.x) + x) * scale;
            particle.movement.y = (this.calculate(point.position.y, point.positionVariance.y) + y) * scale;
            particle.size.x = scale;
            particle.size.y = scale;
            particle.superColorAlphaEnd = 1 - z / point.maxZ;
          } else {
            particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + x;
            particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + y;
          }
          particle.z = z;
        } else if (point.spawnType === "Path") {
          const pathPoints = point.pathPoints || [];
          if (pathPoints.length < 2) return;
          const segmentIndex = Math.floor(Math.random() * (pathPoints.length - 1));
          const start = pathPoints[segmentIndex];
          const end = pathPoints[segmentIndex + 1];
          const t = Math.random();
          const x = start.x + t * (end.x - start.x);
          const y = start.y + t * (end.y - start.y);
          const z = start.z + t * (end.z - start.z || 0);
          if (point.perspective > 0 && point.maxZ > 0) {
            const scale = point.perspective / (point.perspective + z);
            particle.movement.x = (this.calculate(point.position.x, point.positionVariance.x) + x) * scale;
            particle.movement.y = (this.calculate(point.position.y, point.positionVariance.y) + y) * scale;
            particle.size.x = scale;
            particle.size.y = scale;
            particle.superColorAlphaEnd = 1 - z / point.maxZ;
          } else {
            particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + x;
            particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + y;
          }
          particle.z = z;
        } else if (point.spawnType === "Oval") {
          const angle = Math.random() * Math.PI * 2;
          const radiusX = point.radiusX || 100;
          const radiusY = point.radiusY || 50;
          particle.movement.x = this.calculate(point.position.x, point.positionVariance.x) + Math.cos(angle) * radiusX;
          particle.movement.y = this.calculate(point.position.y, point.positionVariance.y) + Math.sin(angle) * radiusY;
        }
      };
      /**
       * Calculate canvas context for rendering text-based particles.
       * @param {Object} point - The custom point configuration.
       */
      this.calculateCtx = (point) => {
        const text = point.word;
        const fontSize = point.fontSize;
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = point.fontMaxWidth;
          canvas.height = point.fontMaxHeight;
        }
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = point.textAlign;
        ctx.textBaseline = point.textBaseline;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        const spacing = point.fontSpacing;
        pixelPositions = [];
        for (let y = 0; y < height; y += spacing) {
          for (let x = 0; x < width; x += spacing) {
            const index = (y * width + x) * 4;
            if (data[index + 3] > 128) {
              pixelPositions.push(new Point(x, y));
            }
          }
        }
        pixelPositions = pixelPositions.sort(() => Math.random() - 0.5);
        particleCount = Math.floor(pixelPositions.length * point.particleDensity);
      };
      this.calculateTrailPosition = (point, overrideProgress) => {
        const progress = overrideProgress !== void 0 ? overrideProgress : this.currentProgress;
        switch (point.spawnType) {
          case "Rectangle": {
            const segmentLength = (2 * point.radiusX + 2 * point.radiusY) * progress;
            const perimeter = 2 * point.radiusX + 2 * point.radiusY;
            const localPosition = segmentLength % perimeter;
            let x = point.position.x;
            let y = point.position.y;
            if (localPosition <= point.radiusX) {
              x += localPosition - point.radiusX;
              y -= point.radiusY;
            } else if (localPosition <= point.radiusX + point.radiusY) {
              x += point.radiusX;
              y += localPosition - point.radiusX - point.radiusY;
            } else if (localPosition <= 2 * point.radiusX + point.radiusY) {
              x += point.radiusX - (localPosition - point.radiusX - point.radiusY);
              y += point.radiusY;
            } else {
              x -= point.radiusX;
              y += point.radiusY - (localPosition - 2 * point.radiusX - point.radiusY);
            }
            return { x, y, z: 0 };
          }
          case "Ring": {
            const angle = progress * Math.PI * 2;
            const x = point.position.x + Math.cos(angle) * point.radius;
            const y = point.position.y + Math.sin(angle) * point.radius;
            return { x, y, z: 0 };
          }
          case "Star": {
            const totalPoints = point.starPoints * 2;
            const pointIndex = Math.floor(progress * totalPoints);
            const localProgress = progress * totalPoints % 1;
            const angle = Math.PI * 2 * pointIndex / totalPoints;
            const nextAngle = Math.PI * 2 * (pointIndex + 1) / totalPoints;
            const radius = pointIndex % 2 === 0 ? point.radius : point.radius / 2;
            const nextRadius = (pointIndex + 1) % 2 === 0 ? point.radius : point.radius / 2;
            const x = point.position.x + Math.cos(angle) * radius * (1 - localProgress) + Math.cos(nextAngle) * nextRadius * localProgress;
            const y = point.position.y + Math.sin(angle) * radius * (1 - localProgress) + Math.sin(nextAngle) * nextRadius * localProgress;
            return { x, y, z: 0 };
          }
          case "Path": {
            const pathPoints = point.pathPoints || [];
            if (pathPoints.length < 2) return { x: 0, y: 0, z: 0 };
            const totalSegments = pathPoints.length - 1;
            const segmentIndex = Math.floor(progress * totalSegments);
            const localProgress = progress * totalSegments % 1;
            const start = pathPoints[segmentIndex];
            const end = pathPoints[segmentIndex + 1];
            const x = start.x + localProgress * (end.x - start.x);
            const y = start.y + localProgress * (end.y - start.y);
            const z = start.z + localProgress * (end.z - start.z || 0);
            return { x, y, z };
          }
          case "Lissajous": {
            const a = point.frequency.x;
            const b = point.frequency.y;
            const delta = point.delta || Math.PI / 2;
            const t = progress * Math.PI * 2;
            const x = point.position.x + Math.sin(a * t + delta) * point.radius;
            const y = point.position.y + Math.sin(b * t) * point.radius;
            return { x, y, z: 0 };
          }
          case "Helix": {
            const turns = point.turns || 5;
            const pitch = point.pitch || 50;
            const angle = progress * turns * Math.PI * 2;
            const x = point.position.x + Math.cos(angle) * point.radius;
            const y = point.position.y + Math.sin(angle) * point.radius;
            const z = point.position.z + progress * turns * pitch;
            return { x, y, z };
          }
          case "Heart": {
            const t = progress * Math.PI * 2;
            const scale = point.radius || 100;
            const x = scale * 16 * Math.sin(t) ** 3;
            const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            return {
              x: point.position.x + x,
              y: point.position.y + y,
              z: 0
            };
          }
          case "Bezier": {
            const t = progress;
            const { start, end, control1, control2 } = point;
            const x = (1 - t) ** 3 * start.x + 3 * (1 - t) ** 2 * t * control1.x + 3 * (1 - t) * t ** 2 * control2.x + t ** 3 * end.x;
            const y = (1 - t) ** 3 * start.y + 3 * (1 - t) ** 2 * t * control1.y + 3 * (1 - t) * t ** 2 * control2.y + t ** 3 * end.y;
            return { x, y, z: 0 };
          }
          case "Frame": {
            const perimeter = 2 * (point.radiusX + point.radiusY);
            const segmentLength = perimeter * progress;
            const localPosition = segmentLength % perimeter;
            let x = point.position.x;
            let y = point.position.y;
            if (localPosition <= point.radiusX) {
              x += localPosition;
              y -= point.radiusY;
            } else if (localPosition <= point.radiusX + point.radiusY) {
              x += point.radiusX;
              y += localPosition - point.radiusX;
            } else if (localPosition <= 2 * point.radiusX + point.radiusY) {
              x += point.radiusX - (localPosition - point.radiusX - point.radiusY);
              y += point.radiusY;
            } else {
              x -= localPosition - 2 * point.radiusX - point.radiusY;
              y -= point.radiusY;
            }
            return { x, y, z: 0 };
          }
          case "FrameRectangle": {
            const perimeter = 2 * (point.radiusX + point.radiusY);
            const segmentLength = perimeter * progress;
            const localPosition = segmentLength % perimeter;
            let x = point.position.x;
            let y = point.position.y;
            if (localPosition <= point.radiusX) {
              x += localPosition;
              y -= point.radiusY / 2;
            } else if (localPosition <= point.radiusX + point.radiusY) {
              x += point.radiusX / 2;
              y += localPosition - point.radiusX - point.radiusY / 2;
            } else if (localPosition <= 2 * point.radiusX + point.radiusY) {
              x += point.radiusX / 2 - (localPosition - point.radiusX - point.radiusY);
              y += point.radiusY / 2;
            } else {
              x -= localPosition - 2 * point.radiusX - point.radiusY;
              y -= point.radiusY / 2;
            }
            return { x, y, z: 0 };
          }
          case "Oval": {
            const angle = progress * Math.PI * 2;
            const radiusX = point.radiusX || 100;
            const radiusY = point.radiusY || 50;
            const x = point.position.x + Math.cos(angle) * radiusX;
            const y = point.position.y + Math.sin(angle) * radiusY;
            return { x, y, z: 0 };
          }
          case "Word": {
            if (!pixelPositions || pixelPositions.length === 0) {
              return { x: point.position.x, y: point.position.y, z: 0 };
            }
            const maxPixelIndex = Math.floor(progress * pixelPositions.length);
            const revealedPixels = pixelPositions.slice(0, maxPixelIndex);
            if (revealedPixels.length === 0) {
              return { x: point.position.x - canvas.width / 2, y: point.position.y - canvas.height / 2, z: 0 };
            }
            const selectedPixel = revealedPixels[revealedPixels.length - 1] || { x: 0, y: 0 };
            const x = point.position.x + selectedPixel.x - canvas.width / 2;
            const y = point.position.y + selectedPixel.y - canvas.height / 2;
            return { x, y, z: 0 };
          }
          default:
            return { x: 0, y: 0, z: 0 };
        }
      };
      /**
       * Update trail progress once per frame.
       * @param {number} deltaTime - Time since the last update
       */
      this.updateTrailProgress = (deltaTime) => {
        if (!this.trailingEnabled) return;
        const trailStart = this.trailStart || 0;
        this.trailProgress += this.trailSpeed * deltaTime;
        if (trailStart > 0) {
          const remainingDistance = 1 - trailStart;
          if (!this.overOne) {
            if (this.trailProgress > remainingDistance) {
              if (this.trailRepeat) {
                this.overOne = true;
                this.trailProgress = 0;
              } else {
                this.trailProgress = remainingDistance;
              }
            }
            this.currentProgress = trailStart + this.trailProgress / remainingDistance * remainingDistance;
          } else {
            if (this.trailProgress > 1) {
              if (this.trailRepeat) {
                this.trailProgress %= 1;
              } else {
                this.trailingEnabled = false;
                this.trailProgress = 1;
              }
            }
            this.currentProgress = this.trailProgress;
          }
        } else {
          if (this.trailProgress > 1) {
            if (this.trailRepeat) {
              this.trailProgress %= 1;
            } else {
              this.trailingEnabled = false;
              this.trailProgress = 1;
            }
          }
          this.currentProgress = this.trailProgress;
        }
      };
      // Utility function for weighted random selection
      this.weightedRandomIndex = (probabilities) => {
        const cumulative = probabilities.reduce((acc, prob, i) => {
          acc.push(prob + (acc[i - 1] || 0));
          return acc;
        }, []);
        const randomValue = Math.random();
        return cumulative.findIndex((c) => randomValue <= c);
      };
      /**
       * Update method to be called once per frame.
       * @param {number} deltaTime - Time since the last frame
       */
      this.update = (deltaTime) => {
        this.updateTrailProgress(deltaTime);
      };
      /**
       * Adds a random variance to the given value
       * @param {number} value - The value to calculate
       * @param {number} variance - The random variance to add
       * @returns {number} The calculated value
       */
      this.calculate = (value, variance) => {
        return value + this.varianceFrom(variance);
      };
    }
    /**
     * Gets the name of the behaviour
     * @return {string} The name of the behaviour
     */
    getName() {
      return behaviourNames.SPAWN_BEHAVIOUR;
    }
    /**
     * Retrieves the properties of the custom points.
     * @returns {Object[]} The array of custom points and their properties.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        trailingEnabled: this.trailingEnabled,
        spawnAlongTrail: this.spawnAlongTrail,
        trailSpeed: this.trailSpeed,
        trailRepeat: this.trailRepeat,
        trailStart: this.trailStart,
        customPoints: this.customPoints,
        name: this.getName()
      };
    }
  }

  class TimelineBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.timeline = [];
    }
    init(particle) {
      if (!this.enabled) return;
      if (this.timeline.length > 0) {
        const initialProperties = this.timeline[0].properties;
        if (initialProperties.size !== void 0) {
          particle.size.x = particle.size.y = initialProperties.size;
        }
        if (initialProperties.color) {
          particle.color.r = initialProperties.color.r;
          particle.color.g = initialProperties.color.g;
          particle.color.b = initialProperties.color.b;
          particle.color.alpha = initialProperties.color.alpha;
        }
        if (initialProperties.rotation !== void 0) {
          particle.rotation = initialProperties.rotation;
        }
      }
    }
    apply(particle, deltaTime) {
      if (!this.enabled) return;
      const { lifeTime, maxLifeTime } = particle;
      if (maxLifeTime <= 0) return;
      const normalizedTime = lifeTime / maxLifeTime;
      const before = this.timeline.slice().reverse().find((entry) => entry.time <= normalizedTime);
      const after = this.timeline.find((entry) => entry.time > normalizedTime);
      if (before && after) {
        const progress = (normalizedTime - before.time) / (after.time - before.time);
        this.interpolateProperties(particle, before.properties, after.properties, progress);
      } else if (before) {
        this.setProperties(particle, before.properties);
      }
    }
    interpolateProperties(particle, before, after, progress) {
      if (before.size !== void 0 && after.size !== void 0) {
        particle.size.x = particle.size.y = this.lerp(before.size, after.size, progress);
      }
      if (before.color && after.color) {
        particle.color.r = this.lerp(before.color.r, after.color.r, progress);
        particle.color.g = this.lerp(before.color.g, after.color.g, progress);
        particle.color.b = this.lerp(before.color.b, after.color.b, progress);
        particle.color.alpha = this.lerp(before.color.alpha, after.color.alpha, progress);
      }
      if (before.rotation !== void 0 && after.rotation !== void 0) {
        particle.rotation = this.lerp(before.rotation, after.rotation, progress);
      }
    }
    setProperties(particle, properties) {
      if (properties.size !== void 0) {
        particle.size.x = particle.size.y = properties.size;
      }
      if (properties.color) {
        particle.color.r = properties.color.r;
        particle.color.g = properties.color.g;
        particle.color.b = properties.color.b;
        particle.color.alpha = properties.color.alpha;
      }
      if (properties.rotation !== void 0) {
        particle.rotation = properties.rotation;
      }
    }
    /**
     * Linear interpolation (lerp) function
     */
    lerp(start, end, t) {
      return start + (end - start) * t;
    }
    getName() {
      return behaviourNames.TIMELINE_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        timeline: this.timeline,
        name: this.getName()
      };
    }
  }

  class GroupingBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.groupCenter = new Point(0, 0);
      // Shared center for the group
      this.groupRadius = 100;
      // Radius of the group
      this.attractionStrength = 0.1;
      // Strength of attraction toward the group center
      this.repulsionStrength = 0;
      // Strength of repulsion between particles
      this.orbitSpeed = 0;
      // Speed of orbiting (0 for no orbit)
      this.randomness = 0.2;
      // Adds randomness to particle movement
      this.boundaryEnforcement = false;
      // Enforce group boundary limits
      this.dynamicRadiusSpeed = 0;
      // Speed for dynamic radius scaling
      this.maxRadius = 150;
      // Maximum radius for dynamic scaling
      this.minRadius = 50;
      // Minimum radius for dynamic scaling
      this.clusterPoints = [];
      // Additional cluster points
      this.particleAngles = /* @__PURE__ */ new Map();
    }
    // Store unique angles for each particle
    init(particle) {
      if (!this.enabled) return;
      const initialAngle = Math.random() * Math.PI * 2;
      this.particleAngles.set(particle.uid, initialAngle);
    }
    apply(particle, deltaTime) {
      if (!this.enabled) return;
      const angle = this.particleAngles.get(particle.uid) || 0;
      const targetPoint = this.getNearestClusterPoint(particle.movement);
      const dx = targetPoint.x - particle.movement.x;
      const dy = targetPoint.y - particle.movement.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      particle.movement.x += dx * this.attractionStrength * deltaTime;
      particle.movement.y += dy * this.attractionStrength * deltaTime;
      if (this.orbitSpeed !== 0) {
        const currentAngle = angle + this.orbitSpeed * deltaTime;
        this.particleAngles.set(particle.uid, currentAngle);
        particle.movement.x = targetPoint.x + Math.cos(currentAngle) * Math.min(distance, this.groupRadius);
        particle.movement.y = targetPoint.y + Math.sin(currentAngle) * Math.min(distance, this.groupRadius);
      }
      this.applyRepulsion(particle);
      particle.movement.x += (Math.random() - 0.5) * this.randomness;
      particle.movement.y += (Math.random() - 0.5) * this.randomness;
      if (this.boundaryEnforcement) {
        this.enforceBoundary(particle);
      }
      this.adjustDynamicRadius(deltaTime);
    }
    /**
     * Adjusts the group radius dynamically over time
     */
    adjustDynamicRadius(deltaTime) {
      if (this.dynamicRadiusSpeed !== 0) {
        this.groupRadius += this.dynamicRadiusSpeed * deltaTime;
        if (this.groupRadius > this.maxRadius || this.groupRadius < this.minRadius) {
          this.dynamicRadiusSpeed *= -1;
        }
        this.groupRadius = Math.max(this.minRadius, Math.min(this.groupRadius, this.maxRadius));
      }
    }
    /**
     * Applies repulsion forces to keep particles apart
     */
    applyRepulsion(particle) {
      if (this.repulsionStrength === 0) return;
      this.clusterPoints.forEach((point) => {
        const dx = point.x - particle.movement.x;
        const dy = point.y - particle.movement.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0 && distance < this.groupRadius) {
          const force = (this.repulsionStrength / distance) ** 2;
          particle.movement.x -= dx * force;
          particle.movement.y -= dy * force;
        }
      });
    }
    /**
     * Enforces boundary limits to keep particles within the group radius
     */
    enforceBoundary(particle) {
      const dx = particle.movement.x - this.groupCenter.x;
      const dy = particle.movement.y - this.groupCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.groupRadius) {
        const angle = Math.atan2(dy, dx);
        particle.movement.x = this.groupCenter.x + Math.cos(angle) * this.groupRadius;
        particle.movement.y = this.groupCenter.y + Math.sin(angle) * this.groupRadius;
      }
    }
    /**
     * Finds the nearest cluster point to a given position
     */
    getNearestClusterPoint(position) {
      if (this.clusterPoints.length === 0) {
        return this.groupCenter;
      }
      let nearest = this.groupCenter;
      let minDistance = Infinity;
      for (const point of this.clusterPoints) {
        const dx = point.x - position.x;
        const dy = point.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = point;
        }
      }
      return nearest;
    }
    getName() {
      return behaviourNames.GROUPING_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        groupCenter: { x: this.groupCenter.x, y: this.groupCenter.y },
        groupRadius: this.groupRadius,
        attractionStrength: this.attractionStrength,
        repulsionStrength: this.repulsionStrength,
        orbitSpeed: this.orbitSpeed,
        randomness: this.randomness,
        boundaryEnforcement: this.boundaryEnforcement,
        dynamicRadiusSpeed: this.dynamicRadiusSpeed,
        maxRadius: this.maxRadius,
        minRadius: this.minRadius,
        clusterPoints: this.clusterPoints,
        name: this.getName()
      };
    }
  }

  class SoundReactiveBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 0;
      this.isPlaying = false;
      this.useColor = true;
      this.useSize = true;
      this.useVelocity = true;
      this.useRotation = true;
      // New property for rotation
      this.useRandomColor = true;
      // New property for random colors
      this.beatColor = new Color(255, 0, 0, 1);
      // Default beat color (red with full alpha)
      this.audioContext = null;
      // Audio context for analysis
      this.analyser = null;
      // Audio analyser node
      this.frequencyData = null;
      // Frequency data array
      this.amplitudeFactor = 0.1;
      // Scale factor for amplitude effects
      this.frequencyFactor = 1;
      // Scale factor for frequency effects
      this.rotationFactor = 0.05;
      // Scale factor for rotation effects
      this.beatSensitivity = 1;
      // Sensitivity to detect beats
      this.velocityFactor = new Point(1, 1);
    }
    // Sensitivity to detect beats
    init() {
    }
    apply(particle, deltaTime) {
      if (!this.enabled || !this.analyser || !this.frequencyData || !this.isPlaying) return;
      this.analyser.getByteFrequencyData(this.frequencyData);
      const amplitude = this.getAmplitude();
      const dominantFrequency = this.getDominantFrequency();
      if (this.useSize) {
        particle.size.x += amplitude * this.amplitudeFactor * deltaTime;
        particle.size.y += amplitude * this.amplitudeFactor * deltaTime;
      }
      if (this.useVelocity) {
        particle.velocity.x += dominantFrequency * this.frequencyFactor * deltaTime * this.velocityFactor.x;
        particle.velocity.y += dominantFrequency * this.frequencyFactor * deltaTime * this.velocityFactor.y;
      }
      if (this.useRotation) {
        particle.rotation += dominantFrequency * this.rotationFactor * deltaTime;
      }
      if (this.useColor) {
        if (this.isBeatDetected(amplitude)) {
          const color = this.useRandomColor ? this.getRandomColor() : this.beatColor;
          particle.color.r = color.r;
          particle.color.g = color.g;
          particle.color.b = color.b;
          particle.color.alpha = color.alpha;
        } else {
          particle.color.r = Math.max(0, particle.color.r - 5);
          particle.color.g = Math.max(0, particle.color.g - 5);
          particle.color.b = Math.max(0, particle.color.b - 5);
          particle.color.alpha = Math.max(0, particle.color.alpha - 0.05);
        }
      }
    }
    /**
     * Computes the amplitude (average volume level) from the frequency data.
     */
    getAmplitude() {
      if (!this.frequencyData) return 0;
      const sum = this.frequencyData.reduce((a, b) => a + b, 0);
      return sum / this.frequencyData.length;
    }
    /**
     * Finds the dominant frequency (frequency with the highest amplitude).
     */
    getDominantFrequency() {
      var _a, _b, _c, _d;
      if (!this.frequencyData) return 0;
      let maxAmplitude = 0;
      let dominantIndex = 0;
      for (let i = 0; i < this.frequencyData.length; i++) {
        if (this.frequencyData[i] > maxAmplitude) {
          maxAmplitude = this.frequencyData[i];
          dominantIndex = i;
        }
      }
      return dominantIndex * ((_b = (_a = this.analyser) == null ? void 0 : _a.context.sampleRate) != null ? _b : 0) / ((_d = (_c = this.analyser) == null ? void 0 : _c.fftSize) != null ? _d : 1);
    }
    /**
     * Detects a beat based on amplitude and sensitivity.
     */
    isBeatDetected(amplitude) {
      return amplitude > this.beatSensitivity * 128;
    }
    /**
     * Generates a random RGBA color.
     */
    getRandomColor() {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const a = 1;
      return new Color(r, g, b, a);
    }
    getName() {
      return behaviourNames.SOUND_REACTIVE_BEHAVIOUR;
    }
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        isPlaying: this.isPlaying,
        useColor: this.useColor,
        useVelocity: this.useVelocity,
        useSize: this.useSize,
        useRotation: this.useRotation,
        useRandomColor: this.useRandomColor,
        // Include random color toggle in props
        beatColor: this.beatColor,
        // Include beat color with alpha in props
        amplitudeFactor: this.amplitudeFactor,
        frequencyFactor: this.frequencyFactor,
        rotationFactor: this.rotationFactor,
        beatSensitivity: this.beatSensitivity,
        velocityFactor: this.velocityFactor,
        name: this.getName()
      };
    }
  }

  class LightEffectBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 100;
      this.lightSource = new Point(0, 0);
      // Position of the light source
      this.lightIntensity = 1;
      // Maximum intensity of the light
      this.lightColor = { r: 255, g: 255, b: 255 };
      // Light color (white)
      this.attenuationFactor = 2e-3;
      // Controls light falloff with distance
      this.ambientLight = 0.2;
      // Minimum light level
      this.directionalLight = false;
      // Enable directional light
      this.direction = new Point(0, 1);
      // Directional light angle (normalized)
      this.spreadAngle = Math.PI / 4;
      // Spread angle for the directional light (in radians)
      this.volumetricLight = false;
      // Enable volumetric light
      this.volumetricIntensity = 0.3;
      // Intensity of volumetric light (glow)
      this.fogDensity = 0.01;
      // Fog density for scattering effect
      this.init = () => {
      };
      this.apply = (particle, deltaTime) => {
        if (!this.enabled) return;
        const dx = particle.movement.x - this.lightSource.x;
        const dy = particle.movement.y - this.lightSource.y;
        const distanceSquared = dx * dx + dy * dy;
        const intensity = this.lightIntensity / (1 + this.attenuationFactor * distanceSquared);
        let directionalFactor = 1;
        if (this.directionalLight) {
          const normalizedDX = dx / Math.sqrt(distanceSquared);
          const normalizedDY = dy / Math.sqrt(distanceSquared);
          const dotProduct = normalizedDX * this.direction.x + normalizedDY * this.direction.y;
          const angle = Math.acos(dotProduct);
          if (angle > this.spreadAngle) {
            directionalFactor = 0;
          } else {
            directionalFactor = 1 - angle / this.spreadAngle;
          }
        }
        const effectiveIntensity = Math.max(this.ambientLight, Math.min(intensity * directionalFactor, this.lightIntensity));
        particle.color.r = Math.min(255, particle.color.r * effectiveIntensity * (this.lightColor.r / 255));
        particle.color.g = Math.min(255, particle.color.g * effectiveIntensity * (this.lightColor.g / 255));
        particle.color.b = Math.min(255, particle.color.b * effectiveIntensity * (this.lightColor.b / 255));
        particle.color.alpha = Math.min(1, particle.color.alpha * effectiveIntensity);
        if (this.volumetricLight) {
          const fogEffect = Math.exp(-this.fogDensity * Math.sqrt(distanceSquared));
          const volumetricFactor = this.volumetricIntensity * fogEffect;
          particle.color.r = Math.min(255, particle.color.r + volumetricFactor * this.lightColor.r);
          particle.color.g = Math.min(255, particle.color.g + volumetricFactor * this.lightColor.g);
          particle.color.b = Math.min(255, particle.color.b + volumetricFactor * this.lightColor.b);
          particle.color.alpha = Math.min(1, particle.color.alpha + volumetricFactor);
        }
      };
    }
    /**
     * Gets the name of the behaviour
     * @return {string} The name of the behaviour
     */
    getName() {
      return behaviourNames.LIGHT_EFFECT_BEHAVIOUR;
    }
    /**
     * @description Retrieves the properties of the object.
     * @returns {Object} The properties of the object.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        lightSource: { x: this.lightSource.x, y: this.lightSource.y },
        lightIntensity: this.lightIntensity,
        lightColor: this.lightColor,
        attenuationFactor: this.attenuationFactor,
        ambientLight: this.ambientLight,
        directionalLight: this.directionalLight,
        direction: { x: this.direction.x, y: this.direction.y },
        spreadAngle: this.spreadAngle,
        volumetricLight: this.volumetricLight,
        volumetricIntensity: this.volumetricIntensity,
        fogDensity: this.fogDensity,
        name: this.getName()
      };
    }
  }

  class StretchBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 200;
      this.baseScale = 1;
      // Base scale for Y-axis
      this.stretchFactor = 0.1;
      // Factor to scale X-axis based on speed
      this.minStretch = 1;
      // Minimum X scale
      this.maxStretch = 10;
      // Maximum X scale
      this.init = (particle) => {
        if (!this.enabled) return;
        particle.size.x = this.baseScale;
        particle.size.y = this.baseScale;
        particle.rotation = 0;
      };
      this.apply = (particle, deltaTime) => {
        if (!this.enabled) return;
        const combinedX = particle.velocity.x + (particle.movement.x - particle.x) / deltaTime;
        const combinedY = particle.velocity.y + (particle.movement.y - particle.y) / deltaTime;
        const speed = Math.sqrt(combinedX ** 2 + combinedY ** 2);
        const stretch = Math.min(this.maxStretch, Math.max(this.minStretch, this.baseScale + speed * this.stretchFactor));
        particle.size.x = stretch;
        particle.size.y = this.baseScale;
        const angle = Math.atan2(combinedY, combinedX);
        particle.rotation = angle;
      };
    }
    /**
     * Gets the name of the behaviour.
     * @return {string} The name of the behaviour.
     */
    getName() {
      return behaviourNames.STRETCH_BEHAVIOUR;
    }
    /**
     * Retrieves the properties of the behaviour.
     * @returns {object} The properties of the behaviour.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        baseScale: this.baseScale,
        stretchFactor: this.stretchFactor,
        minStretch: this.minStretch,
        maxStretch: this.maxStretch,
        name: this.getName()
      };
    }
  }

  class TemperatureBehaviour extends Behaviour {
    constructor() {
      super(...arguments);
      this.enabled = true;
      this.priority = 150;
      this.zones = [];
    }
    /**
     * Initializes the particle. This behavior does not require
     * per-particle initialization, but it's included for extensibility.
     */
    init(particle) {
    }
    /**
     * Applies temperature-based adjustments to the particle's velocity and color.
     */
    apply(particle) {
      if (!this.enabled || !this.zones || !this.zones.length) return;
      for (const zone of this.zones) {
        if (this.isInZone(particle, zone.center, zone.radius)) {
          particle.velocity.x *= zone.velocity.x;
          particle.velocity.y *= zone.velocity.y;
          particle.color.r = zone.color.r;
          particle.color.g = zone.color.g;
          particle.color.b = zone.color.b;
          break;
        }
      }
    }
    /**
     * Checks if a particle is within a specified zone.
     */
    isInZone(particle, center, radius) {
      const dx = particle.movement.x - center.x;
      const dy = particle.movement.y - center.y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    }
    /**
     * Returns the name of the behavior.
     */
    getName() {
      return behaviourNames.TEMPERATURE_BEHAVIOUR;
    }
    /**
     * Returns properties for serialization or debugging.
     */
    getProps() {
      return {
        enabled: this.enabled,
        priority: this.priority,
        zones: this.zones
      };
    }
  }

  var behaviour = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AngularVelocityBehaviour: AngularVelocityBehaviour,
    AttractionRepulsionBehaviour: AttractionRepulsionBehaviour,
    Behaviour: Behaviour,
    BehaviourNames: behaviourNames,
    CollisionBehaviour: CollisionBehaviour,
    ColorBehaviour: ColorBehaviour,
    EmitDirectionBehaviour: EmitDirectionBehaviour,
    EmitterBehaviours: EmitterBehaviours,
    ForceFieldsBehaviour: ForceFieldsBehaviour,
    GroupingBehaviour: GroupingBehaviour,
    LifeBehaviour: LifeBehaviour,
    LightEffectBehaviour: LightEffectBehaviour,
    NoiseBasedMotionBehaviour: NoiseBasedMotionBehaviour,
    PositionBehaviour: PositionBehaviour,
    RotationBehaviour: RotationBehaviour,
    SizeBehaviour: SizeBehaviour,
    SoundReactiveBehaviour: SoundReactiveBehaviour,
    SpawnBehaviour: SpawnBehaviour,
    StretchBehaviour: StretchBehaviour,
    TemperatureBehaviour: TemperatureBehaviour,
    TimelineBehaviour: TimelineBehaviour,
    TurbulenceBehaviour: TurbulenceBehaviour
  });

  class EmitterParser {
    /**
     * @constructor
     * @param {Emitter} emitter - the emitter object to be parsed
     */
    constructor(emitter) {
      /**
       * @function write
       * @description Writes the emitter configuration to a json object
       * @returns {Object} - the emitter configuration
       */
      this.write = () => {
        const config = { behaviours: [] };
        const emitterBehaviours = this.emitter.behaviours.getAll();
        for (let i = 0; i < emitterBehaviours.length; i++) {
          const behaviourConfig = emitterBehaviours[i].getParser().write();
          config.behaviours.push(behaviourConfig);
        }
        config.emitController = this.emitter.emitController.getParser().write();
        delete config.emitController._frames;
        config.duration = this.emitter.duration.maxTime;
        if (typeof this.emitter.alpha !== "undefined") {
          config.alpha = this.emitter.alpha;
        }
        if (typeof this.emitter.anchor !== "undefined") {
          config.anchor = this.emitter.anchor;
        }
        if (typeof this.emitter.blendMode !== "undefined") {
          config.blendMode = this.emitter.blendMode;
        }
        if (typeof this.emitter.animatedSprite !== "undefined") {
          config.animatedSprite = this.emitter.animatedSprite;
        }
        return config;
      };
      /**
       * @function read
       * @description Reads the emitter configuration from a json object
       * @param {Object} config - the emitter configuration
       * @param {Model} model - the model to be updated
       * @returns {Emitter} - the emitter
       */
      this.read = (config, model) => {
        const behavioursConfig = config.behaviours;
        const existingBehaviours = this.emitter.behaviours.getAll();
        const alwaysCreate = this.emitter.behaviours.isEmpty();
        this.emitter.behaviours.clear();
        for (let i = 0; i < behavioursConfig.length; i++) {
          const name = behavioursConfig[i].name;
          const behaviour = alwaysCreate ? this.createBehaviour(name) : this.getExistingOrCreate(name, existingBehaviours);
          behaviour.getParser().read(behavioursConfig[i]);
          this.emitter.behaviours.add(behaviour);
          if (behaviour.name === "PositionBehaviour") {
            model.update(behaviour);
          }
        }
        this.emitter.emitController = this.createEmitController(
          config.emitController.name || EmissionTypes.DEFAULT
        );
        this.emitter.emitController.getParser().read(config.emitController);
        this.emitter.duration.maxTime = CompatibilityHelper.readDuration(config);
        if (typeof config.alpha !== "undefined") {
          this.emitter.alpha = config.alpha;
        }
        if (typeof config.anchor !== "undefined") {
          this.emitter.anchor = config.anchor;
        }
        if (typeof config.blendMode !== "undefined") {
          this.emitter.blendMode = config.blendMode;
        }
        if (typeof config.animatedSprite !== "undefined") {
          this.emitter.animatedSprite = config.animatedSprite;
        }
        return this.emitter;
      };
      /**
       * @function update
       * @description Updates the emitter configuration from a json object
       * @param {Object} config - the emitter configuration
       * @param {Model} model - the model to be updated
       * @param {boolean} resetDuration - should duration be reset
       * @returns {Emitter} - the emitter
       */
      this.update = (config, model, resetDuration) => {
        const behavioursConfig = config.behaviours;
        const existingBehaviours = this.emitter.behaviours.getAll();
        const alwaysCreate = this.emitter.behaviours.isEmpty();
        this.emitter.behaviours.clear();
        for (let i = 0; i < behavioursConfig.length; i++) {
          const name = behavioursConfig[i].name;
          const behaviour = alwaysCreate ? this.createBehaviour(name) : this.getExistingOrCreate(name, existingBehaviours);
          behaviour.getParser().read(behavioursConfig[i]);
          this.emitter.behaviours.add(behaviour);
          if (behaviour.name === "PositionBehaviour") {
            model.update(behaviour);
          }
        }
        this.emitter.emitController.getParser().read(config.emitController);
        this.emitter.duration.maxTime = CompatibilityHelper.readDuration(config);
        if (resetDuration) {
          this.emitter.duration.reset();
        }
        if (typeof config.alpha !== "undefined") {
          this.emitter.alpha = config.alpha;
        }
        if (typeof config.anchor !== "undefined") {
          this.emitter.anchor = config.anchor;
        }
        if (typeof config.blendMode !== "undefined") {
          this.emitter.blendMode = config.blendMode;
        }
        if (typeof config.animatedSprite !== "undefined") {
          this.emitter.animatedSprite = config.animatedSprite;
        }
        return this.emitter;
      };
      /**
       * Retrieves an existing behaviour or creates a new behaviour
       * @param {string} name - The name of the behaviour to retreive or create
       * @param {any[]} existingBehaviours - An array of existing behaviours
       * @return {any} The existing behaviour or a new behaviour
       */
      this.getExistingOrCreate = (name, existingBehaviours) => {
        for (let i = 0; i < existingBehaviours.length; i++) {
          if (existingBehaviours[i].getName() === name) {
            return existingBehaviours[i];
          }
        }
        return this.createBehaviour(name);
      };
      /**
       * Creates a new behaviour
       * @param {string} name - The name of the behaviour to create
       * @return {any} The new behaviour
       */
      this.createBehaviour = (name) => {
        return new behaviour[name]();
      };
      /**
       * Creates a new behaviour properties
       * @param {string} name - The name of the behaviour to create
       * @return {any} The new behaviour properties
       */
      this.createBehaviourProps = (name) => {
        return new behaviour[name]().getProps();
      };
      /**
       * Creates a new emission controller
       * @param {string} name - The name of the emission controller to create
       * @return {any} The new emission controller
       */
      this.createEmitController = (name) => {
        return new controller[name]();
      };
      this.emitter = emitter;
    }
  }

  class AbstractEmission {
    /**
     * Calculate number of particles emitted after given time deltas
     * @param {number} deltaTime - number of seconds passed
     * @param {number} particlesCount - current number of particles
     * @return {number} - the number of particles emitted
     * @abstract
     */
    howMany(deltaTime, particlesCount) {
      throw new Error("Abstract method");
    }
    /**
     * Reset the emission
     */
    reset() {
    }
    /**
     * Get the name of the emission
     * @return {string} - the name of the emission
     * @throws {Error} - when the method is not overridden in subclass
     */
    getName() {
      throw new Error("This method has to be overridden in subclass");
    }
    /**
     * Get the parser for the emitter
     * @return {EmitControllerParser} - parser for the emitter
     */
    getParser() {
      return new EmitControllerParser(this);
    }
  }

  class UniformEmission extends AbstractEmission {
    constructor() {
      super(...arguments);
      this._maxParticles = 0;
      this._maxLife = 1;
      this._emitPerSecond = 0;
      this._frames = 0;
      /**
       * Returns EmissionTypes.DEFAULT.
       *
       * @returns {string} EmissionTypes.DEFAULT.
       */
      this.getName = () => {
        return EmissionTypes.DEFAULT;
      };
    }
    /**
     * Calculates the number of particles to emit.
     *
     * @param {number} deltaTime - The elapsed time between frames.
     * @param {number} particlesCount - The current number of particles on the screen.
     * @returns {number} The number of particles to emit in the current frame.
     */
    howMany(deltaTime, particlesCount) {
      const ratio = this._emitPerSecond * deltaTime;
      this._frames += ratio;
      let numberToEmit = 0;
      if (this._frames >= 1) {
        numberToEmit = Math.round(this._frames);
        this._frames = 0;
      }
      return numberToEmit;
    }
    /**
     * Recalculates the emitPerSecond value based on the maxParticles and maxLife values.
     */
    refresh() {
      this.emitPerSecond = this._maxParticles / this._maxLife;
    }
    /**
     * Sets the maxLife value and calls refresh() to recalculate the emitPerSecond.
     *
     * @param {number} value - The new maxLife value.
     */
    set maxLife(value) {
      this._maxLife = Math.max(value, 1);
      this.refresh();
    }
    /**
     * Sets the maxParticles value and calls refresh() to recalculate the emitPerSecond.
     *
     * @param {number} value - The new maxParticles value.
     */
    set maxParticles(value) {
      this._maxParticles = Math.max(value, 0);
      this.refresh();
    }
    /**
     * Returns the emitPerSecond value.
     *
     * @returns {number} The emitPerSecond value.
     */
    get emitPerSecond() {
      return this._emitPerSecond;
    }
    /**
     * Sets the emitPerSecond value.
     *
     * @param {number} value - The new emitPerSecond value.
     */
    set emitPerSecond(value) {
      this._emitPerSecond = Math.max(value, 0);
    }
  }

  class RandomEmission extends AbstractEmission {
    constructor() {
      super(...arguments);
      /**
       * Maximum number of particles
       */
      this._maxParticles = 0;
      /**
       * Emission rate
       */
      this._emissionRate = 0;
      /**
       * Gets the name of the emission type
       * @returns {string} Emission type
       */
      this.getName = () => {
        return EmissionTypes.RANDOM;
      };
    }
    /**
     * Calculates how many particles to emit
     * @param {number} deltaTime - how much time is passed
     * @param {number} particlesCount - current number of particles
     */
    howMany(deltaTime, particlesCount) {
      if (particlesCount < this.maxParticles) {
        const count = Math.round(Random.uniform(0, Math.ceil(this.emissionRate * deltaTime)));
        const total = particlesCount + count;
        return total > this._maxParticles ? this.maxParticles - particlesCount : count;
      }
      return 0;
    }
    /**
     * Gets the emission rate
     */
    get emissionRate() {
      return this._emissionRate;
    }
    /**
     * Sets the emission rate
     * @param {number} value - the emission rate to set
     */
    set emissionRate(value) {
      this._emissionRate = Math.max(0, value);
    }
    /**
     * Gets the maximum number of particles
     */
    get maxParticles() {
      return this._maxParticles;
    }
    /**
     * Sets the maximum number of particles
     * @param {number} value - the maximum number of particles to set
     */
    set maxParticles(value) {
      this._maxParticles = Math.max(0, value);
    }
  }

  class StandardEmission extends AbstractEmission {
    constructor() {
      super(...arguments);
      /**
       * The emitCounter field stores the counter for emission rate.
       * @private
       * @type {number}
       */
      this._emitCounter = 0;
      /**
       * The maxParticles field stores the maximum number of particles allowed to be emitted.
       * @private
       * @type {number}
       */
      this._maxParticles = 0;
      /**
       * The emissionRate field stores the current rate of emission.
       * @private
       * @type {number}
       */
      this._emissionRate = 0;
      /**
       * GetName() returns the type of the emission.
       * @return {EmissionTypes} - The type of the emission.
       */
      this.getName = () => {
        return EmissionTypes.UNIFORM;
      };
    }
    /**
     * Getter for the maxParticles field.
     * @return {number} - The maximum number of particles allowed to be emitted.
     */
    get maxParticles() {
      return this._maxParticles;
    }
    /**
     * Setter for the maxParticles field.
     * @param {number} value - The new maximum number of particles allowed to be emitted.
     */
    set maxParticles(value) {
      this._maxParticles = Math.max(0, value);
    }
    /**
     * Getter for the emissionRate field.
     * @return {number} - The current emission rate.
     */
    get emissionRate() {
      return this._emissionRate;
    }
    /**
     * Setter for the emissionRate field.
     * @param {number} value - The new emission rate.
     */
    set emissionRate(value) {
      this._emissionRate = Math.max(0, value);
    }
    /**
     * howMany() calculates how many particles should be emitted in the given interval of time.
     *
     * @param {number} deltaTime - The amount of time elapsed since the last emission.
     * @param {number} particlesCount - The current number of particles.
     * @return {number} - The number of particles to be emitted.
     */
    howMany(deltaTime, particlesCount) {
      const rate = 1 / this.emissionRate;
      let count = 0;
      if (particlesCount < this.maxParticles) {
        this._emitCounter += deltaTime;
      }
      while (particlesCount < this.maxParticles && this._emitCounter > rate) {
        count++;
        this._emitCounter -= rate;
      }
      return count;
    }
  }

  const _Particle = class _Particle {
    /**
     * Constructs a particle object
     */
    constructor() {
      this.next = null;
      this.prev = null;
      /**
       * Stores the unique ID of the particle
       */
      this.uid = _Particle._UID.value++;
      /**
       * Stores the movement of the particle
       */
      this.movement = new Point();
      /**
       * Stores the acceleration of the particle
       */
      this.acceleration = new Point();
      /**
       * Stores the velocity of the particle
       */
      this.velocity = new Point();
      /**
       * Stores the size of the particle
       */
      this.size = new Point();
      /**
       * Stores the starting size of the particle
       */
      this.sizeStart = new Point();
      /**
       * Stores the starting warp size of the particle
       */
      this.warpSizeStart = new Point();
      /**
       * Stores the ending size of the particle
       */
      this.sizeEnd = new Point();
      /**
       * Stores the x value of the particle for sin wave
       */
      this.sinXVal = new Point();
      /**
       * Stores the y value of the particle for sin wave
       */
      this.sinYVal = new Point();
      /**
       * Stores the color of the particle
       */
      this.color = new Color();
      /**
       * Stores the starting color of the particle
       */
      this.colorStart = new Color();
      /**
       * Stores the ending color of the particle
       */
      this.colorEnd = new Color();
      this.superColorAlphaEnd = 1;
      this.skipPositionBehaviour = false;
      this.skipAngularVelocityBehaviour = false;
      this.skipColorBehaviour = false;
      this.skipEmitDirectionBehaviour = false;
      this.skipRotationBehaviour = false;
      this.skipSizeBehaviour = false;
      this.skipAttractionRepulsionBehaviour = false;
      this.fromAtoB = false;
      this.fromAtoBTwoWays = false;
      this.pointA = new Point();
      this.pointB = new Point();
      this.there = new ThereBack();
      this.back = new ThereBack();
      this.xStart = 0;
      this.yStart = 0;
      this.xTarget = 0;
      this.yTarget = 0;
      this.thereDuration = 1;
      this.backDuration = 1;
      this.progress = 0;
      this.time = 0;
      this.thereAmplitude = 10;
      this.backAmplitude = 10;
      this.direction = 1;
      this.noiseOffset = new Point();
      this.timeline = [];
      this.initialDirectionCos = 0;
      this.initialDirectionSin = 0;
      this.velocityScale = 1;
      this.rotationAcceleration = 0;
      this.reset();
    }
    /**
     * Resets the particle object
     */
    reset() {
      this.maxLifeTime = 0;
      this.lifeTime = 0;
      this.lifeProgress = 0;
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.timeline = [];
      this.skipPositionBehaviour = false;
      this.skipAngularVelocityBehaviour = false;
      this.skipColorBehaviour = false;
      this.skipAttractionRepulsionBehaviour = false;
      this.skipEmitDirectionBehaviour = false;
      this.skipRotationBehaviour = false;
      this.skipSizeBehaviour = false;
      this.movement.set(0, 0);
      this.acceleration.set(0, 0);
      this.velocity.set(0, 0);
      this.sinXVal.set(0, 0);
      this.sinYVal.set(0, 0);
      this.velocityAngle = 0;
      this.radiansPerSecond = 0;
      this.radius = 0;
      this.radiusStart = 0;
      this.radiusEnd = 0;
      this.directionCos = 1;
      this.directionSin = 0;
      this.finishingTexture = 0;
      this.showVortices = false;
      this.turbulence = false;
      this.rotation = 0;
      this.rotationDelta = 0;
      this.size.set(1, 1);
      this.sizeStart.set(0, 0);
      this.warpSizeStart.set(0, 0);
      this.sizeEnd.set(0, 0);
      this.color.set(255, 255, 255, 1);
      this.colorStart.set(0, 0, 0, 1);
      this.colorEnd.set(0, 0, 0, 1);
      this.superColorAlphaEnd = 1;
      this.cameraZ = 0;
      this.cameraZConverter = 10;
      this.warpSpeed = 0;
      this.warpBaseSpeed = 0;
      this.warpFov = 20;
      this.warpStretch = 5;
      this.warpDistanceScaleConverter = 2e3;
      this.sizeDifference = { x: 1, y: 1 };
      this.fromAtoB = false;
      this.fromAtoBTwoWays = false;
      this.pointA.set(0, 0);
      this.pointB.set(0, 0);
      this.there.set("", "", "");
      this.back.set("", "", "");
      this.thereDuration = 1;
      this.backDuration = 1;
      this.thereAmplitude = 10;
      this.backAmplitude = 10;
      this.progress = 0;
      this.direction = 1;
      this.time = 0;
      this.xStart = 0;
      this.yStart = 0;
      this.xTarget = 0;
      this.yTarget = 0;
      this.noiseOffset = new Point();
      this.initialDirectionCos = 0;
      this.initialDirectionSin = 0;
      this.velocityScale = 1;
      this.rotationAcceleration = 0;
    }
    /**
     * Checks if the particle is almost dead
     *
     * @return {boolean} True if the particle is almost dead, otherwise false
     */
    isAlmostDead() {
      return this.lifeTime >= this.maxLifeTime - 0.1;
    }
    /**
     * Checks if the particle is dead
     *
     * @return {boolean} True if the particle is dead, otherwise false
     */
    isDead() {
      return this.lifeTime >= this.maxLifeTime;
    }
    /**
     * Hides the particle
     */
    hide() {
      if (!this.sprite) return;
      if (!this.sprite.visible) return;
      this.sprite.visible = false;
    }
  };
  _Particle._UID = { value: 0 };
  let Particle = _Particle;

  const _ParticlePool = class _ParticlePool {
    constructor() {
      /**
       * The first element in the pool.
       */
      this.first = null;
    }
    /**
     * Removes a particle from the pool and returns it.
     *
     * @returns {Particle} The removed particle.
     */
    pop() {
      if (!this.first) return this.create();
      const current = this.first;
      this.first = current.next;
      current.next = null;
      return current;
    }
    /**
     * Creates a new particle.
     *
     * @returns {Particle} The newly created particle.
     */
    create() {
      return new Particle();
    }
    /**
     * Adds a particle to the pool.
     *
     * @param {Particle} particle The particle to add.
     */
    push(particle) {
      particle.next = this.first;
      this.first = particle;
    }
    /**
     * Resets the particle pool.
     */
    reset() {
      this.first = null;
      _ParticlePool.global = new _ParticlePool();
    }
  };
  /**
   * A static global instance of ParticlePool.
   */
  _ParticlePool.global = new _ParticlePool();
  let ParticlePool = _ParticlePool;

  class Duration {
    constructor() {
      this.maxTime = -1;
      this._stop = false;
      this._elapsedTime = 0;
      /**
       * Checks if the time has elapsed.
       * @returns {boolean} Returns true if the time is elapsed, false otherwise.
       */
      this.isTimeElapsed = () => {
        return this._stop || this.maxTime > 0 && this._elapsedTime >= this.maxTime;
      };
      /**
       * Updates the elapsed time.
       * @param {number} deltaTime - The amount of time that has passed since the last update.
       */
      this.update = (deltaTime) => {
        this._elapsedTime += deltaTime;
      };
      /**
       * Resets the elapsed time.
       */
      this.reset = () => {
        this._stop = false;
        this._elapsedTime = 0;
      };
      /**
       * Stops the elapsed time.
       */
      this.stop = () => {
        this._stop = true;
      };
      /**
       * Starts the elapsed time.
       */
      this.start = () => {
        this._stop = false;
      };
    }
  }

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var eventemitter3$1 = {exports: {}};

  var hasRequiredEventemitter3;

  function requireEventemitter3 () {
  	if (hasRequiredEventemitter3) return eventemitter3$1.exports;
  	hasRequiredEventemitter3 = 1;
  	(function (module) {

  		var has = Object.prototype.hasOwnProperty
  		  , prefix = '~';

  		/**
  		 * Constructor to create a storage for our `EE` objects.
  		 * An `Events` instance is a plain object whose properties are event names.
  		 *
  		 * @constructor
  		 * @private
  		 */
  		function Events() {}

  		//
  		// We try to not inherit from `Object.prototype`. In some engines creating an
  		// instance in this way is faster than calling `Object.create(null)` directly.
  		// If `Object.create(null)` is not supported we prefix the event names with a
  		// character to make sure that the built-in object properties are not
  		// overridden or used as an attack vector.
  		//
  		if (Object.create) {
  		  Events.prototype = Object.create(null);

  		  //
  		  // This hack is needed because the `__proto__` property is still inherited in
  		  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  		  //
  		  if (!new Events().__proto__) prefix = false;
  		}

  		/**
  		 * Representation of a single event listener.
  		 *
  		 * @param {Function} fn The listener function.
  		 * @param {*} context The context to invoke the listener with.
  		 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
  		 * @constructor
  		 * @private
  		 */
  		function EE(fn, context, once) {
  		  this.fn = fn;
  		  this.context = context;
  		  this.once = once || false;
  		}

  		/**
  		 * Add a listener for a given event.
  		 *
  		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
  		 * @param {(String|Symbol)} event The event name.
  		 * @param {Function} fn The listener function.
  		 * @param {*} context The context to invoke the listener with.
  		 * @param {Boolean} once Specify if the listener is a one-time listener.
  		 * @returns {EventEmitter}
  		 * @private
  		 */
  		function addListener(emitter, event, fn, context, once) {
  		  if (typeof fn !== 'function') {
  		    throw new TypeError('The listener must be a function');
  		  }

  		  var listener = new EE(fn, context || emitter, once)
  		    , evt = prefix ? prefix + event : event;

  		  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  		  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  		  else emitter._events[evt] = [emitter._events[evt], listener];

  		  return emitter;
  		}

  		/**
  		 * Clear event by name.
  		 *
  		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
  		 * @param {(String|Symbol)} evt The Event name.
  		 * @private
  		 */
  		function clearEvent(emitter, evt) {
  		  if (--emitter._eventsCount === 0) emitter._events = new Events();
  		  else delete emitter._events[evt];
  		}

  		/**
  		 * Minimal `EventEmitter` interface that is molded against the Node.js
  		 * `EventEmitter` interface.
  		 *
  		 * @constructor
  		 * @public
  		 */
  		function EventEmitter() {
  		  this._events = new Events();
  		  this._eventsCount = 0;
  		}

  		/**
  		 * Return an array listing the events for which the emitter has registered
  		 * listeners.
  		 *
  		 * @returns {Array}
  		 * @public
  		 */
  		EventEmitter.prototype.eventNames = function eventNames() {
  		  var names = []
  		    , events
  		    , name;

  		  if (this._eventsCount === 0) return names;

  		  for (name in (events = this._events)) {
  		    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  		  }

  		  if (Object.getOwnPropertySymbols) {
  		    return names.concat(Object.getOwnPropertySymbols(events));
  		  }

  		  return names;
  		};

  		/**
  		 * Return the listeners registered for a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @returns {Array} The registered listeners.
  		 * @public
  		 */
  		EventEmitter.prototype.listeners = function listeners(event) {
  		  var evt = prefix ? prefix + event : event
  		    , handlers = this._events[evt];

  		  if (!handlers) return [];
  		  if (handlers.fn) return [handlers.fn];

  		  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
  		    ee[i] = handlers[i].fn;
  		  }

  		  return ee;
  		};

  		/**
  		 * Return the number of listeners listening to a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @returns {Number} The number of listeners.
  		 * @public
  		 */
  		EventEmitter.prototype.listenerCount = function listenerCount(event) {
  		  var evt = prefix ? prefix + event : event
  		    , listeners = this._events[evt];

  		  if (!listeners) return 0;
  		  if (listeners.fn) return 1;
  		  return listeners.length;
  		};

  		/**
  		 * Calls each of the listeners registered for a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @returns {Boolean} `true` if the event had listeners, else `false`.
  		 * @public
  		 */
  		EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  		  var evt = prefix ? prefix + event : event;

  		  if (!this._events[evt]) return false;

  		  var listeners = this._events[evt]
  		    , len = arguments.length
  		    , args
  		    , i;

  		  if (listeners.fn) {
  		    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

  		    switch (len) {
  		      case 1: return listeners.fn.call(listeners.context), true;
  		      case 2: return listeners.fn.call(listeners.context, a1), true;
  		      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
  		      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
  		      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
  		      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
  		    }

  		    for (i = 1, args = new Array(len -1); i < len; i++) {
  		      args[i - 1] = arguments[i];
  		    }

  		    listeners.fn.apply(listeners.context, args);
  		  } else {
  		    var length = listeners.length
  		      , j;

  		    for (i = 0; i < length; i++) {
  		      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

  		      switch (len) {
  		        case 1: listeners[i].fn.call(listeners[i].context); break;
  		        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
  		        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
  		        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
  		        default:
  		          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
  		            args[j - 1] = arguments[j];
  		          }

  		          listeners[i].fn.apply(listeners[i].context, args);
  		      }
  		    }
  		  }

  		  return true;
  		};

  		/**
  		 * Add a listener for a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @param {Function} fn The listener function.
  		 * @param {*} [context=this] The context to invoke the listener with.
  		 * @returns {EventEmitter} `this`.
  		 * @public
  		 */
  		EventEmitter.prototype.on = function on(event, fn, context) {
  		  return addListener(this, event, fn, context, false);
  		};

  		/**
  		 * Add a one-time listener for a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @param {Function} fn The listener function.
  		 * @param {*} [context=this] The context to invoke the listener with.
  		 * @returns {EventEmitter} `this`.
  		 * @public
  		 */
  		EventEmitter.prototype.once = function once(event, fn, context) {
  		  return addListener(this, event, fn, context, true);
  		};

  		/**
  		 * Remove the listeners of a given event.
  		 *
  		 * @param {(String|Symbol)} event The event name.
  		 * @param {Function} fn Only remove the listeners that match this function.
  		 * @param {*} context Only remove the listeners that have this context.
  		 * @param {Boolean} once Only remove one-time listeners.
  		 * @returns {EventEmitter} `this`.
  		 * @public
  		 */
  		EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  		  var evt = prefix ? prefix + event : event;

  		  if (!this._events[evt]) return this;
  		  if (!fn) {
  		    clearEvent(this, evt);
  		    return this;
  		  }

  		  var listeners = this._events[evt];

  		  if (listeners.fn) {
  		    if (
  		      listeners.fn === fn &&
  		      (!once || listeners.once) &&
  		      (!context || listeners.context === context)
  		    ) {
  		      clearEvent(this, evt);
  		    }
  		  } else {
  		    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
  		      if (
  		        listeners[i].fn !== fn ||
  		        (once && !listeners[i].once) ||
  		        (context && listeners[i].context !== context)
  		      ) {
  		        events.push(listeners[i]);
  		      }
  		    }

  		    //
  		    // Reset the array, or remove it completely if we have no more listeners.
  		    //
  		    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
  		    else clearEvent(this, evt);
  		  }

  		  return this;
  		};

  		/**
  		 * Remove all listeners, or those of the specified event.
  		 *
  		 * @param {(String|Symbol)} [event] The event name.
  		 * @returns {EventEmitter} `this`.
  		 * @public
  		 */
  		EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  		  var evt;

  		  if (event) {
  		    evt = prefix ? prefix + event : event;
  		    if (this._events[evt]) clearEvent(this, evt);
  		  } else {
  		    this._events = new Events();
  		    this._eventsCount = 0;
  		  }

  		  return this;
  		};

  		//
  		// Alias methods names because people roll like that.
  		//
  		EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  		EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  		//
  		// Expose the prefix.
  		//
  		EventEmitter.prefixed = prefix;

  		//
  		// Allow `EventEmitter` to be imported as module namespace.
  		//
  		EventEmitter.EventEmitter = EventEmitter;

  		//
  		// Expose the module.
  		//
  		{
  		  module.exports = EventEmitter;
  		} 
  	} (eventemitter3$1));
  	return eventemitter3$1.exports;
  }

  var eventemitter3Exports = requireEventemitter3();
  var eventemitter3 = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

  class List {
    constructor() {
      /**
       * Stores the first item of the list
       *
       * @member {any}
       */
      this.first = null;
      /**
       * Stores the length of the list
       *
       * @member {number}
       */
      this.length = 0;
    }
    /**
     * Returns true if the list is empty
     *
     * @returns {boolean}
     */
    isEmpty() {
      return this.first === null;
    }
    /**
     * Adds an item to the list
     *
     * @param {any} item
     * @returns {any}
     */
    add(item) {
      item.prev = null;
      item.next = null;
      if (this.first) {
        this.first.prev = item;
      }
      item.next = this.first;
      this.first = item;
      this.length++;
      return item;
    }
    /**
     * Iterates through the list, calling the callback for each item
     *
     * @param {any} callback
     */
    forEach(callback) {
      let current = this.first;
      let next = null;
      while (current) {
        next = current.next;
        callback(current);
        current = next;
      }
    }
    /**
     * Removes an item from the list
     *
     * @param {any} item
     */
    remove(item) {
      const previous = item.prev;
      const next = item.next;
      if (previous) previous.next = next;
      if (next) next.prev = previous;
      if (this.first === item) this.first = item.next;
      item.prev = null;
      item.next = null;
      this.length--;
    }
    /**
     * Resets the list
     *
     */
    reset() {
      this.first = null;
      this.length = 0;
    }
  }

  class TurbulencePool {
    constructor() {
      this.list = new List();
    }
  }

  const _Emitter = class _Emitter extends eventemitter3 {
    constructor(model) {
      super();
      this.list = new List();
      this.duration = new Duration();
      this.alpha = 1;
      this.anchor = { x: 0.5, y: 0.5 };
      this.blendMode = pixi_js.BLEND_MODES.NORMAL;
      this.behaviours = new EmitterBehaviours();
      this.turbulencePool = new TurbulencePool();
      this._model = model;
      this.emitController = new controller[EmissionTypes.DEFAULT]();
    }
    /**
     * Updates the emitter, emits particles and updates the particles.
     * Triggers the COMPLETE event when the duration is elapsed and the list is empty.
     * @param {number} deltaTime - Time elapsed since the last update
     */
    async update(deltaTime) {
      if (!this._play) return;
      this.behaviours.update(deltaTime);
      this.emitParticles(deltaTime);
      this.updateParticles(deltaTime);
      this.duration.update(deltaTime);
      if (this.duration.isTimeElapsed() && this.list.isEmpty()) {
        this.stop();
        setTimeout(() => {
          this.emit(_Emitter.COMPLETE);
        });
      }
    }
    /**
     * Emits particles if the duration is not elapsed.
     * @param {number} deltaTime - Time elapsed since the last update
     */
    emitParticles(deltaTime) {
      if (!this.duration.isTimeElapsed()) {
        this.createParticles(deltaTime);
      }
    }
    /**
     * Creates the particles to be emitted.
     * Triggers the CREATE event when a particle is created.
     * @param {number} deltaTime - Time elapsed since the last update
     */
    createParticles(deltaTime) {
      const particlesToEmit = this.emitController.howMany(deltaTime, this.list.length);
      for (let i = 0; i < particlesToEmit; ++i) {
        const particle = this.list.add(ParticlePool.global.pop());
        this.behaviours.init(particle, this._model, this.turbulencePool);
        this.emit(_Emitter.CREATE, particle);
      }
    }
    /**
     * Updates the list of particles
     * @param {number} deltaTime - The amount of time that has passed since the last update
     */
    updateParticles(deltaTime) {
      this.list.forEach((particle) => {
        this.updateParticle(particle, deltaTime);
      });
    }
    /**
     * Updates a single particle
     * @param {Particle} particle - The particle to update
     * @param {number} deltaTime - The amount of time that has passed since the last update
     */
    updateParticle(particle, deltaTime) {
      if (particle.isDead()) {
        this.removeParticle(particle);
      } else if (particle.isAlmostDead()) {
        this.behaviours.apply(particle, deltaTime, this._model);
        this.emit(_Emitter.FINISHING, particle);
        this.emit(_Emitter.UPDATE, particle);
      } else {
        this.behaviours.apply(particle, deltaTime, this._model);
        this.emit(_Emitter.UPDATE, particle);
      }
    }
    /**
     * Removes a particle from the list and reset it
     * @param {Particle} particle - The particle to remove
     */
    removeParticle(particle) {
      this.emit(_Emitter.REMOVE, particle);
      this.list.remove(particle);
      particle.reset();
      ParticlePool.global.push(particle);
      this.turbulencePool.list.remove(particle);
    }
    /**
     * Gets a parser to parse the emitter and it's particles
     * @returns {EmitterParser} - The parser for this emitter
     */
    getParser() {
      return new EmitterParser(this);
    }
    /**
     * Creates props for a behaviour
     * @param {string} name - The name of the behaviour
     * @returns {Object} - The props for the behaviour
     */
    createBehaviourProps(name) {
      return this.getParser().createBehaviourProps(name);
    }
    /**
     * Starts the emitter playing
     */
    play() {
      this.duration.start();
      this._play = true;
    }
    /**
     * Resets the emitter and starts playing
     */
    resetAndPlay() {
      this.reset();
      this.play();
    }
    /**
     * Resets the emitter without removing the particles and starts playing
     */
    resetWithoutRemovingAndPlay() {
      this.resetWithoutRemoving();
      this.play();
    }
    /**
     * Resets the emitter and removes all the particles
     */
    reset() {
      this.emitController.reset();
      this.duration.reset();
      this.removeParticles();
      this.emit(_Emitter.RESET);
    }
    /**
     * Resets the emitter without removing the particles
     */
    resetWithoutRemoving() {
      this.emitController.reset();
      this.duration.reset();
      this.emit(_Emitter.RESET);
    }
    /**
     * Stops the emitter and removes all the particles
     */
    stop() {
      this._play = false;
      this.removeParticles();
      this.emit(_Emitter.STOP);
    }
    /**
     * Stops the emitter without killing the particles
     */
    stopWithoutKilling() {
      this.duration.stop();
    }
    /**
     * Removes all the particles from the list
     */
    removeParticles() {
      this.list.forEach((particle) => {
        this.removeParticle(particle);
      });
      this.turbulencePool.list.forEach((particle) => {
        this.removeParticle(particle);
      });
    }
    pause() {
      this.list.forEach((particle) => {
        if (particle.sprite instanceof pixi_js.AnimatedSprite) {
          particle.sprite.stop();
        }
      });
    }
    resume() {
      this.list.forEach((particle) => {
        if (particle.sprite instanceof pixi_js.AnimatedSprite) {
          particle.sprite.play();
        }
      });
    }
    destroy() {
      var _a;
      this.list.reset();
      this.list = void 0;
      this.turbulencePool.list.reset();
      this.turbulencePool.list = void 0;
      this.turbulencePool = void 0;
      this.duration = void 0;
      this.animatedSprite = void 0;
      (_a = this.behaviours) == null ? void 0 : _a.clear();
      this.behaviours = void 0;
      if (this.emitController && this.emitController.reset) {
        this.emitController.reset();
      }
      this.emitController = void 0;
      this._model = void 0;
    }
  };
  _Emitter.STOP = "emitter/stop";
  _Emitter.RESET = "emitter/reset";
  _Emitter.CREATE = "emitter/create";
  _Emitter.UPDATE = "emitter/update";
  _Emitter.REMOVE = "emitter/remove";
  _Emitter.FINISHING = "emitter/finishing";
  _Emitter.COMPLETE = "emitter/complete";
  let Emitter = _Emitter;

  const cpp = {
    Emitter
  };

  class Model {
    constructor() {
      /**
       * Boolean value indicating whether warping is enabled
       */
      this.warp = false;
      /**
       * The Z position of the camera
       */
      this.cameraZ = 0;
      /**
       * The conversion rate for cameraZ
       */
      this.cameraZConverter = 0;
      /**
       * The speed of warp
       */
      this.warpSpeed = 0;
      /**
       * The base speed of warp
       */
      this.warpBaseSpeed = 0;
    }
    /**
     * Update the model with the behaviour object
     * @param {Object} behaviour - The behaviour object
     */
    update(behaviour) {
      this.warp = behaviour.warp || false;
      this.cameraZConverter = behaviour.cameraZConverter;
      this.warpSpeed = behaviour.warpSpeed;
      this.warpBaseSpeed = behaviour.warpBaseSpeed;
    }
    /**
     * Update the camera position based on the delta time
     * @param {number} deltaTime - The delta time
     */
    updateCamera(deltaTime) {
      if (!this.warp) return;
      this.cameraZ += deltaTime * this.cameraZConverter * this.warpSpeed * this.warpBaseSpeed;
    }
  }

  class Renderer extends pixi_js.ParticleContainer {
    /**
     * Creates an instance of Renderer.
     *
     * @memberof Renderer
     */
    constructor(settings) {
      const {
        textures,
        emitterConfig,
        finishingTextures,
        animatedSpriteZeroPad,
        animatedSpriteIndexToStart,
        vertices,
        position,
        rotation,
        uvs,
        tint,
        maxParticles,
        maxFPS,
        minFPS,
        tickerSpeed
      } = settings;
      super(maxParticles, {
        vertices,
        position,
        rotation,
        uvs,
        tint
      });
      this._paused = false;
      this._internalPaused = false;
      this.zeroPad = 2;
      this.indexToStart = 0;
      this.unusedSprites = [];
      this.anchor = { x: 0.5, y: 0.5 };
      this._model = new Model();
      this.onComplete = () => {
      };
      this.onCompleteFN = () => {
      };
      this.getByName = (name) => {
        for (let i = 0; i < this.config.behaviours.length; ++i) {
          if (this.config.behaviours[i].name === name) {
            return this.config.behaviours[i];
          }
        }
        return null;
      };
      this.config = emitterConfig;
      this.textures = textures;
      this.finishingTextureNames = finishingTextures;
      this.zeroPad = animatedSpriteZeroPad;
      this.indexToStart = animatedSpriteIndexToStart;
      const turbulenceConfigIndex = this.getConfigIndexByName(behaviourNames.TURBULENCE_BEHAVIOUR, emitterConfig);
      if (turbulenceConfigIndex !== -1) {
        const turbulenceConfig = emitterConfig.behaviours[turbulenceConfigIndex];
        if (turbulenceConfig.enabled === true) {
          this.turbulenceEmitter = new cpp.Emitter(this._model);
          this.turbulenceParser = this.turbulenceEmitter.getParser();
          this.turbulenceParser.read(this.buildTurbulenceConfig(turbulenceConfig), this._model);
          this.turbulenceEmitter.on(Emitter.CREATE, this.onCreateTurbulence, this);
          this.turbulenceEmitter.on(Emitter.UPDATE, this.onUpdateTurbulence, this);
          this.turbulenceEmitter.on(Emitter.REMOVE, this.onRemoveTurbulence, this);
        }
      }
      if (typeof emitterConfig.alpha !== "undefined") {
        this.alpha = emitterConfig.alpha;
      }
      if (typeof emitterConfig.blendMode !== "undefined") {
        this.blendMode = emitterConfig.blendMode;
      }
      if (typeof emitterConfig.anchor !== "undefined") {
        this.anchor = emitterConfig.anchor;
      }
      this.emitter = new cpp.Emitter(this._model);
      this.emitterParser = this.emitter.getParser();
      this.emitterParser.read(emitterConfig, this._model);
      this.emitter.on(Emitter.CREATE, this.onCreate, this);
      this.emitter.on(Emitter.UPDATE, this.onUpdate, this);
      this.emitter.on(Emitter.FINISHING, this.onFinishing, this);
      this.emitter.on(Emitter.REMOVE, this.onRemove, this);
      this.onCompleteFN = () => this.onComplete();
      this.emitter.on(Emitter.COMPLETE, this.onCompleteFN, this);
      if (this.turbulenceEmitter && this.turbulenceEmitter.list) {
        this.emitter.turbulencePool.list = this.turbulenceEmitter.list;
      }
      this._visibilitychangeBinding = () => this.internalPause(document.hidden);
      document.addEventListener("visibilitychange", this._visibilitychangeBinding);
      const ticker = new pixi_js.Ticker();
      ticker.maxFPS = maxFPS || 60;
      ticker.minFPS = minFPS || 60;
      ticker.speed = tickerSpeed || 0.02;
      ticker.stop();
      ticker.add(this._updateTransform, this);
      ticker.start();
      this._ticker = ticker;
    }
    /**
     * Sets the paused state of the object.
     *
     * @param {boolean} [isPaused=true] - The new paused state of the object. Defaults to `true`.
     * @returns {void}
     */
    pause(isPaused = true) {
      this.paused(isPaused);
    }
    /**
     * Resumes the object's operation by setting its paused state to false.
     *
     * @returns {void}
     */
    resume() {
      this.paused(false);
    }
    /**
     * Updates the transform of the ParticleContainer and updates the emitters.
     */
    _updateTransform(deltaTime) {
      var _a;
      if (this._paused) return;
      (_a = this.emitter) == null ? void 0 : _a.update(deltaTime);
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.update(deltaTime);
      }
    }
    /**
     *
     * @method updateTexture
     * @description This method updates the texture of the unused sprites and children to a randomly generated texture.
     */
    updateTexture() {
      var _a;
      for (let i = 0; i < this.unusedSprites.length; ++i) {
        this.unusedSprites[i].texture = pixi_js.Assets.get(this.getRandomTexture());
      }
      for (let i = 0; i < ((_a = this.children) == null ? void 0 : _a.length); ++i) {
        this.children[i].texture = pixi_js.Texture.from(this.getRandomTexture());
      }
    }
    /**
     * This method is used to start the emitter and turbulenceEmitter if available.
     * @function start
     */
    start() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.resetAndPlay();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.resetAndPlay();
      }
    }
    /**
     * Resets the particle emitters in this class without removing existing particles and plays them.
     * @function play
     */
    play() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.resetWithoutRemovingAndPlay();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.resetWithoutRemovingAndPlay();
      }
    }
    /**
     * Immediately stops emitting particles
     */
    stopImmediately() {
      var _a, _b, _c;
      (_a = this._ticker) == null ? void 0 : _a.destroy();
      this._ticker = void 0;
      (_b = this.emitter) == null ? void 0 : _b.stop();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.stop();
      }
      (_c = this.emitter) == null ? void 0 : _c.emit(Emitter.COMPLETE);
    }
    /**
     * Destroy particles
     */
    destroy() {
      this.stopImmediately();
      super.destroy();
      if (this.emitter) {
        this.emitter.destroy();
        this.emitter.off(Emitter.CREATE, this.onCreate, this);
        this.emitter.off(Emitter.UPDATE, this.onUpdate, this);
        this.emitter.off(Emitter.FINISHING, this.onFinishing, this);
        this.emitter.off(Emitter.REMOVE, this.onRemove, this);
        this.emitter.off(Emitter.COMPLETE, this.onCompleteFN, this);
        this.emitter = void 0;
      }
      this.turbulenceEmitter = void 0;
      this.turbulenceParser = void 0;
      this.unusedSprites = void 0;
      this._model = void 0;
      this.onComplete = void 0;
      this.onCompleteFN = void 0;
      this.config = void 0;
      this.textures = void 0;
      this.finishingTextureNames = void 0;
      this.emitterParser = void 0;
      this.textures = void 0;
      document.removeEventListener("visibilitychange", this._visibilitychangeBinding);
    }
    /**
     * Terminates the emitter and any turbulence emitter it is associated with
     */
    stop() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.stopWithoutKilling();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.stop();
      }
    }
    /**
     * Resets the emitters to their initial state
     */
    resetEmitter() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.reset();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.reset();
      }
    }
    /**
     * Sets the textures used by the emitter
     * @param {string[]} textures - Array of strings containing the textures to be used by the emitter
     */
    setTextures(textures) {
      this.textures = textures;
      this.updateTexture();
    }
    /**
     * Updates the configuration of the emitter
     * @param {any} config - Configuration object to be used to update the emitter
     * @param {boolean} resetDuration - should duration be reset
     */
    updateConfig(config, resetDuration = false) {
      var _a;
      (_a = this.emitterParser) == null ? void 0 : _a.update(config, this._model, resetDuration);
      if (this.turbulenceEmitter) {
        const turbulenceConfigIndex = this.getConfigIndexByName(behaviourNames.TURBULENCE_BEHAVIOUR, config);
        if (turbulenceConfigIndex !== -1) {
          const turbulenceConfig = config.behaviours[turbulenceConfigIndex];
          if (turbulenceConfig.enabled === true) {
            this.turbulenceParser.update(this.buildTurbulenceConfig(turbulenceConfig), this._model, resetDuration);
          }
        }
      }
    }
    /**
     * Updates the position of the emitter
     * @param {Object} position - Object containing the x and y coordinates of the new position
     * @param {boolean} resetDuration - should duration be reset
     */
    updatePosition(position, resetDuration = true) {
      var _a;
      const behaviour = this.getByName(behaviourNames.SPAWN_BEHAVIOUR);
      behaviour.customPoints[0].position.x = position.x;
      behaviour.customPoints[0].position.y = position.y;
      (_a = this.emitterParser) == null ? void 0 : _a.update(this.config, this._model, resetDuration);
    }
    /**
     * Clears the sprite pool, the unused sprites list and the turbulence and particle pools.
     */
    clearPool() {
      this.removeChildren();
      this.unusedSprites = [];
      if (this.turbulenceEmitter && this.turbulenceEmitter.list) {
        if (this.emitter) {
          this.emitter.turbulencePool.list.reset();
          this.emitter.turbulencePool.list = new List();
        }
      }
      if (this.emitter) {
        this.emitter.list.reset();
        this.emitter.list = new List();
      }
      ParticlePool.global.reset();
    }
    getOrCreateSprite() {
      var _a, _b, _c;
      if (this.unusedSprites.length > 0) {
        const sprite2 = this.unusedSprites.pop();
        if (this.finishingTextureNames && this.finishingTextureNames.length) {
          sprite2.texture = pixi_js.Assets.get(this.getRandomTexture());
        }
        return sprite2;
      }
      if ((_a = this.emitter) == null ? void 0 : _a.animatedSprite) {
        const textures = this.createFrameAnimationByName(this.getRandomTexture());
        if (textures.length) {
          const animation = new pixi_js.AnimatedSprite(textures);
          animation.anchor.set(this.anchor.x, this.anchor.y);
          animation.loop = (_b = this.emitter) == null ? void 0 : _b.animatedSprite.loop;
          animation.animationSpeed = (_c = this.emitter) == null ? void 0 : _c.animatedSprite.frameRate;
          return this.addChild(animation);
        }
      }
      const sprite = new pixi_js.Sprite(pixi_js.Texture.from(this.getRandomTexture()));
      sprite.anchor.set(this.anchor.x, this.anchor.y);
      return this.addChild(sprite);
    }
    createFrameAnimationByName(prefix, imageFileExtension = "png") {
      const zeroPad = this.zeroPad;
      const textures = [];
      let frame = "";
      let indexFrame = this.indexToStart;
      let padding = 0;
      let texture;
      do {
        frame = indexFrame.toString();
        padding = zeroPad - frame.length;
        if (padding > 0) {
          frame = "0".repeat(padding) + frame;
        }
        try {
          const fileName = `${prefix}${frame}.${imageFileExtension}`;
          const file = pixi_js.utils.TextureCache[fileName];
          if (file) {
            texture = pixi_js.Assets.get(fileName);
            textures.push(texture);
            indexFrame += 1;
          } else {
            texture = null;
          }
        } catch (e) {
          texture = null;
        }
      } while (texture);
      return textures;
    }
    onCreate(particle) {
      var _a;
      const sprite = this.getOrCreateSprite();
      sprite.visible = true;
      sprite.alpha = 1;
      if (this.blendMode) {
        sprite.blendMode = this.blendMode;
      }
      if (sprite instanceof pixi_js.AnimatedSprite) {
        if ((_a = this.emitter) == null ? void 0 : _a.animatedSprite.randomFrameStart) {
          const textures = this.createFrameAnimationByName(this.getRandomTexture());
          sprite.gotoAndPlay(this.getRandomFrameNumber(textures.length));
        } else {
          sprite.play();
        }
      }
      particle.sprite = sprite;
    }
    onCreateTurbulence(particle) {
      let sprite;
      if (particle.showVortices) {
        sprite = new pixi_js.Sprite(pixi_js.Texture.from("vortex.png"));
      } else {
        sprite = new pixi_js.Sprite();
      }
      sprite.anchor.set(this.anchor.x, this.anchor.y);
      this.addChild(sprite);
      sprite.visible = false;
      sprite.alpha = 0;
      particle.sprite = sprite;
      if (particle.showVortices && sprite) {
        sprite.visible = true;
        sprite.alpha = 1;
      }
    }
    onUpdate(particle) {
      const sprite = particle.sprite;
      sprite.x = particle.x;
      sprite.y = particle.y;
      sprite.scale.x = particle.size.x;
      sprite.scale.y = particle.size.y;
      sprite.tint = particle.color.hex;
      sprite.alpha = particle.color.alpha;
      sprite.rotation = particle.rotation;
    }
    onUpdateTurbulence(particle) {
      const sprite = particle.sprite;
      sprite.x = particle.x;
      sprite.y = particle.y;
      if (particle.showVortices && sprite) {
        sprite.scale.x = particle.size.x;
        sprite.scale.y = particle.size.y;
        sprite.tint = particle.color.hex;
        sprite.alpha = particle.color.alpha;
        sprite.rotation = particle.rotation;
      }
    }
    onFinishing(particle) {
      if (!this.finishingTextureNames || !this.finishingTextureNames.length) return;
      const sprite = particle.sprite;
      if (particle.finishingTexture <= this.finishingTextureNames.length - 1) {
        sprite.texture = pixi_js.Texture.from(this.getRandomFinishingTexture());
        particle.finishingTexture++;
      }
    }
    onRemove(particle) {
      const sprite = particle.sprite;
      if (!particle.showVortices && sprite) {
        sprite.visible = false;
        sprite.alpha = 0;
      }
      particle.finishingTexture = 0;
      this.unusedSprites.push(sprite);
      if (sprite instanceof pixi_js.AnimatedSprite) {
        sprite.stop();
      }
    }
    onRemoveTurbulence(particle) {
      const sprite = particle.sprite;
      if (!particle.showVortices && sprite) {
        sprite.visible = false;
        sprite.alpha = 0;
      }
      this.removeChild(sprite);
      delete particle.sprite;
    }
    getRandomTexture() {
      return this.textures[Math.floor(Math.random() * this.textures.length)];
    }
    getRandomFinishingTexture() {
      return this.finishingTextureNames[Math.floor(Math.random() * this.finishingTextureNames.length)];
    }
    getRandomFrameNumber(textures) {
      return Math.floor(Math.random() * textures);
    }
    paused(paused) {
      var _a, _b, _c, _d;
      if (paused === this._paused) return;
      this._paused = paused;
      if (paused) {
        (_a = this._ticker) == null ? void 0 : _a.stop();
        (_b = this.emitter) == null ? void 0 : _b.pause();
      } else {
        (_c = this._ticker) == null ? void 0 : _c.start();
        (_d = this.emitter) == null ? void 0 : _d.resume();
      }
    }
    internalPause(paused) {
      if (this._paused) return;
      if (paused === this._internalPaused) return;
      this._internalPaused = paused;
    }
    getConfigIndexByName(name, config) {
      let index = -1;
      config.behaviours.forEach((behaviour, i) => {
        if (behaviour.name === name) {
          index = i;
        }
      });
      return index;
    }
    buildTurbulenceConfig(turbulenceConfig) {
      return {
        behaviours: [
          {
            enabled: true,
            priority: 1e4,
            maxLifeTime: turbulenceConfig.maxLifeTime || 2,
            timeVariance: turbulenceConfig.maxLifeTimeVariance || 0,
            name: "LifeBehaviour"
          },
          {
            priority: 100,
            spawnType: "Ring",
            customPoints: [
              {
                radius: 0,
                position: {
                  x: turbulenceConfig.position.x || 0,
                  y: turbulenceConfig.position.y || 0
                },
                positionVariance: {
                  x: turbulenceConfig.positionVariance.x || 0,
                  y: turbulenceConfig.positionVariance.y || 0
                }
              }
            ],
            name: "SpawnBehaviour"
          },
          {
            enabled: true,
            priority: 100,
            velocity: {
              x: turbulenceConfig.velocity.x || 0,
              y: turbulenceConfig.velocity.y || 0
            },
            velocityVariance: {
              x: turbulenceConfig.velocityVariance.x || 0,
              y: turbulenceConfig.velocityVariance.y || 0
            },
            acceleration: {
              x: turbulenceConfig.acceleration.x || 0,
              y: turbulenceConfig.acceleration.y || 0
            },
            accelerationVariance: {
              x: turbulenceConfig.accelerationVariance.x || 0,
              y: turbulenceConfig.accelerationVariance.y || 0
            },
            name: "PositionBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            sizeStart: {
              x: turbulenceConfig.sizeStart.x || 1,
              y: turbulenceConfig.sizeStart.y || 1
            },
            sizeEnd: {
              x: turbulenceConfig.sizeEnd.x || 1,
              y: turbulenceConfig.sizeEnd.y || 1
            },
            startVariance: turbulenceConfig.startVariance || 0,
            endVariance: turbulenceConfig.endVariance || 0,
            name: "SizeBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            rotation: 12,
            variance: 0,
            name: "RotationBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            showVortices: turbulenceConfig.showVortices || false,
            turbulence: true,
            name: "TurbulenceBehaviour"
          }
        ],
        emitController: {
          _maxParticles: 0,
          _maxLife: 1,
          _emitPerSecond: turbulenceConfig.emitPerSecond || 2,
          _frames: 0,
          name: "UniformEmission"
        },
        duration: turbulenceConfig.duration || -1
      };
    }
  }

  class TestRenderer extends pixi_js.Container {
    /**
     * Creates an instance of Renderer.
     *
     * @memberof Renderer
     */
    constructor(settings) {
      const {
        textures,
        emitterConfig,
        finishingTextures,
        animatedSpriteZeroPad,
        animatedSpriteIndexToStart,
        maxFPS,
        minFPS,
        tickerSpeed
      } = settings;
      super();
      this._paused = false;
      this._internalPaused = false;
      this.zeroPad = 2;
      this.indexToStart = 0;
      this.unusedSprites = [];
      this.anchor = { x: 0.5, y: 0.5 };
      this._model = new Model();
      this.onComplete = () => {
      };
      this.onCompleteFN = () => {
      };
      this.getByName = (name) => {
        for (let i = 0; i < this.config.behaviours.length; ++i) {
          if (this.config.behaviours[i].name === name) {
            return this.config.behaviours[i];
          }
        }
        return null;
      };
      this.config = emitterConfig;
      this.textures = textures;
      this.finishingTextureNames = finishingTextures;
      this.zeroPad = animatedSpriteZeroPad;
      this.indexToStart = animatedSpriteIndexToStart;
      const turbulenceConfigIndex = this.getConfigIndexByName(behaviourNames.TURBULENCE_BEHAVIOUR, emitterConfig);
      if (turbulenceConfigIndex !== -1) {
        const turbulenceConfig = emitterConfig.behaviours[turbulenceConfigIndex];
        if (turbulenceConfig.enabled === true) {
          this.turbulenceEmitter = new cpp.Emitter(this._model);
          this.turbulenceParser = this.turbulenceEmitter.getParser();
          this.turbulenceParser.read(this.buildTurbulenceConfig(turbulenceConfig), this._model);
          this.turbulenceEmitter.on(Emitter.CREATE, this.onCreateTurbulence, this);
          this.turbulenceEmitter.on(Emitter.UPDATE, this.onUpdateTurbulence, this);
          this.turbulenceEmitter.on(Emitter.REMOVE, this.onRemoveTurbulence, this);
        }
      }
      if (typeof emitterConfig.alpha !== "undefined") {
        this.alpha = emitterConfig.alpha;
      }
      if (typeof emitterConfig.blendMode !== "undefined") {
        this.blendMode = emitterConfig.blendMode;
      }
      if (typeof emitterConfig.anchor !== "undefined") {
        this.anchor = emitterConfig.anchor;
      }
      this.emitter = new cpp.Emitter(this._model);
      this.emitterParser = this.emitter.getParser();
      this.emitterParser.read(emitterConfig, this._model);
      this.emitter.on(Emitter.CREATE, this.onCreate, this);
      this.emitter.on(Emitter.UPDATE, this.onUpdate, this);
      this.emitter.on(Emitter.FINISHING, this.onFinishing, this);
      this.emitter.on(Emitter.REMOVE, this.onRemove, this);
      this.onCompleteFN = () => this.onComplete();
      this.emitter.on(Emitter.COMPLETE, this.onCompleteFN, this);
      if (this.turbulenceEmitter && this.turbulenceEmitter.list) {
        this.emitter.turbulencePool.list = this.turbulenceEmitter.list;
      }
      this._visibilitychangeBinding = () => this.internalPause(document.hidden);
      document.addEventListener("visibilitychange", this._visibilitychangeBinding);
      const ticker = new pixi_js.Ticker();
      ticker.maxFPS = maxFPS || 60;
      ticker.minFPS = minFPS || 60;
      ticker.speed = tickerSpeed || 0.02;
      ticker.stop();
      ticker.add(this._updateTransform, this);
      ticker.start();
      this._ticker = ticker;
    }
    /**
     * Sets the paused state of the object.
     *
     * @param {boolean} [isPaused=true] - The new paused state of the object. Defaults to `true`.
     * @returns {void}
     */
    pause(isPaused = true) {
      this.paused(isPaused);
    }
    /**
     * Resumes the object's operation by setting its paused state to false.
     *
     * @returns {void}
     */
    resume() {
      this.paused(false);
    }
    /**
     * Updates the transform of the ParticleContainer and updates the emitters.
     */
    _updateTransform(deltaTime) {
      var _a;
      if (this._paused) return;
      (_a = this.emitter) == null ? void 0 : _a.update(deltaTime);
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.update(deltaTime);
      }
    }
    /**
     *
     * @method updateTexture
     * @description This method updates the texture of the unused sprites and children to a randomly generated texture.
     */
    updateTexture() {
      var _a;
      for (let i = 0; i < this.unusedSprites.length; ++i) {
        this.unusedSprites[i].texture = pixi_js.Assets.get(this.getRandomTexture());
      }
      for (let i = 0; i < ((_a = this.children) == null ? void 0 : _a.length); ++i) {
        this.children[i].texture = pixi_js.Texture.from(this.getRandomTexture());
      }
    }
    /**
     * This method is used to start the emitter and turbulenceEmitter if available.
     * @function start
     */
    start() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.resetAndPlay();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.resetAndPlay();
      }
    }
    /**
     * Resets the particle emitters in this class without removing existing particles and plays them.
     * @function play
     */
    play() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.resetWithoutRemovingAndPlay();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.resetWithoutRemovingAndPlay();
      }
    }
    /**
     * Immediately stops emitting particles
     */
    stopImmediately() {
      var _a, _b, _c;
      (_a = this._ticker) == null ? void 0 : _a.destroy();
      this._ticker = void 0;
      (_b = this.emitter) == null ? void 0 : _b.stop();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.stop();
      }
      (_c = this.emitter) == null ? void 0 : _c.emit(Emitter.COMPLETE);
    }
    /**
     * Destroy particles
     */
    destroy() {
      this.stopImmediately();
      super.destroy();
      if (this.emitter) {
        this.emitter.destroy();
        this.emitter.off(Emitter.CREATE, this.onCreate, this);
        this.emitter.off(Emitter.UPDATE, this.onUpdate, this);
        this.emitter.off(Emitter.FINISHING, this.onFinishing, this);
        this.emitter.off(Emitter.REMOVE, this.onRemove, this);
        this.emitter.off(Emitter.COMPLETE, this.onCompleteFN, this);
        this.emitter = void 0;
      }
      this.turbulenceEmitter = void 0;
      this.turbulenceParser = void 0;
      this.unusedSprites = void 0;
      this._model = void 0;
      this.onComplete = void 0;
      this.onCompleteFN = void 0;
      this.config = void 0;
      this.textures = void 0;
      this.finishingTextureNames = void 0;
      this.emitterParser = void 0;
      this.textures = void 0;
      document.removeEventListener("visibilitychange", this._visibilitychangeBinding);
    }
    /**
     * Terminates the emitter and any turbulence emitter it is associated with
     */
    stop() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.stopWithoutKilling();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.stop();
      }
    }
    /**
     * Resets the emitters to their initial state
     */
    resetEmitter() {
      var _a;
      (_a = this.emitter) == null ? void 0 : _a.reset();
      if (this.turbulenceEmitter) {
        this.turbulenceEmitter.reset();
      }
    }
    /**
     * Sets the textures used by the emitter
     * @param {string[]} textures - Array of strings containing the textures to be used by the emitter
     */
    setTextures(textures) {
      this.textures = textures;
      this.updateTexture();
    }
    /**
     * Updates the configuration of the emitter
     * @param {any} config - Configuration object to be used to update the emitter
     * @param {boolean} resetDuration - should duration be reset
     */
    updateConfig(config, resetDuration = false) {
      var _a;
      (_a = this.emitterParser) == null ? void 0 : _a.update(config, this._model, resetDuration);
      if (this.turbulenceEmitter) {
        const turbulenceConfigIndex = this.getConfigIndexByName(behaviourNames.TURBULENCE_BEHAVIOUR, config);
        if (turbulenceConfigIndex !== -1) {
          const turbulenceConfig = config.behaviours[turbulenceConfigIndex];
          if (turbulenceConfig.enabled === true) {
            this.turbulenceParser.update(this.buildTurbulenceConfig(turbulenceConfig), this._model, resetDuration);
          }
        }
      }
    }
    /**
     * Updates the position of the emitter
     * @param {Object} position - Object containing the x and y coordinates of the new position
     * @param {boolean} resetDuration - should duration be reset
     */
    updatePosition(position, resetDuration = true) {
      var _a;
      const behaviour = this.getByName(behaviourNames.SPAWN_BEHAVIOUR);
      behaviour.customPoints[0].position.x = position.x;
      behaviour.customPoints[0].position.y = position.y;
      (_a = this.emitterParser) == null ? void 0 : _a.update(this.config, this._model, resetDuration);
    }
    /**
     * Clears the sprite pool, the unused sprites list and the turbulence and particle pools.
     */
    clearPool() {
      this.removeChildren();
      this.unusedSprites = [];
      if (this.turbulenceEmitter && this.turbulenceEmitter.list) {
        if (this.emitter) {
          this.emitter.turbulencePool.list.reset();
          this.emitter.turbulencePool.list = new List();
        }
      }
      if (this.emitter) {
        this.emitter.list.reset();
        this.emitter.list = new List();
      }
      ParticlePool.global.reset();
    }
    getOrCreateSprite() {
      var _a, _b, _c;
      if (this.unusedSprites.length > 0) {
        const sprite2 = this.unusedSprites.pop();
        if (this.finishingTextureNames && this.finishingTextureNames.length) {
          sprite2.texture = pixi_js.Assets.get(this.getRandomTexture());
        }
        return sprite2;
      }
      if ((_a = this.emitter) == null ? void 0 : _a.animatedSprite) {
        const textures = this.createFrameAnimationByName(this.getRandomTexture());
        if (textures.length) {
          const animation = new pixi_js.AnimatedSprite(textures);
          animation.anchor.set(this.anchor.x, this.anchor.y);
          animation.loop = (_b = this.emitter) == null ? void 0 : _b.animatedSprite.loop;
          animation.animationSpeed = (_c = this.emitter) == null ? void 0 : _c.animatedSprite.frameRate;
          return this.addChild(animation);
        }
      }
      const sprite = new pixi_js.Sprite(pixi_js.Texture.from(this.getRandomTexture()));
      sprite.anchor.set(this.anchor.x, this.anchor.y);
      return this.addChild(sprite);
    }
    createFrameAnimationByName(prefix, imageFileExtension = "png") {
      const zeroPad = this.zeroPad;
      const textures = [];
      let frame = "";
      let indexFrame = this.indexToStart;
      let padding = 0;
      let texture;
      do {
        frame = indexFrame.toString();
        padding = zeroPad - frame.length;
        if (padding > 0) {
          frame = "0".repeat(padding) + frame;
        }
        try {
          const fileName = `${prefix}${frame}.${imageFileExtension}`;
          const file = pixi_js.utils.TextureCache[fileName];
          if (file) {
            texture = pixi_js.Assets.get(fileName);
            textures.push(texture);
            indexFrame += 1;
          } else {
            texture = null;
          }
        } catch (e) {
          texture = null;
        }
      } while (texture);
      return textures;
    }
    onCreate(particle) {
      var _a;
      const sprite = this.getOrCreateSprite();
      sprite.visible = true;
      sprite.alpha = 1;
      if (this.blendMode) {
        sprite.blendMode = this.blendMode;
      }
      if (sprite instanceof pixi_js.AnimatedSprite) {
        if ((_a = this.emitter) == null ? void 0 : _a.animatedSprite.randomFrameStart) {
          const textures = this.createFrameAnimationByName(this.getRandomTexture());
          sprite.gotoAndPlay(this.getRandomFrameNumber(textures.length));
        } else {
          sprite.play();
        }
      }
      particle.sprite = sprite;
    }
    onCreateTurbulence(particle) {
      let sprite;
      if (particle.showVortices) {
        sprite = new pixi_js.Sprite(pixi_js.Texture.from("vortex.png"));
      } else {
        sprite = new pixi_js.Sprite();
      }
      sprite.anchor.set(this.anchor.x, this.anchor.y);
      this.addChild(sprite);
      sprite.visible = false;
      sprite.alpha = 0;
      particle.sprite = sprite;
      if (particle.showVortices && sprite) {
        sprite.visible = true;
        sprite.alpha = 1;
      }
    }
    onUpdate(particle) {
      const sprite = particle.sprite;
      sprite.x = particle.x;
      sprite.y = particle.y;
      sprite.scale.x = particle.size.x;
      sprite.scale.y = particle.size.y;
      sprite.tint = particle.color.hex;
      sprite.alpha = particle.color.alpha;
      sprite.rotation = particle.rotation;
    }
    onUpdateTurbulence(particle) {
      const sprite = particle.sprite;
      sprite.x = particle.x;
      sprite.y = particle.y;
      if (particle.showVortices && sprite) {
        sprite.scale.x = particle.size.x;
        sprite.scale.y = particle.size.y;
        sprite.tint = particle.color.hex;
        sprite.alpha = particle.color.alpha;
        sprite.rotation = particle.rotation;
      }
    }
    onFinishing(particle) {
      if (!this.finishingTextureNames || !this.finishingTextureNames.length) return;
      const sprite = particle.sprite;
      if (particle.finishingTexture <= this.finishingTextureNames.length - 1) {
        sprite.texture = pixi_js.Texture.from(this.getRandomFinishingTexture());
        particle.finishingTexture++;
      }
    }
    onRemove(particle) {
      const sprite = particle.sprite;
      if (!particle.showVortices && sprite) {
        sprite.visible = false;
        sprite.alpha = 0;
      }
      particle.finishingTexture = 0;
      this.unusedSprites.push(sprite);
      if (sprite instanceof pixi_js.AnimatedSprite) {
        sprite.stop();
      }
    }
    onRemoveTurbulence(particle) {
      const sprite = particle.sprite;
      if (!particle.showVortices && sprite) {
        sprite.visible = false;
        sprite.alpha = 0;
      }
      this.removeChild(sprite);
      delete particle.sprite;
    }
    getRandomTexture() {
      return this.textures[Math.floor(Math.random() * this.textures.length)];
    }
    getRandomFinishingTexture() {
      return this.finishingTextureNames[Math.floor(Math.random() * this.finishingTextureNames.length)];
    }
    getRandomFrameNumber(textures) {
      return Math.floor(Math.random() * textures);
    }
    paused(paused) {
      var _a, _b, _c, _d;
      if (paused === this._paused) return;
      this._paused = paused;
      if (paused) {
        (_a = this._ticker) == null ? void 0 : _a.stop();
        (_b = this.emitter) == null ? void 0 : _b.pause();
      } else {
        (_c = this._ticker) == null ? void 0 : _c.start();
        (_d = this.emitter) == null ? void 0 : _d.resume();
      }
    }
    internalPause(paused) {
      if (this._paused) return;
      if (paused === this._internalPaused) return;
      this._internalPaused = paused;
    }
    getConfigIndexByName(name, config) {
      let index = -1;
      config.behaviours.forEach((behaviour, i) => {
        if (behaviour.name === name) {
          index = i;
        }
      });
      return index;
    }
    buildTurbulenceConfig(turbulenceConfig) {
      return {
        behaviours: [
          {
            enabled: true,
            priority: 1e4,
            maxLifeTime: turbulenceConfig.maxLifeTime || 2,
            timeVariance: turbulenceConfig.maxLifeTimeVariance || 0,
            name: "LifeBehaviour"
          },
          {
            priority: 100,
            customPoints: [
              {
                spawnType: "Ring",
                radius: 0,
                position: {
                  x: turbulenceConfig.position.x || 0,
                  y: turbulenceConfig.position.y || 0
                },
                positionVariance: {
                  x: turbulenceConfig.positionVariance.x || 0,
                  y: turbulenceConfig.positionVariance.y || 0
                }
              }
            ],
            name: "SpawnBehaviour"
          },
          {
            enabled: true,
            priority: 100,
            velocity: {
              x: turbulenceConfig.velocity.x || 0,
              y: turbulenceConfig.velocity.y || 0
            },
            velocityVariance: {
              x: turbulenceConfig.velocityVariance.x || 0,
              y: turbulenceConfig.velocityVariance.y || 0
            },
            acceleration: {
              x: turbulenceConfig.acceleration.x || 0,
              y: turbulenceConfig.acceleration.y || 0
            },
            accelerationVariance: {
              x: turbulenceConfig.accelerationVariance.x || 0,
              y: turbulenceConfig.accelerationVariance.y || 0
            },
            name: "PositionBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            sizeStart: {
              x: turbulenceConfig.sizeStart.x || 1,
              y: turbulenceConfig.sizeStart.y || 1
            },
            sizeEnd: {
              x: turbulenceConfig.sizeEnd.x || 1,
              y: turbulenceConfig.sizeEnd.y || 1
            },
            startVariance: turbulenceConfig.startVariance || 0,
            endVariance: turbulenceConfig.endVariance || 0,
            name: "SizeBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            rotation: 12,
            variance: 0,
            name: "RotationBehaviour"
          },
          {
            enabled: true,
            priority: 0,
            showVortices: turbulenceConfig.showVortices || false,
            turbulence: true,
            name: "TurbulenceBehaviour"
          }
        ],
        emitController: {
          _maxParticles: 0,
          _maxLife: 1,
          _emitPerSecond: turbulenceConfig.emitPerSecond || 2,
          _frames: 0,
          name: "UniformEmission"
        },
        duration: turbulenceConfig.duration || -1
      };
    }
  }

  const customPixiParticles = {
    create(settings) {
      const {
        textures,
        emitterConfig,
        animatedSpriteZeroPad = 2,
        animatedSpriteIndexToStart = 0,
        finishingTextures = [],
        vertices = true,
        position = true,
        rotation = true,
        uvs = true,
        tint = true,
        maxParticles = 1e4,
        maxFPS = 60,
        minFPS = 30,
        tickerSpeed = 0.02
      } = settings;
      return new Renderer({
        textures,
        animatedSpriteZeroPad,
        animatedSpriteIndexToStart,
        emitterConfig,
        finishingTextures,
        vertices,
        position,
        rotation,
        uvs,
        tint,
        maxParticles,
        maxFPS,
        minFPS,
        tickerSpeed
      });
    }
  };
  const _customPixiParticlesEditorOnly = {
    create(settings) {
      const {
        textures,
        emitterConfig,
        animatedSpriteZeroPad = 2,
        animatedSpriteIndexToStart = 0,
        finishingTextures = [],
        maxFPS = 60,
        minFPS = 60,
        tickerSpeed = 0.02
      } = settings;
      return new TestRenderer({
        textures,
        animatedSpriteZeroPad,
        animatedSpriteIndexToStart,
        emitterConfig,
        finishingTextures,
        maxFPS,
        minFPS,
        tickerSpeed
      });
    }
  };

  exports.Renderer = Renderer;
  exports._customPixiParticlesEditorOnly = _customPixiParticlesEditorOnly;
  exports.customPixiParticles = customPixiParticles;

}));
