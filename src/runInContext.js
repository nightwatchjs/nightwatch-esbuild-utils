const transform = require('./transform.js');
const createCodeRunnerFor = require('./createCodeRunnerFor.js');
const getVirtualFilePath = require('./getVirtualFilePath.js');

module.exports = async function (modulePath, options) {

  const code = await transform(modulePath, options);
  const virtualFilePath = getVirtualFilePath(modulePath);

  return createCodeRunnerFor(modulePath, virtualFilePath)(code);
};