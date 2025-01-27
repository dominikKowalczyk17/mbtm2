module.exports = env => {
  const PACKAGE = require('./package.json'),
        fs = require('fs'),
        path = require('path'),
        webpack = require('webpack'),
        CleanWebpackPlugin = require('clean-webpack-plugin'),
        HtmlWebpackPlugin = require('html-webpack-plugin'),
        MiniCssExtractPlugin = require('mini-css-extract-plugin'),
        ProgressBarPlugin = require('progress-bar-webpack-plugin'),
        BrowserSyncPlugin = require('browser-sync-webpack-plugin'),
        CopyWebpackPlugin = require('copy-webpack-plugin'),
        WebpackAssetsManifest = require('webpack-assets-manifest'),
        ImageminPlugin = require('imagemin-webpack-plugin').default,
        imageminMozjpeg = require('imagemin-mozjpeg');

  const isDir = path => {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
  };

  const NODE_ENV = env && env.NODE_ENV || 'development';
  const dir = {
    production: '.builds/build',
    development: 'dev',
  }[NODE_ENV];
  const WATCH_MODE = process.argv.indexOf('--watch') !== -1;
  const DEV_SERVER = process.argv[1].indexOf('webpack-dev-server') !== -1;

  const { name: PORTAL, version: VERSION } = PACKAGE;
  if (!PORTAL) {
    console.log('\x1b[41m%s\x1b[0m',
      '\nNie została zdefiniowana nazwa projektu, przez co nie można określić folderu do którego projekt ma być budowany!' +
      '\nUzupełnij package.json > parametr `name`\n'
    );
    return;
  }

  const PORTAL_PATH = path.resolve(__dirname, '..', PORTAL);
  if (!DEV_SERVER && !isDir(PORTAL_PATH)) {
    console.log('\x1b[41m%s\x1b[0m', `\nZdefiniowany katalog (${PORTAL}) nieistniej!\nNależy go najpierw utworzyć.\n`);
    return;
  }

  const ASSET_PATH = (portal => {
    const dirPath = '/templates/';
    const dirName = __dirname.includes(dirPath) && __dirname.split(dirPath).pop();

    return !DEV_SERVER && dirName ? path.join('/templates', portal, dir.split('/').pop(), '/') : '/';
  })(PORTAL);

  const isProd = NODE_ENV === 'production';
  const cacheBusting = false;

  const envToExport = {
    NODE_ENV: JSON.stringify(NODE_ENV),
    PORTAL: JSON.stringify(PORTAL),
    VERSION: JSON.stringify(VERSION),
  };

  const miniCssExtractPlugin = new MiniCssExtractPlugin({
    filename: cacheBusting && NODE_ENV === 'production' ? '[name].[contenthash:5].css' : '[name].css',
    chunkFilename: 'css/[name].[contenthash:5].css'
  });
  const imageLoaderOpts = {
    mozjpeg: {
      enabled: false,
      progressive: true,
      quality: 90,
    },
    pngquant: {
      quality: '90-100',
      speed: 4,
    },
    gifsicle: {
      interlaced: true,
    },
    svgo: {
      plugins: [
        {
          removeViewBox: false
        },
      ]
    },
  };
  const imageLoaders = [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[hash:5].[ext]',
      },
    },
    {
      loader: 'image-webpack-loader',
      options:
        {
          ...imageLoaderOpts,
          optipng: { enabled: false },
        },
    },
  ];

  function recursiveIssuer(m) {
    if (m.issuer) {
      return recursiveIssuer(m.issuer);
    } else if (m.name) {
      return m.name;
    } else {
      return false;
    }
  }

  const entries = {
    'js/app': ['core-js/fn/promise', './js/index.js'],
  };
  const cacheGroups = {};

  [
    {
      name: 'css/style',
      path: './css/index.scss',
    },
  ].forEach(entryPoint => {
    entries[entryPoint.name] = entryPoint.path;
    cacheGroups[entryPoint.name] = {
      name: entryPoint.name,
      test: (m, c, entry = entryPoint.name) => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
      chunks: 'all',
      enforce: true
    };
  });

  let config = {
    mode: NODE_ENV,

    context: path.resolve(__dirname, 'src'),

    entry: entries,

    optimization: {
      splitChunks: {
        cacheGroups: cacheGroups
      }
    },

    output: {
      path: path.resolve(PORTAL_PATH, dir),
      filename: cacheBusting && NODE_ENV === 'production' ? '[name].[contenthash:5].js' : '[name].js',
      chunkFilename: 'js/[name].[contenthash:5].js',
      publicPath: ASSET_PATH,
    },

    devtool: !isProd ? 'source-map' : false,

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: { loader: 'babel-loader' },
        },

        //{ test: /\.html$/, use: ['html-loader'] },

        {
          test: /\.(sa|sc|c)ss$/,
          include: [path.resolve(__dirname, 'src')],
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isProd,
              },
            },
            'svg-transform-loader/encode-query',
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: !isProd,
                config: {
                  ctx: { mode: NODE_ENV }
                }
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !isProd,
                data: Object.keys(envToExport).reduce((p, n) => p + `$${n}: ${envToExport[n]};`, ''),
              },
            },
          ],
        },

        {
          test: /\.(jpg|png|gif)$/,
          use: imageLoaders,
        },

        {
          test: /\.svg(\?.*)?$/,
          use: [...imageLoaders, 'svg-transform-loader'],
        },

        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].[hash:5].[ext]',
              },
            },
          ],
        },
      ],
    },
  };

  const html = isProd
    ? []
    : [
      'index',
      'feed.ajax',
      'news',
      'news-video',
      'video',
      'quiz',
      'poll',
      'poll.ajax',
      'sponsors',
      'sponsor',
      'vote',
      'konkurs',
      'ankieta',
      'regulamin',
      'juror',
      'participant',
      'status-bar',
      'social-component'
    ].map(
      item =>
        new HtmlWebpackPlugin({
          template: `${item}.html`,
          filename: `${item}.html`,
          inject: item.indexOf('ajax') === -1,
          templateParameters: function (compilation, assets, options) {
            return {
              publicPath: assets.publicPath,
            };
          },
        })
    );

  const clean =
    DEV_SERVER || !isProd
      ? []
      : [
        new CleanWebpackPlugin([path.resolve(PORTAL_PATH, dir)], {
          root: path.resolve(PORTAL_PATH),
        }),
      ];

  const commons = [
    ...isProd ? [new WebpackAssetsManifest()] : [],

    new webpack.DefinePlugin({
      'process.env': envToExport,
    }),

    new ProgressBarPlugin({
      format: '\u001b[90m\u001b[44mBuild\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m\r',
      renderThrottle: 100,
      summary: false,
      clear: true
    }),

    ...clean,

    ...html,

    miniCssExtractPlugin,

    new CopyWebpackPlugin([
      { from: 'static', to: 'static' },
      { from: 'gfx', to: 'gfx' },
      ...(!isProd ? [
        { from: '*.json', to: '.' },
      ] : []),
    ]),

    new ImageminPlugin({
      ...imageLoaderOpts,
      disable: !isProd,
      test: /\.(jpe?g|png|gif|svg)$/i,
      jpegtran: null,
      plugins: imageLoaderOpts.mozjpeg.enabled ? [imageminMozjpeg(imageLoaderOpts.mozjpeg)] : [],
    }),
  ];

  config = Object.assign(
    config,
    DEV_SERVER
      ? {
        plugins: [
          new webpack.HotModuleReplacementPlugin(),

          ...commons,

          new BrowserSyncPlugin(
            {
              open: false,
              host: 'localhost',
              port: 3000,
              proxy: 'http://localhost:8080/',
              // tunnel: PORTAL,
              files: [path.join('src', '*.html')],
              ghostMode: false,
            },
            {
              reload: true,
            }
          ),
        ],
        watch: true,
        devServer: {
          publicPath: '/',
          hot: true,
          setup: function (app) {
            const multer = require('multer');
            const upload = multer();
            const bodyParser = require('body-parser');

            app.use(bodyParser.urlencoded({ extended: true }));
            app.all('/icm/', upload.any(), function (req, res) {
              eval(fs.readFileSync('src/js/ICM.js').toString());
            });
          }
        },
      }
      : {
        plugins: [...commons],
        watch: WATCH_MODE,
      }
  );

  return config;
};
