const gulp = require('gulp');
const clean = require('gulp-clean');
const polymerRename = require('polymer-rename');
const fileRename = require('gulp-rename');
const closureCompiler = require('google-closure-compiler').gulp();
const vulcanize = require('gulp-vulcanize');

function extractDataBindingExpressions(fileIn) {
  let stream = gulp.src(fileIn) // Usually this will be the vulcanized file
    .pipe(polymerRename.extract())
    .pipe(fileRename(function(filePath) {
      filePath.basename += '.template';
  }))
  .pipe(gulp.dest('./'));
  
  return stream;
}
gulp.task('extract-data-binding-expressions-test', ['vulcanize-test'], function() {
  return extractDataBindingExpressions('./build/paper-dropdown-menu-test-vulcanized.html');
});
gulp.task('extract-data-binding-expressions', ['vulcanize'], function() {
  return extractDataBindingExpressions('./build/paper-dropdown-menu-vulcanized.html');
});

function vulcanizeIt(fileIn, fileOut) {
  // BUGBUG: Depends on soft link paper-dropdown-menu set up in the bower_components folder
  let stream = gulp.src(fileIn)
  .pipe(vulcanize({
    abspath: ''
  }))
  .pipe(fileRename(fileOut))
  .pipe(gulp.dest('build'));
  
  return stream;
}
gulp.task('vulcanize-test', ['update-html-template'], function() {
  return vulcanizeIt('bower_components/paper-dropdown-menu/test/paper-dropdown-menu.html', 'paper-dropdown-menu-test-vulcanized.html');
});
gulp.task('vulcanize', ['clean'], function() {
  return vulcanizeIt('bower_components/paper-dropdown-menu/paper-dropdown-menu.html', 'paper-dropdown-menu-vulcanized.html');
});

function compileJS(fileIn, fileOut) {
  let stream = closureCompiler({
    js: fileIn,
    js_output_file: fileOut,
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
}
gulp.task('compile-js-test', ['extract-data-binding-expressions-test'], function() {
  return compileJS('./build/paper-dropdown-menu-test-vulcanized.template.js', 'paper-dropdown-menu-test-vulcanized.compiled.js');
});
gulp.task('compile-js', ['extract-data-binding-expressions'], function() {
  return compileJS('./build/paper-dropdown-menu-vulcanized.template.js', 'paper-dropdown-menu-vulcanized.compiled.js');
});

function updateHtmlTemplate(fileIn, fileOut) {
  let stream = gulp.src(fileIn) // Usually this will be the vulcanized file
  .pipe(polymerRename.replace(fileOut))
  .pipe(gulp.dest('./build'));
  
  return stream;
}
gulp.task('update-html-template-test', ['compile-js-test'], function() {
  return updateHtmlTemplate('./build/paper-dropdown-menu-test-vulcanized.html', './build/paper-dropdown-menu-test-vulcanized.compiled.js');
});
gulp.task('update-html-template', ['compile-js'], function() {
  return updateHtmlTemplate('./build/paper-dropdown-menu-vulcanized.html', './build/paper-dropdown-menu-vulcanized.compiled.js');
});

gulp.task('clean', function() {
  let stream = gulp.src('./build', {read: false})
  .pipe(clean());
  
  return stream;
});

gulp.task(
  'build', 
  [
    'clean', 
    'vulcanize', 
    'extract-data-binding-expressions', 
    'compile-js', 
    'update-html-template',
    'vulcanize-test', 
    'extract-data-binding-expressions-test', 
    'compile-js-test', 
    'update-html-template-test'
  ]);

gulp.task('default', function() {
  console.log('gulp commands this project supports:\n');
  console.log('  gulp build (builds a Closure Compiled version of paper-dropdown-menu.html)');
  console.log('  gulp clean (removes the build folder)');
  console.log('\n');
});