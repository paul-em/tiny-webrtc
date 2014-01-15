var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

gulp.task('default', function(){
  gulp.src('./lib/*.js')
    .pipe(concat('tiny-webrtc.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));

  gulp.src('./lib/*.js')
    .pipe(concat('tiny-webrtc.js'))
    .pipe(gulp.dest('./dist'));
});