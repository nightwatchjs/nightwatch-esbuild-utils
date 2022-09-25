const path = require('path');
const assert = require('assert');
const {transform, run} = require('../index.js');

describe('transform tests', function() {
  it('test basic jsx transform validation error', async function() {
    let err;
    try {
      await transform(path.join(__dirname, 'data/Button.stories.jsx'), {
        name: function(exportName) {
          return `exported ${exportName}`;
        }
      });
    } catch (e) {
      err = e;
    }

    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, 'createTest function must be defined.');
  });

  it('test basic jsx transform', async function() {
    const text = await transform(path.join(__dirname, 'data/Button.stories.jsx'), {
      name(exportName) {
        return `exported ${exportName}`;
      },

      createTest: function () {
        return function(browser) {
          browser.init();
        };
      }
    });

    const itBlocks = /it\(\n.+\n/g;
    const matches = text.match(itBlocks);

    assert.strictEqual(matches.length, 4);
    assert.ok(/describe\("Button\.stories\.jsx component", function\(\) {/.test(text));
console.log(text)
    assert.ok(text.includes(`it(
    "exported Primary",
    function(browser) {
      const test = function() {
        return function(browser2) {
          browser2.init();
        };
      }({
        data: { "exportName": "Primary", "modulePath": "/Users/andrei/workspace/nightwatch-esbuild-transform/test/data/Button.stories.jsx" },
        publicUrl: "/test/data/Button.stories.jsx",
        modulePath: "/Users/andrei/workspace/nightwatch-esbuild-transform/test/data/Button.stories.jsx",
        exportName: "Primary"
      });
      const result = test(browser);
      const data = result === null || result === void 0 ? {} : result;
      const component = Primary;
      if (component.test) {
        return component.test(browser, data);
      }
    }
  );`));
  });

  it('test basic jsx transform with async createTest', async function() {
    const text = await transform(path.join(__dirname, 'data/Button.stories.jsx'), {
      name(exportName) {
        return `exported ${exportName}`;
      },

      createTest: async function () {
        return function(browser) {
          browser.init();
        };
      }
    });

    const itBlocks = /it\(\n.+\n/g;
    const matches = text.match(itBlocks);

    assert.strictEqual(matches.length, 4);
    assert.ok(/describe\("Button\.stories\.jsx component", function\(\) {/.test(text));
    console.log(text)
    assert.ok(text.includes(`it(
    "exported Primary",
    async function(browser) {
      const test = await Promise.resolve(async function() {
        return function(browser2) {
          browser2.init();
        };
      }({
        data: { "exportName": "Primary", "modulePath": "/Users/andrei/workspace/nightwatch-esbuild-transform/test/data/Button.stories.jsx" },
        publicUrl: "/test/data/Button.stories.jsx",
        modulePath: "/Users/andrei/workspace/nightwatch-esbuild-transform/test/data/Button.stories.jsx",
        exportName: "Primary"
      }));
      const result = await Promise.resolve(test(browser));
      const data = result === null || result === void 0 ? {} : result;
      const component = Primary;
      if (component.test) {
        await Promise.resolve(component.test(browser, data));
      }
    }
  );`));
  });

  it('test basic jsx execute', async function() {
    const result = await run(path.join(__dirname, 'data/Button.stories.jsx'), {
      name(exportName) {
        return `exported ${exportName}`;
      },

      createTest: function({exportName, data}) {
        return function(done) {
          done();
        };
      }
    });

    assert.strictEqual(result.title, 'Example/Button');

  });
});