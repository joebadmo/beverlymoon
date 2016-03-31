import _ from 'lodash';
import LessPluginCleanCSS from 'less-plugin-clean-css';
import gulp from 'gulp';
import gulpSequence from 'gulp-sequence';
import gutil from 'gulp-util';
import gulpJade from 'gulp-jade';
import less from 'gulp-less';
import LessAutoprefix from 'less-plugin-autoprefix';
import minifyHTML from 'gulp-minify-html';
import mkdirp from 'mkdirp';
import path from 'path';
import plumber from 'gulp-plumber';
import rimraf from 'rimraf';
import webpack from 'webpack';
import webpackConfig from './webpack.config.js';
import WebpackDevServer from 'webpack-dev-server';
import config from './config.json';
import ImageMin from 'imagemin';

const SRC_DIR = path.join(__dirname, 'src');
const CLIENT_SRC_DIR = path.join(SRC_DIR, 'client');
const SERVER_SRC_DIR = path.join(SRC_DIR, 'server');

const BUILD_DIR = 'public';
const CSS_BUILD_DIR = path.join(BUILD_DIR, 'css');
const IMG_BUILD_DIR = path.join(BUILD_DIR, 'img');
const HOST = '192.168.1.85';
// const HOST = 'localhost';
const PORT = 9999;

const {
  env: {
    NODE_ENV: env = 'dev'
  }
} = process;

const compiler = webpack(_.assign({}, webpackConfig, {
  entry: {
    app: [
      `webpack-dev-server/client?http://${HOST}:${PORT}/`,
      'webpack/hot/dev-server'
    ].concat(webpackConfig.entry.app)
  }
}));

gulp.task('dev', gulpSequence('clean', ['build:server:html', 'build:client:img', 'build:client:css'], 'serve'));

gulp.task('serve', () => {

  const server = new WebpackDevServer(compiler, {
    contentBase: 'public/',
    hot: true,
    historyApiFallback: true,
    quiet: false,
    noInfo: true,
    lazy: false,
    filename: 'app.js',
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: '/',
    stats: { colors: true }
  });

  server.listen(PORT, HOST, err => {
    if (err) { return console.log(err); }
    console.log(`Listening at http://${HOST}:${PORT}`);
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

const autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });
const cleanCSSPlugin = new LessPluginCleanCSS({advanced: true});

gulp.task('build:client:css', () => {
  mkdirp.sync(path.join(CSS_BUILD_DIR));
  const l = less({
    plugins: [autoprefix, cleanCSSPlugin]
  });
  l.on('error', e => {
    gutil.log(e.message);
    l.emit('end');
  });
  return gulp.src([path.join(CLIENT_SRC_DIR, 'styles.less')])
  .pipe(l)
  .pipe(gulp.dest(CSS_BUILD_DIR));
});

gulp.task('build:client:img', cb => {
  new ImageMin()
  .src(path.join(CLIENT_SRC_DIR, 'img', '**/*.{jpg,svg,png}'))
  .use(ImageMin.jpegtran({
    optimizationLevel: 5,
    progressive: true,
    interlaced: true
  }))
  .use(ImageMin.svgo())
  .dest(IMG_BUILD_DIR)
  .run(cb);
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
