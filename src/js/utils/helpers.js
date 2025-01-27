import Events from './Events';

/**
 * @author Piotr Chrobak
 */

export const getScrollTop = (target = window) => {
  return target !== window
    ? target.scrollTop
    : ('pageYOffset' in window)
      ? window.pageYOffset
      : window.document.documentElement.scrollTop;
};

export const getScrollLeft = (target = window) => {
  return target !== window
    ? target.scrollLeft
    : ('pageXOffset' in window)
      ? window.pageXOffset
      : window.document.documentElement.scrollLeft;
};

export const getWindowWidth = () => {
  return window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
};

export const getWindowHeight = () => {
  return window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;
};

export const getScrollHeight = () => {
  return document.documentElement.scrollHeight - getWindowHeight();
};

export const getOffset = el  => {
  const rect = el.getBoundingClientRect();
  const sTop = getScrollTop();
  const sLeft = getScrollLeft();
  return {
    top: rect.top + sTop,
    right: rect.right + sLeft,
    bottom: rect.bottom + sTop,
    left: rect.left + sLeft,
  };
};

export const isElementInViewport = (el, { allEdges = false }) => {
  const rect = el.getBoundingClientRect();
  let vertInView;
  let horInView;

  if (allEdges) {
    vertInView = rect.top >= 0 && rect.bottom <= getWindowHeight();
    horInView = rect.left >= 0 && rect.right <= getWindowWidth();
  } else {
    vertInView = rect.top <= getWindowHeight() && (rect.top + rect.height) >= 0;
    horInView = rect.left <= getWindowWidth() && (rect.left + rect.width) >= 0;
  }

  return vertInView && horInView;
};

export const passiveListener = (function() {
  let passive = false;

  try {
    const obj = Object.defineProperty({}, 'passive', {
      get: function () {
        passive = { passive: true };
      }
    });
    window.addEventListener('test', null, obj);
  } catch (e) {
    // void
  }

  return passive;
})();

export const transitionEndEvent = (function() {
  let t,
      el = document.createElement('p'),
      transition = {
        transition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        oTransition: 'oTransitionEnd',
      };

  for (t in transition) {
    if (el.style[t] !== undefined) {
      return transition[t];
    }
  }
  return false;
})();

export const debounce = (action, wait = 150, force = false) => {
  let timeout = null;
  return function () {
    const args = arguments;
    if (!force) clearTimeout(timeout);
    timeout = setTimeout(() => {
      action.apply(this, args);
    }, wait);
  };
};

export const throttle = (action, delay) => {
  if (delay) {
    let isThrottled = false, args, context;

    const wrapper = function () {
      if (isThrottled) {
        args = arguments;
        context = this;
        return;
      }

      isThrottled = true;
      action.apply(this, arguments);
      
      setTimeout(() => {
        isThrottled = false;
        if (args) {
          wrapper.apply(context, args);
          args = context = null;
        }
      }, delay);
    };

    return wrapper;
  } else {
    let isRunning = false;
    return function () {
      if (isRunning) return;
      isRunning = true;
      window.requestAnimationFrame(() => {
        action.apply(this, arguments);
        isRunning = false;
      });
    };
  }
};

export const fetchStatus = (response) => {
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response;
};

export const delegate = (criteria, listener) => {
  // zakładam, że jesli string to podany zostal querySelector
  if (typeof criteria === 'string') {
    const query = criteria;
    criteria = el => el.matches && el.matches(query);
  }

  return function (event) {
    var el = event.target;
    do {
      if (!criteria(el)) continue;
      event.delegateTarget = el;
      listener.apply(this, arguments);
      return;
    } while (event.currentTarget.contains(el) && (el = el.parentNode));
  };
};

export const urlContains = (...args) => {
  for (let i = 0, search; (search = args[i++]); ) {
    if (window.location.pathname.indexOf(search) !== -1) {
      return true;
    }
  }

  return false;
};

export const nextUntil = (el, selector) => {
  const siblings = [];

  el = el.nextElementSibling;

  while (el) {
    if (selector && el.matches(selector)) break;

    siblings.push(el);
    el = el.nextElementSibling;
  }

  return siblings;
};

export const insertBefore = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
};

export const insertAfter = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

export const removeEl = (node) => {
  return node && node.parentNode
    ? node.parentNode.removeChild(node)
    : null;
};

export const createEl = (tagName = 'div', className = '', children = '') => {
  const el = document.createElement(tagName);

  if (className !== '') {
    el.className = className;
  }

  if (children.length > 0) {
    if (typeof children === 'string') {
      children = [children];
    }

    children.forEach(node => {
      if (typeof node === 'string') {
        el.insertAdjacentHTML('beforeend', node);
      } else if (typeof node === 'object') {
        el.appendChild(node);
      }
    });
  }

  return el;
};

export const evalScripts = container => {
  try {
    Array.from(container.querySelectorAll('script')).forEach(script => {
      if (!script.type || script.type === 'text/javascript') {
        const data = script.text || script.textContent || script.innerHTML || '';

        if (!script.src) {
          window.eval(data);
        } else {
          const el = document.createElement('script');
          for (let i = 0, l = script.attributes.length; i < l; i++) {
            const attr = script.attributes[i];
            el.setAttribute(attr.name, attr.value);
          }

          try {
            el.appendChild(document.createTextNode(data));      
          } catch(e) {
            el.text = data;
          }

          const parent = script.parentNode;
          parent.insertBefore(el, script);
          parent.removeChild(script);
        }
      }
    });
  } catch(e) { }
};

export const setHTML = (container, html) => {
  return new Promise(resolve => {
    container.innerHTML = html;

    evalScripts(container);

    Events.emit('DOM', 'change', container);

    resolve(container);
  });
};

export const initSocialPlugins = container => {
  requestIdleCallback(() => {
    try { window.FB.XFBML.parse(container) } catch (e) { }
    try { window.twttr.widgets.load(container) } catch (e) { }
    try { window.instgrm.Embeds.process() } catch (e) { }
    try { window.gapi.post.go(container) } catch (e) { }

    Events.emit('Layout', 'change');
  });
};

export const parseSearchParams = (url = document.location.search) => {
  const search = url.split('?').pop().replace(/\+/g, ' ');
  const result = {};

  search.split('&').forEach(param => {
    const [key, ...val] = param.split('=');

    if (key) {
      result[decodeURIComponent(key)] = val.length
        ? decodeURIComponent(val.join('='))
        : null;
    }
  });

  return result;
};

export const prepareSearchParams = (params) => {
  return Object.keys(params).map(key => (
    encodeURIComponent(key) + '=' + encodeURIComponent(params[key] || '')
  )).join('&');
};

export const htmlToDom = html => {
  return Promise.resolve()
    .then(() => {
      const doc = document.implementation.createHTMLDocument('');
      doc.documentElement.innerHTML = html;
      return doc;
    })
    .catch(() => {
      const parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    });
};

let isScrollIntoViewOptionsSupported = 'scrollBehavior' in document.documentElement.style;
export const scrollIntoView = (element, opts) => {
  if (isScrollIntoViewOptionsSupported) {
    element.scrollIntoView(opts);
  } else {
    let config = null;
    if (typeof opts === 'boolean') {
      config = opts;
    } else if (typeof opts === 'object') {
      config = opts.block === 'start' ? true : opts.block === 'end' ? false : null;
    }

    element.scrollIntoView(config);
  }
};

export const delay = time => value => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

export const deg2rad = (a) => {
  return a * (Math.PI / 180);
};

export const haversine = (f, j, h, d) => {
  var c = deg2rad(h - f),
      g = deg2rad(d - j),
      b = Math.sin(c / 2) * Math.sin(c / 2) + Math.cos(deg2rad(f)) * Math.cos(deg2rad(h)) * Math.sin(g / 2) * Math.sin(g / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(b), Math.sqrt(1 - b)));
};

export const isValidDate = date => {
  return date instanceof Date && !isNaN(date);
};
