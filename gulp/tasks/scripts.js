'use strict';
const gulp = require('gulp');
const when = require('gulp-if');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const newer = require('gulp-newer');
const rename = require('gulp-rename');
const size = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const gzip = require('gulp-gzip');
const rev = require('gulp-rev');
const argv = require('yargs').argv;

// 'gulp scripts' -- creates a index.js file from your JavaScript files and
// creates a Sourcemap for it
// 'gulp scripts --prod' -- creates a index.js file from your JavaScript files,
// minifies, gzips and cache busts it. Does not create a Sourcemap
gulp.task('scripts', () =>
  // NOTE: The order here is important since it's concatenated in order from
  // top to bottom, so you want vendor scripts etc on top
  gulp.src([
    'bower_components/moment/min/moment-with-locales.js',
    'bower_components/moment-timezone/builds/moment-timezone-with-data.js',
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/foundation-sites/dist/foundation.min.js',
    'src/assets/javascript/vendor.js',
    'src/assets/javascript/main.js'
  ])
    .pipe(newer('.tmp/assets/javascript/index.js', {dest: '.tmp/assets/javascript', ext: '.js'}))
    .pipe(when(!argv.prod, sourcemaps.init()))
    .pipe(babel({
      presets: ['es2015-script']
    }))
    .pipe(concat('index.js'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(when(argv.prod, rename({suffix: '.min'})))
    .pipe(when(argv.prod, when('*.js', uglify({preserveComments: 'some'}))))
    .pipe(when(argv.prod, size({
      showFiles: true
    })))
    .pipe(when(argv.prod, rev()))
    .pipe(when(!argv.prod, sourcemaps.write('.')))
    .pipe(when(argv.prod, gulp.dest('.tmp/assets/javascript')))
    .pipe(when(argv.prod, when('*.js', gzip({append: true}))))
    .pipe(when(argv.prod, size({
      gzip: true,
      showFiles: true
    })))
    .pipe(gulp.dest('.tmp/assets/javascript'))
);
