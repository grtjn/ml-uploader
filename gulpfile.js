/*jshint node: true */

'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
//    html2Js = require('gulp-ng-html2js'),
    jshint = require('gulp-jshint'),
    karma = require('karma'),
    less = require('gulp-less'),
//    minifyHtml = require('gulp-minify-html'),
    path = require('path'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    rm = require('gulp-rm'),
    ghpages = require('gulp-gh-pages'),
    cp = require('child_process');

gulp.task('jshint', function() {
  gulp.src([
      './gulpfile.js',
      './src/**/*.js',
      './sample/**/*.js',
      './test/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', ['test'], function() {
  return gulp.src([
      './src/ml-uploader.js',
      './src/**/*.service.js',
      './src/**/*.directive.js',
      './src/**/*.js'
    ])
    .pipe(concat('ml-uploader.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-uploader.min.js'))
    .pipe(uglify({mangle: false}))
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {
  return gulp.src('./src/styles/*.less')
    .pipe(concat('ml-uploader.less'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-uploader.css'))
    .pipe(less())
    .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
  var server = new karma.Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
  server.start();
});

gulp.task('autotest', function() {
  var server = new karma.Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
  server.start();
});

gulp.task('docs', function() {
  cp.exec('./node_modules/.bin/jsdoc -c jsdoc.conf.json', function(err) {
    if (err) {
      return console.log(err);
    }

    gulp.src([ './docs/generated/css/baseline.css', './docs/custom-styles.css' ])
    .pipe(concat('baseline.css'))
    .pipe(gulp.dest('./docs/generated/css'));
  });
});

gulp.task('clean-docs', function() {
  return gulp.src('./docs/generated/**/*', { read: false })
  .pipe(rm({async: false}));
});

gulp.task('publish-docs', function() {
  return gulp.src([ './docs/generated/**/*.*' ])
  .pipe(ghpages());
});

gulp.task('default', ['jshint', 'scripts', 'styles']);