module.exports = (function() { return AbstractModel; })();

var _r = require('./component'); eval('var Component = _r');

/**
 * Abstract color model
 */
function AbstractModel() {
  this._name       = null;
  this._components = [];
};

/**
 * @returns {String}
 */
AbstractModel.prototype.toString = function () {
  var v = [];
  for (var i = 0, iMax = this._components.length; i < iMax; i++) {
    v.push(this['_' + this._components[i]].get());
  }
  return this._name + '(' + v.join(', ') + ')';
};

/**
 * @param {AbstractModel} that
 * @returns {Boolean}
 */
AbstractModel.prototype.equals = function (that) {
  if (!(that instanceof AbstractModel) || this._name !== that._name) {
    return false;
  }
  for (var i = 0, cs = this._components, iMax = cs.length; i < iMax; i++) {
    var key = '_' + cs[i];
    if (!this[key].equals(that[key])) {
      return false;
    }
  }
  return true;
};

/**
 * @abstract
 * @returns {Xyz}
 */
AbstractModel.prototype.toXyz = function () {
  throw new Error('Model ' + this._name + ' has not implemented Xyz conversion!');
};

/**
 * @returns {Lab}
 */
AbstractModel.prototype.toLab = function () {
  return this.toXyz().toLab();
};

/**
 * Getter/chainable setter in one place
 *
 * @param {String} name
 * @param {Number} value
 * @returns {AbstractModel}
 */
AbstractModel.prototype.component = function (name, value) {
  var component = this['_' + name];
  if (undefined === component || !(component instanceof Component)) {
    throw new Error('Component "' + name + '" is not exists');
  }

  if (1 == arguments.length) {
    return component.get();
  }

  component.set(value);
  return this;
};

/**
 * @param {String} name
 * @param {Array} args
 * @returns {AbstractModel}
 */
AbstractModel.prototype._component = function (name, args) {
  /** @type Component */
  var component = this['_' + name];

  if (0 == args.length) {
    return component.get();
  }

  component.set(args[0]);
  return this;
};
