const gulp = require('gulp');
const clean = require('gulp-clean');
const polymerRename = require('polymer-rename');
const fileRename = require('gulp-rename');
const closureCompiler = require('google-closure-compiler').gulp();
const vulcanize = require('gulp-vulcanize');

/**
 * Runs the vulcanize tool over the input HTML file, creating a single
 * file containing all imports.
 * 
 * @param {String} fileIn Path to input file
 * @param {String} fileOut Path to output file
 */
function executeVulcanize(fileIn, fileOut) {
  let stream = gulp.src(fileIn)
  .pipe(vulcanize({
    abspath: ''
  }))
  .pipe(fileRename(fileOut))
  .pipe(gulp.dest('build'));
  
  return stream;
}
gulp.task('vulcanize-test', ['update-html-template'], function() {
  // BUGBUG: Depends on soft link paper-dropdown-menu set up in the bower_components folder
  // TODO: How do we set up the equivalent redirect per polymer-serve?
  return executeVulcanize('bower_components/paper-dropdown-menu/test/paper-dropdown-menu.html', 'paper-dropdown-menu-test-vulcanized.html');
});
gulp.task('vulcanize', ['clean'], function() {
  // BUGBUG: Depends on soft link paper-dropdown-menu set up in the bower_components folder
  // TODO: How do we set up the equivalent redirect per polymer-serve?
  return executeVulcanize('bower_components/paper-dropdown-menu/demo/index.html', 'demo-vulcanized.html');
});

/**
 * Runs polymer-rename over an HTML file, extracting data binding expressions
 * in preparation for the Closure Compiler pass. It will create an output
 * JavaScript file with a .template.js extension.
 * 
 * @param {String} fileIn Path to the input (typically vulcanized) HTML file
 */
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
  return extractDataBindingExpressions('./build/demo-vulcanized.html');
});

/**
 * Runs the Closure Compiler with advanced compilation level, including
 * externs for polymer and polymer-rename.
 * 
 * @param {String} fileIn Path to the extracted template.js file
 * @param {String} fileOut Path to the compiled JavaScript file
 */
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
  return compileJS('./build/demo-vulcanized.template.js', 'demo-vulcanized.compiled.js');
});

/**
 * Executes the second step of polymer-rename, updating a source HTML file with
 * the compiled Polymer data binding references.
 * 
 * @param {String} fileHtml Path to the source HTML file to be updated
 * @param {String} fileCompiled Path to the compiled Polymer data binding expressions
 */
function updateHtmlTemplate(fileHtml, fileCompiled) {
  let stream = gulp.src(fileHtml) // Usually this will be the vulcanized file
  .pipe(polymerRename.replace(fileCompiled))
  .pipe(gulp.dest('./build'));
  
  return stream;
}
gulp.task('update-html-template-test', ['compile-js-test'], function() {
  return updateHtmlTemplate('./build/paper-dropdown-menu-test-vulcanized.html', './build/paper-dropdown-menu-test-vulcanized.compiled.js');
});
gulp.task('update-html-template', ['compile-js'], function() {
  return updateHtmlTemplate('./build/demo-vulcanized.html', './build/demo-vulcanized.compiled.js');
});

/**
 * Removes the build directory
 */
gulp.task('clean', function() {
  let stream = gulp.src('./build', {read: false})
  .pipe(clean());
  
  return stream;
});

/**
 * Builds a compiled, vulcanized version of demo/index.html and the
 * polymer-dropdown-menu unit test.
 */
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