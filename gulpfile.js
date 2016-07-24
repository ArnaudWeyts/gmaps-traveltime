"use strict";

var gulp = require("gulp"),
rename = require("gulp-rename"),
browserify = require("browserify"),
source = require("vinyl-source-stream"),
buffer = require("vinyl-buffer"),
sourcemaps = require("gulp-sourcemaps"),
gutil = require("gulp-util"),
sass = require("gulp-sass"),
autoprefixer = require("gulp-autoprefixer"),
//purify = require("gulp-purifycss"),
cssnano = require("gulp-cssnano"),
uglify = require("gulp-uglify"),
browserSync = require("browser-sync").create();

var SRC = "./src";
var DEST = "./dist";

gulp.task("sass", function () {
    return gulp.src(SRC + "/sass/**/styles.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer({
        browsers: [">1%"],
        cascade: false
    }))
    //.pipe(purify([DEST + "/assets/js/**/*.js", DEST + "/*.html"]))
    .pipe(cssnano())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(DEST + "/assets/css/"))
    .pipe(browserSync.stream())
});

gulp.task("scripts", function() {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: SRC + "/js/scripts.js",
        debug: true
    });

    return b.bundle()
    .pipe(source("main.js"))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on("error", gutil.log)
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(DEST + "/assets/js/"));
});

gulp.task("browser-sync", () => {
    browserSync.init({
        server: {
            baseDir: DEST,
            index: "index.html"
        },
        notify: false
    });
});

gulp.task("copy", function () {
    gulp.src(SRC + "/fonts/*")
    .pipe(gulp.dest(DEST + "/assets/fonts"))
    gulp.src(SRC + "/index.html")
    .pipe(gulp.dest(DEST));
    gulp.src(SRC + "/distancematrix.php")
    .pipe(gulp.dest(DEST + "/assets/"));
    gulp.src(SRC + "/jquery-ui-theme-base/**/*")
    .pipe(gulp.dest(DEST + "/assets/jquery-ui-theme-base"));
});

gulp.task("watch", function () {
    gulp.watch(SRC + "/index.html", ["copy"]).on("change", browserSync.reload);
    gulp.watch(SRC + "/sass/**/*.scss", ["sass"]).on("change", browserSync.reload);
    gulp.watch(SRC + "/js/**/*.js", ["scripts"]).on("change", browserSync.reload);
});

gulp.task("default", ["watch", "copy", "scripts", "sass", "browser-sync"]);
gulp.task("compile", ["copy", "scripts", "sass"]);

