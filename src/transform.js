const path = require('path');
const getVirtualFilePath = require('./getVirtualFilePath.js');
const {buildFile, transformFile, findExportNamesIn} = require('./esbuild.js');

const itFnAsync = function({name, exportName, createTest, onlyConditionFn = function() {}, modulePath, additionalTestData, modulePublicUrl}, argv) {
  return `
      
      it${addOnly(onlyConditionFn, {name, exportName, modulePath, modulePublicUrl}, argv)}('${typeof name === 'string' ? name : name(exportName)}', async function (browser) {
        const test = await Promise.resolve((${createTest.toString()})({
          data: ${JSON.stringify({exportName, modulePath, ...additionalTestData})},
          publicUrl: "${modulePublicUrl}",
          modulePath: "${modulePath}",
          exportName: "${exportName}",
        }));
        
        const element = await Promise.resolve(test(browser));
        const data = element === null || element === undefined ? {} : {component: element};
        
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

const addOnly = function(conditionFn, options, argv) {
  return conditionFn(options, argv) ? '.only': '';
};

const itFn = function({name, exportName, createTest, modulePath, onlyConditionFn = function() {}, additionalTestData, modulePublicUrl}, argv) {
  return `
    
    it${addOnly(onlyConditionFn, {name, exportName, modulePath, modulePublicUrl}, argv)}('${typeof name === 'string' ? name : name(exportName)}', function (browser) {
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
 * @param {Object} argv
 * @param {Object} nightwatch_settings
 */
module.exports = async function (modulePath, {name, data, exports, createTest, transformCode, onlyConditionFn}, {
  argv = {}, nightwatch_settings = {}
}) {
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
      : allModuleExports.filter((innerName) => innerName !== 'default');

  const result = await buildFile(modulePath, nightwatch_settings.esbuild || {});
  const {outputFiles: [{text}]} = result;

  const testItems = exportNames.map((exportName) => {
    const additionalTestData = data(exportName);
    const opts = {
      exportName, name, createTest, additionalTestData, modulePath, onlyConditionFn, modulePublicUrl
    };

    return isCreateTestAsync ? itFnAsync(opts, argv): itFn(opts, argv);
  });

  const describeFn = `describe('${path.basename(modulePath)} component', function () {
    let componentDefault;
    try {
     componentDefault = ${path.basename(modulePath, path.extname(modulePath)).replace(/\./g, '_')}_default;
           
     if (typeof componentDefault.before == 'function') {
       before(componentDefault.before); 
     }
     if (typeof componentDefault.beforeEach == 'function') {
       beforeEach(componentDefault.beforeEach);
     }
     if (typeof componentDefault.afterEach == 'function') {
       afterEach(componentDefault.afterEach);
     }
     if (typeof componentDefault.after == 'function') {
       after(componentDefault.after);
     }
    } catch (err) {
      console.error('Error:', err);
    }
          
      ${testItems.join('\n')}
    });
    `;

  const {code} = await transformFile(`
    ${text}
    ${describeFn}
  `, virtualFilePath, path.extname(modulePath));


  return transformCode(code);
};