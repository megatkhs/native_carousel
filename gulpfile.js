'use strict';
const gulp = require('gulp')

/**
 * Pug
 */
const pug = require('gulp-pug')　// Pugコンパイル

/**
 * Sass
 */
const sass = require('gulp-sass') // Sassコンパイル
const plz = require('gulp-pleeease') // 諸々やってくれる

/**
 * JavaScript
 */
const concat = require('gulp-concat') // ファイル結合

/**
 * utility
 */
const fs = require('fs') // ファイルシステム
const path = require('path') // パス
const data = require('gulp-data') // データを取得
const connect = require('gulp-connect') // サーバーを立てる
const notify = require('gulp-notify') // 通知をする
const plumber = require('gulp-plumber') // エラーが発生したときに実行
const changed = require('gulp-changed') // 変更されたファイルだけを対象にする
const cached = require('gulp-cached') // 差分だけを処理する
const rename = require('gulp-rename') // リネームする

/**
 * Path
 * 見通しが悪いオブジェクト
 */
const paths = {
  root: {
    src: './src/',
    dir: './dist/'
  },
  pug: {
    src: ['./src/**/*.pug', '!./src/**/_*.pug'],
    dir: './dist/',
    json: './src/_data/'
  },
  sass: {
    src: './src/sass/**/*.scss',
    dir: './dist/assets/css/'
  },
  js: {
    src: './src/js/*.js',
    dir: './dist/assets/js/',
    vender: {
      src: './src/js/vender/*.js',
      dir: './dist/assets/js/vender/*.js'
    }
  },
  image: {
    src: './src/img/**/*',
    dir: './dist/assets/img/'
  }
}

/**
 * option
 */
const options = {
  server: {
    root: paths.root.dir, // ルートディレクトリを指定
    livereload: true // ライブリロードを有効化
  },
  sass: {
    outputStyle: 'expanded'
  },
  plz: { // pleeease
    // autoprefixer: { // プレフィックス付与
    //   browsers: ['>= 1%', 'last 2 versions', 'Firefox ESR'],
    //   cascade: true
    // },
    minifier: true, // ファイル圧縮
    mqpacker: true // メディアクエリをまとめる
    // sourcemaps: true // ソースマップ生成
  },
  rename: {
    css: {
      suffix: '.min' // 付与する名前
    },
    js: {
      suffix: '.min' // 付与する名前
    }
  },
  concat: 'main.js' // ファイル名
}

/**
 * task
 */
// server task
gulp.task('run_srv', () => {
  connect.server(options.server) // サーバー起動
})

// pug task
gulp.task('pug', () => {
  // ルート相対パスを格納
  let locals = {
    site: JSON.parse(fs.readFileSync(paths.pug.json + 'site.json'))
  }
  gulp.src(paths.pug.src)
    .pipe(plumber({ // エラー対処
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(data(file => {
      locals.relativePath = path.relative(file.base, file.path.replace(/.pug$/, '.html'))
      return locals
    }))
    .pipe(pug({
      locals: locals, // JSONとルート相対パスを指定
      basedir: 'src', // ルートディレクトリを指定
      pretty: true
    })) // コンパイル
    .pipe(gulp.dest(paths.pug.dir)) // 吐き出し
    .pipe(connect.reload()) // ブラウザリロード
})

// sass task
gulp.task('sass', () => {
  gulp.src(paths.sass.src)
    // .pipe(changed('sass')) // キャッシュ名
    .pipe(plumber({ // エラー対処
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(sass(options.sass)) // コンパイル
    .pipe(gulp.dest(paths.sass.dir)) // 吐き出し
    .pipe(plz(options.plz)) // 諸処理をこなしてくれる
    .pipe(rename(options.rename.css)) // リネーム
    .pipe(gulp.dest(paths.sass.dir)) // 吐き出し
    .pipe(connect.reload()) // ブラウザリロード
})

// img task
gulp.task('img', () => {
  gulp.src(paths.image.src)
    .pipe(changed(paths.image.dir)) // 更新分を振り分け
    .pipe(gulp.dest(paths.image.dir)) // 吐き出し
})

// js task
gulp.task('js', () => {
  gulp.src(paths.js.src)
    // .pipe(cached('js')) // キャッシュ名
    .pipe(plumber({ // エラー対処
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(concat('main.js')) // くっ付ける
    .pipe(gulp.dest(paths.js.dir)) // 吐き出す
    .pipe(connect.reload()) // ブラウザリロード
})

// watch task
gulp.task('watch', () => {
  gulp.watch(paths.pug.src, ['pug']) // pugを監視
  gulp.watch(paths.sass.src, ['sass']) // sassを監視
  gulp.watch(paths.js.src, ['js']) // jsを監視
  gulp.watch(paths.image.src, ['img']) // 画像を監視
})

// default task
gulp.task('default', ['run_srv', 'watch'])

// build task
gulp.task('build', ['pug', 'sass', 'js', 'img'])