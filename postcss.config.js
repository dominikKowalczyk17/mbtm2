module.exports = ({ options }) => ({
  plugins: {
    'autoprefixer': options.mode === 'production' ? options.autoprefixer || {} : false,
    'cssnano': options.mode === 'production' ? options.cssnano || {} : false
  }
});
