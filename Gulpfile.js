var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');

gulp.task('default', function(){
  gulp.src('./lib/*.js')
    .pipe(concat('tiny-webrtc.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));

  gulp.src('./lib/*.js')
    .pipe(concat('tiny-webrtc.js'))
    .pipe(gulp.dest('./dist'));


});

gulp.task('watch', function(){
  gulp.watch('./lib/*.js', function(){
    gulp.run('default');
  })
});