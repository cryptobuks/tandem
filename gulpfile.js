var gulp     = require('gulp');
var mocha    = require('gulp-mocha');
var karma    = require('karma');
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');

var args = require('yargs').argv;
var runTimestamp = Math.round(Date.now()/1000);

var mochaOptions = {
  timeout: 1000
};

var paths = {
  testFiles: ['packages/**/*-test.js'],
  allFiles: ['packages/**/*.js']
};

gulp.task('test', function(complete) {
  new karma.Server({
    configFile: __dirname + '/karma.config.js',
    singleRun: !args.watch,
    reporters: [args.reporter || 'dots'],
    client: {
      mocha: {
        grep: args.only || args.grep
      }
    }
  }, complete).start();
});

gulp.task('icons', function(complete) {
  return gulp.src(['src/editor/svg-icons/*.svg'])
    .pipe(iconfont({
      fontName: 'iconfont',
      appendUnicode: true,
      formats: ['ttf', 'eot', 'woff'],
      timestamp: runTimestamp
    }))
      .on('glyphs', function(glyphs, options) {
        gulp.src('src/editor/svg-icons/iconfonts.scss')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: 'iconfont',
          fontPath: './',
          className: 's'
        }))
        .pipe(gulp.dest('src/editor/scss'));
      })
    .pipe(gulp.dest('src/editor/scss/'));
});

gulp.doneCallback = function() {
  if (!args.watch) process.exit();
}
