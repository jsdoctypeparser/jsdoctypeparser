'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const Parser = require('../lib/parsing.js');

const Fixtures = {
  TYPESCRIPT: readFixtureSync('erring-typescript-types'),
};

describe('Parser', function() {
  it('should throw errors when parsing erring tests/fixtures/*', function() {
    Object.keys(Fixtures).forEach(function(fixtureName) {
      Fixtures[fixtureName].forEach(function({skip, typeExprStr, position}) {
        if (skip) return;

        let parsed;
        try {
          parsed = Parser.parse(typeExprStr);
        }
        catch (e) {
          return;
        }

        const debugMessage = util.format('Should have erred parsing %s at %s:%d; instead parsed as:\n\n%s',
                                       typeExprStr,
                                       position.filePath,
                                       position.lineno,
                                       JSON.stringify(parsed, null,2));

        throw new Error(debugMessage);
      });
    });
  });
});


function readFixtureSync(fileName) {
  const filePath = path.resolve(__dirname, 'fixtures', fileName);

  return fs.readFileSync(filePath, 'utf8')
    .trim()
    .split(/\n/)
    .map(function(line, lineIdx) {
      return {
        // When the line starts with "//", we should skip it.
        skip: /^\/\//.test(line),

        typeExprStr: line.trim().replace(/^\{(.*)\}$/, '$1').replace(/\\n/g, '\n'),
        position: {
          filePath,
          lineno: lineIdx + 1,
        },
      };
    });
}
