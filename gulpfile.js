const gulp = require('gulp');
const clean = require('gulp-clean');
const polymerRename = require('polymer-rename');
const fileRename = require('gulp-rename');
const closureCompiler = require('google-closure-compiler').gulp();
const vulcanize = require('gulp-vulcanize');

gulp.task('extract-data-binding-expressions', ['vulcanize'], function() {
  let stream = gulp.src('./build/paper-dropdown-menu-test-vulcanized.html') // Usually this will be the vulcanized file
    .pipe(polymerRename.extract())
    .pipe(fileRename(function(filePath) {
      filePath.basename += '.template';
  }))
  .pipe(gulp.dest('./'));
  
  return stream;
});

gulp.task('vulcanize', ['clean'], function() {
  // BUGBUG: Depends on soft link paper-dropdown-menu set up in the bower_components folder
  let stream = gulp.src('bower_components/paper-dropdown-menu/test/paper-dropdown-menu.html')
  .pipe(vulcanize({
    abspath: ''
  }))
  .pipe(fileRename('paper-dropdown-menu-test-vulcanized.html'))
  .pipe(gulp.dest('build'));
  
  return stream;
});

gulp.task('compile-js', ['extract-data-binding-expressions'], function() {
  let stream = closureCompiler({
    js: './build/paper-dropdown-menu-test-vulcanized.template.js',
    js_output_file: 'paper-dropdown-menu-test-vulcanized.compiled.js',
    compilation_level: 'ADVANCED',
    warning_level: 'VERBOSE',
    polymer_pass: true,
    externs: [
      require.resolve('google-closure-compiler/contrib/externs/polymer-1.0.js'),
      require.resolve('polymer-rename/polymer-rename-externs.js')
    ]
  })
  .src()
  .pipe(gulp.dest('./build'));
  
  return stream;
});

gulp.task('update-html-template', ['compile-js'], function() {
  let stream = gulp.src('./build/paper-dropdown-menu-test-vulcanized.html') // Usually this will be the vulcanized file
  .pipe(polymerRename.replace('./build/paper-dropdown-menu-test-vulcanized.compiled.js'))
  .pipe(gulp.dest('./build'));
  
  return stream;
});

gulp.task('clean', function() {
  let stream = gulp.src('./build', {read: false})
  .pipe(clean());
  
  return stream;
});

gulp.task('build', ['clean', 'extract-data-binding-expressions', 'compile-js', 'update-html-template']);

gulp.task('default', function() {
  console.log('gulp commands this project supports:\n');
  console.log('  gulp build (builds a Closure Compiled version of paper-dropdown-menu.html)');
  console.log('  gulp clean (removes the build folder)');
  console.log('\n');
});