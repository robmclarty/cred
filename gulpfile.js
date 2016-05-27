'use strict';

const gulp = require('gulp');
const argv = require('yargs').argv;
const requireDir = require('require-dir');

// Require all tasks.
requireDir('./tasks', { resurse: true });

function setProductionEnv(done) {
  process.env.NODE_ENV = 'production';
  done();
};

function watch() {
  gulp.watch('server/**/*', gulp.series('server'));
}
gulp.task(watch);

gulp.task('default', gulp.series('server', watch));
