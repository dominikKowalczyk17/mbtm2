import 'babel-polyfill/browser'; // https://babeljs.io/docs/en/next/babel-preset-env.html#usebuiltins
import 'airbnb-js-shims/target/es2015';
import 'airbnb-browser-shims/browser-only';
import 'formdata-polyfill';
import Events from './Events';
import objectFitImages from 'object-fit-images';

Events.on(window, 'load', () => {
  objectFitImages();
});

/**
 * fetch().finally workaround
 * https://github.com/zloirock/core-js/issues/178#issuecomment-192081350
 */
var _fetch = fetch;
window.fetch = (...args) => Promise.resolve(_fetch(...args));
