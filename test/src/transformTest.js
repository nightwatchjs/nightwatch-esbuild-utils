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

  it('test basic jsx transform', async function() {
    const text = await transform(path.join(__dirname, '../data/Button.stories.jsx'), {
      name(exportName) {
        return `exported ${exportName}`;
      },

      createTest: function () {
        return function(browser) {
          browser.init();
        };
      }
    });

    // const itBlocks = /it\(\n.+\n/g;
    const itBlocks = /it\("exported [a-zA-Z]+", function\(browser\) {\n/g;
    const matches = text.match(itBlocks);

    assert.ok(!!matches, 'There are no matches for the "it" regex');
    assert.strictEqual(matches.length, 4);
    assert.ok(/describe\("Button\.stories\.jsx component", function\(\) {/.test(text));


    const textToMatch = `it("exported Primary", function(browser) {
    const test = function() {
      return function(browser2) {
        browser2.init();
      };
    }({
      data: { "exportName": "Primary", "modulePath": "${path.join(__dirname, '../data/Button.stories.jsx')}" },
      publicUrl: "/test/data/Button.stories.jsx",
      modulePath: "${path.join(__dirname, '../data/Button.stories.jsx')}",
      exportName: "Primary"
    });
    const result = test(browser);
    const data = result === null || result === void 0 ? {} : result;
    const component = module.exports["Primary"];

    if (component && component.test) {
      return component.test(browser, data);
    }
  });`;

    assert.ok(text.includes(textToMatch));
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
      }
    });

    const itBlocks = /it\(\n.+\n/g;
    const matches = text.match(itBlocks);

    assert.strictEqual(matches.length, 4);
    assert.ok(/describe\("Button\.stories\.jsx component", function\(\) {/.test(text));

    const textToMatch = `it(
    "exported Primary",
    async function(browser) {
      const test = await Promise.resolve(async function() {
        return function(browser2) {
          browser2.init();
        };
      }({
        data: { "exportName": "Primary", "modulePath": "${path.join(__dirname, '../data/Button.stories.jsx')}" },
        publicUrl: "/test/data/Button.stories.jsx",
        modulePath: "${path.join(__dirname, '../data/Button.stories.jsx')}",
        exportName: "Primary"
      }));
      const mountResult = await Promise.resolve(test(browser));
      const data = mountResult || {};
      const component = module.exports["Primary"];
      if (data.beforeMountError) {
        console.error(data.beforeMountError.message);
      }
      if (component && component.test) {
        await Promise.resolve(component.test(browser, data));
      }
      if (data.afterMountError) {
        console.error(data.afterMountError.message);
      }
    }
  );`;

    const describeBlock = `describe("Button.stories.jsx component", function() {
  let componentDefault;
  let cdpConnection;
  this.desiredCapabilities.pageLoadStrategy = "eager";
  this.skipTestcasesOnFail = false;
  let testNamespace;
  try {
    componentDefault = module.exports.default;
    if (componentDefault && componentDefault.test) {
      testNamespace = componentDefault.test;
    }
    before(async function(browser) {
      if (testNamespace && typeof testNamespace.before == "function") {
        await testNamespace.before(browser);
      }
    });
    if (testNamespace && typeof testNamespace.beforeEach == "function") {
      beforeEach(testNamespace.beforeEach);
    }
    if (testNamespace && typeof testNamespace.afterEach == "function") {
      afterEach(testNamespace.afterEach);
    }
    after(async function(browser) {
      if (testNamespace && typeof testNamespace.after == "function") {
        after(testNamespace.after);
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }`;

    assert.ok(text.includes(textToMatch));
    assert.ok(text.includes(describeBlock));
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