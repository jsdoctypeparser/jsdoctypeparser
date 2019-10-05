'use strict';

const util = require('util');
const Parser = require('../lib/parsing.js');
const {readFixtureSync} = require('./utils.js');

/** @type {{[fixtureName: string]: import('./utils').Fixture}} */
const Fixtures = {
  TYPESCRIPT: readFixtureSync('erring-typescript-types'),
};

describe('Parser', function() {
  it('should throw errors when parsing erring tests/fixtures/*', function() {
    Object.keys(Fixtures).forEach(function(fixtureName) {
      const fixture = Fixtures[fixtureName];
      fixture.forEach(function({skip, typeExprStr, position}) {
        if (skip) return;

        let parsed;
        try {
          parsed = Parser.parse(typeExprStr);
        }
        catch (e) {
          return;
        }

        const debugMessage = util.format(
          'Should have erred parsing %s at %s:%d; instead parsed as:\n\n%s',
          typeExprStr.replace(/\n/g, '\\n'),
          fixture.filePath,
          position.lineno,
          JSON.stringify(parsed, null, 2)
        );

        throw new Error(debugMessage);
      });
    });
  });
});
