let projectFolder = require('path').basename(__dirname); // присвоить имя папки, в которой находимся
let sourceFolder = 'src';

let fs = require('fs');

let path = {
    build: { // куда галп выгрузит файлы
        html: projectFolder + '/',
        css: projectFolder + '/css/',
        js: projectFolder + '/js/',
        img: projectFolder + '/img/',
        fonts: projectFolder + '/fonts/',
    },
    src: {
        html: [sourceFolder  + '/*.html', '!' + sourceFolder  + '/_*.html'], // после запятой идёт исключения для файлов, которые не нужно добавлять в dist
        css: sourceFolder  + '/scss/styles.scss',
        js: sourceFolder  + '/js/script.js',
        img: sourceFolder  + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
        fonts: sourceFolder  + '/fonts/**.ttf',
    },
    watch: {
        html: sourceFolder  + '/**/*.html',
        css: sourceFolder  + '/scss/**/*.scss',
        js: sourceFolder  + '/js/**/*.js',
        img: sourceFolder  + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    },
    clean: './' + projectFolder + '/' //удаление папки каждый раз при запуске галпа

}

let {src,dest} = require('gulp'),
    gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    fileInclude = require('gulp-file-include'),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    groupMedia = require('gulp-group-css-media-queries'), // группирует медиазапросы
    cleanCss = require('gulp-clean-css'), // минифицирует и чистит файлы сss
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imageMin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webpHtml = require('gulp-webp-html'), // сам добавляет webp рядом с img в верстку
    webpcss = require('gulp-webpcss'), // webpCss = require('gulp-webp-css') // интегрирует webp в css
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'); // конвертирует шрифты


function browserSyncron(params) {
    browserSync.init({
        server: {
            baseDir:'./' + projectFolder + '/'
        },
        port: 3000,
        notify: false // отключает уведомление о перезагрузке браузера
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHtml())
        .pipe(dest(path.build.html)) // пайп это функция, в которой мы пишем команды для галпа
        .pipe(browserSync.stream());
}

function css() {
    return src(path.src.css)// пайп это функция, в которой мы пишем команды для галпа
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            groupMedia()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 versions'], // какие браузеры поддерживать
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css)) // создается обычный css
        .pipe(
            cleanCss() // ужимается css
        )
        .pipe(
            rename({
                extname: '.min.css'  // переименовывается ужатый css
            })
        )
        .pipe(dest(path.build.css)) // еще раз создается обычный css
        .pipe(browserSync.stream())
}

 function js() {
     return src(path.src.js)
         .pipe(fileInclude())
         .pipe(dest(path.build.js)) // пайп это функция, в которой мы пишем команды для галпа
         .pipe(
             uglify() // ужимает js
         )
         .pipe(
             rename({
                 extname: '.min.js'  // переименовывается ужатый css
             })
         )
         .pipe(dest(path.build.js)) // пайп это функция, в которой мы пишем команды для галпа
         .pipe(browserSync.stream());
 }


 function images() {
     return src(path.src.img)
         .pipe(
             webp({
                quality: 70
             })
         )
         .pipe(dest(path.build.img)) // пайп это функция, в которой мы пишем команды для галпа
         .pipe(src(path.src.img))
         .pipe(
             imageMin({
                 progressive: true,
                 svgoPlugins: [{ removeViewBox : false}],
                 interlaced: true,
                 optimizationLevel: 3 // как сильно сжимать изображение
             })
         )
         .pipe(dest(path.build.img)) // пайп это функция, в которой мы пишем команды для галпа
         .pipe(browserSync.stream());
 }

 function fontsStyle(params) {

     let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
     if (file_content === '') {
         fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
         return fs.readdir(path.build.fonts, function (err, items) {
             if (items) {
                 let c_fontname;
                 for (var i = 0; i < items.length; i++) {
                     let fontname = items[i].split('.');
                     fontname = fontname[0];
                     if (c_fontname !== fontname) {
                         fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                     }
                     c_fontname = fontname;
                 }
             }
         })
     }
 }

 function cb() { }


 gulp.task('otf2ttf', function () {
     return src([sourceFolder + '/fonts/*.otf'])
         .pipe(fonter({
             formats: ['ttf']
         }))
         .pipe(dest(sourceFolder + '/fonts/'));

 })

 function fonts() {
   src(path.src.fonts)
         .pipe(ttf2woff())
         .pipe(dest(path.build.fonts))
     return src(path.src.fonts)
         .pipe(ttf2woff2())
         .pipe(dest(path.build.fonts))
 }


function watchFiles(params) {
    gulp.watch([path.watch.html], html) //следим за файлами html, и обрабатываем их функцией html
    gulp.watch([path.watch.css], css) //следим за файлами css, и обрабатываем их функцией css
    gulp.watch([path.watch.js], js ) //следим за файлами css, и обрабатываем их функцией css
    gulp.watch([path.watch.img], images ) //следим за файлами css, и обрабатываем их функцией css

}

function clean(params) {
    return del(path.clean)
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build,watchFiles,browserSyncron);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;