const path = require('path');
const assert = require('assert');
const {transform, run} = require('../../index.js');

describe('transform tests', function() {
  it('test basic jsx transform validation error', async function() {
    let err;
    try {
      await transform(path.join(__dirname, '../data/Button.stories.jsx'), {
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

  it('test basic jsx transform with async createTest', async function() {
    const text = await transform(path.join(__dirname, '../data/Button.stories.jsx'), {
      name(exportName) {
        return `exported ${exportName}`;
      },

      createTest: async function () {
        return function(browser) {
          browser.init();
        };
      },
      data() {
        return {
          id: 'test-id',
          name: 'test-name'
        };
      }
    }, {metadata: {id: 'test-id'}});

    const itBlocks = /it\(\n.+\n/g;
    const matches = text.match(itBlocks);

    assert.strictEqual(matches.length, 4);
    assert.ok(/module\.exports\.default && module\.exports\.default\.title \? module\.exports\.default\.title : "Button\.stories\.jsx component", function\(\) {/.test(text));

    const textToMatch = `it(
    "exported Primary",
    async function(browser) {
      const componentDefault2 = module.exports["default"];
      if (componentDefault2 && componentDefault2.preRender) {
        try {
          await componentDefault2.preRender(browser, {
            id: "test-id",
            name: "Primary",
            title: "test-name"
          });
        } catch (err) {
          const error = new Error(' preRender test hook threw an error for "test-name" story:');
          error.detailedErr = err.stack;
          error.stack = err.stack;
          throw error;
        }
      }
      const component = module.exports["Primary"];
      const test = await Promise.resolve(async function() {
        return function(browser2) {
          browser2.init();
        };
      }({
        data: { "exportName": "Primary", "modulePath": "${path.join(__dirname, '../data/Button.stories.jsx')}", "id": "test-id", "name": "test-name" },
        publicUrl: "/test/data/Button.stories.jsx",
        modulePath: "${path.join(__dirname, '../data/Button.stories.jsx')}",
        exportName: "Primary"
      }));
      const mountResult = await Promise.resolve(test(browser));
      const data = mountResult || {};
      if (data.preRenderError) {
        console.error(data.preRenderError.message);
      }
      if (component && component.test) {
        if (data.component instanceof Error) {
          throw data.component;
        } else {
          await Promise.resolve(component.test(browser, data));
        }
      }
      if (data.postRenderError) {
        console.error(data.postRenderError.message);
      }
      if (componentDefault2 && componentDefault2.postRender) {
        try {
          await componentDefault2.postRender(browser, {
            id: "test-id",
            name: "Primary",
            title: "test-name"
          });
        } catch (err) {
          const error = new Error(' postRender test hook threw an error for "test-name" story:');
          error.detailedErr = err.stack;
          error.stack = err.stack;
          throw error;
        }
      }
    }        
  );`;

    const describeBlock = `describe(module.exports.default && module.exports.default.title ? module.exports.default.title : "Button.stories.jsx component", function() {
  let componentDefault;
  let cdpConnection;
  this.desiredCapabilities.pageLoadStrategy = "eager";
  this.skipTestcasesOnFail = false;
  let testNamespace;
  try {
    componentDefault = module.exports.default;
    if (componentDefault && componentDefault.parameters) {
      testNamespace = componentDefault.parameters;
    }
    before(async function(browser) {
      if (componentDefault && componentDefault.setup) {
        try {
          await componentDefault.setup(browser);
        } catch (err) {
          const error = new Error(" setup test hook threw an error:");
          error.detailedErr = err.stack;
          error.stack = err.stack;
          throw error;
        }
      }
    });
    if (testNamespace && typeof testNamespace.beforeEach == "function") {
      beforeEach(testNamespace.beforeEach);
    }
    if (testNamespace && typeof testNamespace.afterEach == "function") {
      afterEach(testNamespace.afterEach);
    }
    after(async function(browser) {
      if (componentDefault && componentDefault.teardown) {
        try {
          await componentDefault.teardown(browser);
        } catch (err) {
          const error = new Error(" teardown test hook threw an error:");
          error.detailedErr = err.stack;
          error.stack = err.stack;
          throw error;
        }
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
  `;
    const processed = text.replace(/\\u25BA/g, '').replace(/\s+/g, '');
    assert.ok(processed.includes(textToMatch.replace(/\s+/g, '')));
    assert.ok(processed.includes(describeBlock.replace(/\s+/g, '')));
  });

  xit('test basic jsx execute', async function() {
    const result = await run(path.join(__dirname, '../data/Button.stories.jsx'), {
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