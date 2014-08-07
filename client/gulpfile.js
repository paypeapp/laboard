var gulp = require('gulp'),
    less = require('gulp-less'),
    watch = require('gulp-watch'),
    connect = require('gulp-connect'),
    concat = require('gulp-concat'),
    path = require('path'),
    prefix = require('gulp-autoprefixer');

gulp.task('font-awesome', function() {
    gulp.src('bower_components/font-awesome/fonts/*')
        .pipe(gulp.dest('public/assets/font'))
        .pipe(connect.reload());
});

gulp.task('bootstrap', function() {
    gulp.src('bower_components/bootstrap/fonts/*')
        .pipe(gulp.dest('public/assets/font'))
        .pipe(connect.reload());
});

var libs;
gulp.task('libs', function() {
    gulp.src(libs = [
        'bower_components/jquery/dist/jquery.js',
        'bower_components/lodash/dist/lodash.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-route/angular-route.js',
        'bower_components/angular-ui-router/release/angular-ui-router.js',
        'bower_components/restangular/dist/restangular.js',
        'bower_components/angular-gravatar/build/md5.js',
        'bower_components/angular-gravatar/build/angular-gravatar.js',
        'bower_components/angular-loading-bar/build/loading-bar.js',
        'bower_components/moment/moment.js',
        'bower_components/authenticateJS/build/authenticate.js',
        'bower_components/bootstrap/dist/js/bootstrap.js',
        'bower_components/angular-draggable/ngDraggable.js',
        'bower_components/angular-bootstrap/ui-bootstrap.js',
        'bower_components/angular-bootstrap/ui-bootstrap-tpls.js'
    ])
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('public/assets/js'));

    gulp.src([
        'bower_components/font-awesome-animation/dist/font-awesome-animation.css',
        'bower_components/angular-loading-bar/build/loading-bar.css'
    ])
        .pipe(gulp.dest('public/assets/styles'));
});

gulp.task('less', function() {
    gulp.src('src/less/main.less')
        .pipe(less())
        .pipe(prefix({ cascade: true }))
        .pipe(gulp.dest('public/assets/styles'))
        .pipe(connect.reload());
});

var js;
gulp.task('js', function() {
    gulp.src(js = ['src/js/**/*.js', '../config/client.js'])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('public/assets/js'))
        .pipe(connect.reload());
});

gulp.task('html', function() {
    gulp.src('src/**/*.html')
        .pipe(gulp.dest('public'))
        .pipe(connect.reload());
});

gulp.task('images', function() {
    gulp.src('src/images/**/*')
        .pipe(gulp.dest('public/assets/images'))
        .pipe(connect.reload());
});

gulp.task('vendor', ['font-awesome', 'bootstrap', 'libs']);
gulp.task('app', ['vendor', 'less', 'js', 'html', 'images']);

gulp.task('watch', ['server'], function() {
    var watched = {
        js: js,
        libs: libs,
        less: ['src/less/**/*.less'],
        'font-awesome': ['bower_components/font-awesome/fonts/*'],
        bootstrap: ['bower_components/bootstrap/fonts/*'],
        html: ['src/**/*.html'],
        images: ['src/images/**/*']
    };

    Object.keys(watched).forEach(function(key) {
        gulp.watch(watched[key], [key]);
    });
});

gulp.task('server', connect.server({
    root: [path.resolve('public')],
    port: 4242,
    livereload: true,
    middleware: function(connect, opt) {
        return [
            function(req, res, next) {
                require('../server/app.js').handle(req, res, next);
            }
        ]
    }
}));

gulp.task('default', ['app', 'watch']);
