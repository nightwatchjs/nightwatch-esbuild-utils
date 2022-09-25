const path = require('path');
const {Script} = require('vm');

const getDefaultExport = function (exported) {
  if (exported && Object.prototype.hasOwnProperty.call(exported, 'default')) {
    return exported.default;
  }

  return exported;
};

/**
 * Creates a VM instance for running in-memory code in the current global
 * context. It can run only CommonJS or IIFE code, because running
 * ES modules ability is still experimental (the current Node is 18).
 *
 * Some pseudo-global values are preserved in the context:
 *  1. `__filename`.
 *  2. `__dirname`.
 *  3. `require` (patched).
 *
 * See https://nodejs.org/api/modules.html#the-module-scope
 *
 * @param {string} realModulePath
 * @param {string} [virtualModulePath]
 * @returns {function}
 */
module.exports = function (realModulePath, virtualModulePath = realModulePath) {
  return function (code) {
    const contextModule = {
      exports: {}
    };

    const content = `
    (function (module, require, __filename, __dirname) {
      var exports = module.exports;
      
      ${code}
    })
    `;

    new Script(content, {filename: virtualModulePath}).runInThisContext()(contextModule, function (requirePath) {
      const relativePoint = requirePath.startsWith('.') ? path.dirname(realModulePath) : path.join(process.cwd(), 'node_modules');
      const absolutePathToModule = path.isAbsolute(requirePath) ? requirePath : path.join(relativePoint, requirePath);

      return require(absolutePathToModule);
    }, realModulePath, path.dirname(realModulePath));

    return getDefaultExport(contextModule.exports);
  };
};