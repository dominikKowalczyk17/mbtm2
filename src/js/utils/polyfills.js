/*!
* Copyright 2015 Google Inc. All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing
* permissions and limitations under the License.
*/

/*
* @see https://developers.google.com/web/updates/2015/08/using-requestidlecallback
*/
window.requestIdleCallback = window.requestIdleCallback ||
  function (cb) {
    return setTimeout(function () {
      var start = Date.now();
      cb({ 
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };

window.cancelIdleCallback = window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

/**
 * Element.matches
 */
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

/**
 * Element.closest
 */
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    if (!document.documentElement.contains(el)) return null;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1); 
    return null;
  };
}
