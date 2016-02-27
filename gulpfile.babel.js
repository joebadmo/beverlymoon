import _ from 'lodash';
import autoprefixer from 'gulp-autoprefixer';
import gulp from 'gulp';
import gulpSequence from 'gulp-sequence';
import gutil from 'gulp-util';
import gulpJade from 'gulp-jade';
import jade from 'jade';
import less from 'gulp-less';
import minifyHTML from 'gulp-minify-html';
import mkdirp from 'mkdirp';
import path from 'path';
import plumber from 'gulp-plumber';
import rimraf from 'rimraf';
import webpack from 'webpack';
import webpackConfig from './webpack.config.js';
import config from './config.json';
import express from 'express';
import imageop from 'gulp-image-optimization';

const SRC_DIR = path.join(__dirname, 'src');
const CLIENT_SRC_DIR = path.join(SRC_DIR, 'client');
const SERVER_SRC_DIR = path.join(SRC_DIR, 'server');

const BUILD_DIR = 'public';
const CSS_BUILD_DIR = path.join(BUILD_DIR, 'css');
const IMG_BUILD_DIR = path.join(BUILD_DIR, 'img');

const env = process.env.NODE_ENV || 'dev';
const compiler = webpack(webpackConfig);

gulp.task('dev', gulpSequence('clean', 'build:client', 'watch', 'serve'));

gulp.task('serve', () => {
  const app = express();
  app.use(express.static('public'));
  app.get('*', (req, res) => {
    res.send(jade.compileFile(path.join(SERVER_SRC_DIR, 'index.jade'))(config.dev.urls));
  });
  app.listen(3000, 'localhost', err => {
    if (err) {
      return console.log(err);
    }
    console.log('Listening at http://localhost:3000');
  });
});

gulp.task('build:prod', ['build:server:html', 'build:client']);

gulp.task('build:client', ['build:client:js', 'build:client:css', 'build:client:img']);

gulp.task('build:client:js', cb => {
  compiler.run((err, stats) => {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    const errorString = stats.toString({
      hash: false,
      version: false,
      timings: false,
      assets: false,
      chunks: false,
      chunkModules: false,
      modules: false,
      cached: false,
      reasons: false,
      source: false,
      chunkOrigins: false,
      modulesSort: false,
      chunksSort: false,
      assetsSort: false
    });
    if (!_.isEmpty(errorString)) {
      gutil.log('[webpack]', errorString);
    }
    cb();
  });
});

gulp.task('build:client:css', () => {
  mkdirp.sync(path.join(CSS_BUILD_DIR));
  return gulp.src(path.join(CLIENT_SRC_DIR, 'styles.less'))
  .pipe(plumber())
  .pipe(less({
    paths: [path.join(__dirname, 'less', 'includes')]
  }))
  .pipe(autoprefixer({
    browsers: ['last 2 versions']
  }))
  .pipe(gulp.dest(CSS_BUILD_DIR));
});

gulp.task('build:client:img', cb => {
  gulp.src([path.join(CLIENT_SRC_DIR, 'img', '**/*.jpg')]).pipe(imageop({
    optimizationLevel: 5,
    progressive: true,
    interlaced: true
  })).pipe(gulp.dest(IMG_BUILD_DIR)).on('end', cb).on('error', cb);
});


gulp.task('build:server:html', () => {
  return gulp.src(path.join(SERVER_SRC_DIR, 'index.jade'))
  .pipe(gulpJade({ locals: config[env].urls }))
  .pipe(plumber())
  .pipe(minifyHTML())
  .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('clean', cb => rimraf(path.join(BUILD_DIR, '**/*'), cb));

gulp.task('watch', () => {
  gulp.watch(path.join(CLIENT_SRC_DIR, '**/*.js*'), ['build:client:js']);
  gulp.watch(path.join(CLIENT_SRC_DIR, '**/*.less'), ['build:client:css']);
});
