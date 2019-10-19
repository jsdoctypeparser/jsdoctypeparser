'use strict';

const util = require('util');
const {parse} = require('../lib/parsing.js');
const {readFixtureSync} = require('./utils.js');

/** @type {{[fixtureName: string]: import('./utils').Fixture}} */
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
      fixture.forEach(function({skip, typeExprStr, position}) {
        if (skip) return;

        try {
          parse(typeExprStr);
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
