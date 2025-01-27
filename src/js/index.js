import './utils/polyfills';
import App from './App';

/**
 * Cut the mustard!
 * Future detect ES modules
 * if theres no noModule in script then load polyfills-lazy before init app
 * noModule determines ES modules support
 * https://caniuse.com/#feat=es6-module
 */
(function(run) {
  const ieEdge = document.documentMode || /Edge/.test(navigator.userAgent);
  if (!ieEdge && 'noModule' in document.createElement('script')) {
    run();
  } else {
    import('./utils/polyfills-lazy' /* webpackChunkName: 'polyfills-lazy' */).then(run);
  }
})(App);
