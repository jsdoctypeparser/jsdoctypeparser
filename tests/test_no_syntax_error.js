'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const Parser = require('../lib/parsing.js');

/**
 * @typedef {object} FixtureEntry
 * @property {boolean} skip
 * @property {string} typeExprStr
 * @property {FilePosition} position
 *
 * @typedef {object} FilePosition
 * @property {string} fileName
 * @property {string} lineno
 *
 * @typedef {{fileName: string, filePath: string} & FixtureEntry[]} Fixture
 */

/** @type {{[fixtureName: string]: Fixture}} */
const Fixtures = {
  CATHARSIS: readFixtureSync('catharsis-types'),
  CLOSURE_LIBRARY: readFixtureSync('closure-library-types'),
  JSDOC3: readFixtureSync('jsdoc-types'),
  JSDUCK: readFixtureSync('jsduck-types'),
  TYPESCRIPT: readFixtureSync('typescript-types'),
};

describe('Parser', function() {
  Object.keys(Fixtures).forEach(function(fixtureName) {
    const fixture = Fixtures[fixtureName];
    it(`should not throw any errors when parsing ${fixture.filePath}`, function() {
      /** @type {Error[]} */
      let errors = [];
      fixture.forEach(function({skip, typeExprStr, position}) {
        if (skip) return;

        try {
          Parser.parse(typeExprStr);
        }
        catch (e) {
          const debugMessage = util.format(
            'parsing %s at %s:%d\n\n%s',
            typeExprStr.replace(/\n/g, '\\n'),
            fixture.filePath,
            position.lineno,
            e.stack
          );

          throw new Error(debugMessage);
        }
      });
    });
  });
});

/**
 * @param {string} fileName
 * @return {Fixture}
 */
function readFixtureSync(fileName) {
  const filePath = path.resolve(__dirname, 'fixtures', fileName);

  /** @type {any} */
  let result = fs.readFileSync(filePath, 'utf8')
    .trim()
    .split(/\n/)
    .map(function(line, lineIdx) {
      return {
        // When the line starts with "//", we should skip it.
        skip: /^\/\//.test(line),

        typeExprStr: line.trim().replace(/^\{(.*)\}$/, '$1').replace(/\\n/g, '\n'),
        position: {
          fileName,
          lineno: lineIdx + 1,
        },
      };
    });

  Object.defineProperties(result, {
    fileName: {
      value: fileName,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    filePath: {
      value: path.relative(process.cwd(), filePath),
      writable: true,
      enumerable: false,
      configurable: true,
    },
  });
  return result;
}
