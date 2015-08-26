'use strict';

var gulp = require('gulp');
var watch = require('gulp-watch');
var peg = require('gulp-peg');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var debug = require('gulp-debug');

var PEG_FILES = 'peg_src/**/*.pegjs';
var COMPILED_PEG_FILE = 'peg_lib';

gulp.task('watch', function() {
  return gulp.src(PEG_FILES)
    .pipe(plumber())
    .pipe(watch(PEG_FILES))
    .pipe(peg().on('error', gutil.log))
    .pipe(debug({ title: 'Successfully done' }))
    .pipe(gulp.dest(COMPILED_PEG_FILE));
});

gulp.task('peg', function() {
  return gulp.src(PEG_FILES)
    .pipe(peg().on('error', gutil.log))
    .pipe(gulp.dest(COMPILED_PEG_FILE));
});

gulp.task('build', ['peg']);
