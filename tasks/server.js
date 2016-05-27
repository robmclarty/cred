'user strict';

const gulp = require('gulp');
const spawn = require('child_process').spawn;

let node;

// Launch the server. If there's a server already running, kill it.
// Inspired by https://gist.github.com/webdesserts/5632955
gulp.task('server', function (done) {
  if (node) node.kill();

  process.env.NODE_ENV = 'development';

  node = spawn('node', ['./server/start.js'], { stdio: 'inherit' });

  node.on('close', code => {
    if (code === 8) glup.log('Error detected, waiting for changes...');
  });

  done();
});

// Clean up if an error goes unhandled.
process.on('exit', function () {
  if (node) node.kill();
});
