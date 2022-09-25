const path = require('path');
const getVirtualFilePath = require('./getVirtualFilePath.js');
const {buildFile, transformFile, findExportNamesIn} = require('./esbuild.js');

const itFnAsync = function({name, exportName, createTest, modulePath, additionalTestData, modulePublicUrl}) {
  return `
      
      it('${typeof name === 'string' ? name : name(exportName)}', async function (browser) {
        const test = await Promise.resolve((${createTest.toString()})({
          data: ${JSON.stringify({exportName, modulePath, ...additionalTestData})},
          publicUrl: "${modulePublicUrl}",
          modulePath: "${modulePath}",
          exportName: "${exportName}",
        }));
        
        const result = await Promise.resolve(test(browser));
        const data = result === null || result === undefined ? {} : result;
        
        const component = ${
  exportName === 'default'
    ? `${path.basename(modulePath, path.extname(modulePath))}_${exportName}`
    : exportName
};
        
        if (component.test) {
          await Promise.resolve(component.test(browser, data));
        }
      }
    );`;
};

const itFn = function({name, exportName, createTest, modulePath, additionalTestData, modulePublicUrl}) {
  return `
    
    it('${typeof name === 'string' ? name : name(exportName)}', function (browser) {
      const test = ((${createTest.toString()})({
          data: ${JSON.stringify({exportName, modulePath, ...additionalTestData})},
          publicUrl: "${modulePublicUrl}",
          modulePath: "${modulePath}",
          exportName: "${exportName}",
        }));
        
      const result = test(browser);
      const data = result === null || result === undefined ? {} : result;
      const component = ${
  exportName === 'default'
    ? `${path.basename(modulePath, path.extname(modulePath))}_${exportName}`
    : exportName
};
        if (component.test) {
          return component.test(browser, data);
        }
      }
    );`;
};

/**
 * Creates a virtual test file
 *
 * @param {string} modulePath
 * @param {Object} description
 */
module.exports = async function (modulePath, {name, data, exports, createTest}) {
  if (typeof createTest != 'function') {
    throw new Error('createTest function must be defined.');
  }

  const isCreateTestAsync = createTest.constructor.name === 'AsyncFunction';

  const virtualFilePath = getVirtualFilePath(modulePath);
  const modulePublicUrl = modulePath.replace(process.cwd(), '').split(path.sep).join('/');
  const allModuleExports = await findExportNamesIn(modulePath);

  const exportNames = exports
    ? await Promise.resolve(exports(allModuleExports, modulePath))
    : allModuleExports.length <= 1
      ? allModuleExports
      : allModuleExports.filter((name) => name !== 'default');

  const {outputFiles: [{text}]} = await buildFile(modulePath);
  const additionalTestData = typeof data === 'function' ? await data() : data;

  const createItFn = function(isCreateTestAsync) {
    return function(opts) {
      return isCreateTestAsync ? itFnAsync(opts): itFn(opts);
    };
  };

  const describeFn = `describe('${path.basename(modulePath)} component', function () {
      ${exportNames.map((exportName) => createItFn(isCreateTestAsync)({exportName, name, createTest, additionalTestData, modulePath, modulePublicUrl})).join('\n')}
    });`;

  const {code} = await transformFile(`
    ${text}
    ${describeFn}
  `, virtualFilePath, path.extname(modulePath));


  return code;
};