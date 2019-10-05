const fs = require('fs');
const path = require('path');

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

exports.readFixtureSync = readFixtureSync;
