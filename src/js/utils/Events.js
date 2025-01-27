/**
 * Events - event listeners store & emitter
 * @author Piotr Chrobak
 * 
 * List of defined emitters:
 *  |---------------------------------------
 *  | groupName | eventName | description 
 *  |-----------+-----------+---------------
 *  | DOM       | change    | trigger when elements are added to DOM. Its reinit Time, LazyLoad, REF
 *  |-----------+-----------+---------------
 *  | Layout    | change    | trigger when layout changed eg when something is added to DOM and height of page was change. Its reinit StickyAside
 *  |-----------+-----------+---------------
 *  |           |           | 
 * 
 * Use cases:
 * 
 *  To add listener for specific element:
 *  const scrollFn = event => { console.log('scroll') }
 *  Events.on(window, 'scroll', scrollFn);
 * 
 *  To remove specific listener for specific element:
 *  Events.off(window, 'scroll', scrollFn);
 * 
 *  To remove all listeners of 'scroll' type for specific element:
 *  Events.off(window, 'scroll');
 * 
 *  ---
 * 
 *  To add custom listener for event emitter:
 *  Events.on('groupName', 'eventName', scrollFn);
 * 
 *  To emit custom listener for event emitter:
 *  Events.emit('groupName', 'eventName', {custom: 'data'});
 */

class StoreEvents {
  constructor () {
    this.store = [];
  }

  add = map => {
    let find = this.filter(map);
    if (!find) {
      find = {
        target: map.target,
        useCapture: map.useCapture,
        types: {}
      };

      this.store.push(find);
    }

    find.types[map.type] = find.types[map.type] || {
      listeners: [],
      handler: map.handler
    };

    find.types[map.type].listeners.push(map.listener);
  }

  remove = map => {
    let find = this.filter(map);
    if (find) {
      const removed = find.types[map.type];

      if (removed) {
        const listeners = removed.listeners;
        if (map.listener) {
          const id = listeners.indexOf(map.listener);
          if (id !== -1) {
            listeners.splice(id, 1);
          }
        } else {
          listeners.length = 0;
        }
      }

      return removed;
    }
  }

  clear = map => {
    let find = this.filter(map);

    find.types[map.type] = null;
  }

  filter = map => {
    return this.store.filter(({target, useCapture}) => {
      return map.target === target && JSON.stringify(map.useCapture) == JSON.stringify(useCapture);
    })[0];
  }

  get = map => {
    const find = this.filter(map);

    if (find) {
      return find.types[map.type];
    }
  }
}

class EventsClass {
  constructor () {
    if (!EventsClass.instance) {
      this.store = new StoreEvents();
      EventsClass.instance = this;
    }

    return EventsClass.instance;
  }

  handler = map => {
    return (...event) => {
      this.store.get(map).listeners.forEach(fn => {
        fn.call(map.target, ...event);
      });
    };
  }

  on = (target, type, listener, useCapture = false) => {
    type.split(' ').forEach(type => {
      const map = {
        target,
        type,
        listener,
        useCapture
      };
  
      if (!this.store.get(map)) {
        map.handler = this.handler(map);
        if(typeof target !== 'string') {
          target.addEventListener(type, map.handler, useCapture);
        }
      }
  
      this.store.add(map);
    });
  }

  off = (target, type, listener, useCapture = false) => {
    type.split(' ').forEach(type => {
      const map = {
        target,
        type,
        listener,
        useCapture
      };

      const removed = this.store.remove(map);
      if (removed && removed.listeners.length === 0) {
        if(typeof target !== 'string') {
          target.removeEventListener(type, removed.handler, useCapture);
        }
        this.store.clear(map);
      }
    });
  }

  one = (target, type, listener, useCapture = false) => {
    const self = this;
    const orgListener = listener;

    listener = function () {
      orgListener.apply(this, arguments);
      self.off(target, type, listener, useCapture);
    };

    this.on(target, type, listener, useCapture)
  }

  emit = (target, type, ...event) => {
    const map = {
      target,
      type,
      useCapture: false
    };

    const get = this.store.get(map);
    if (get) {
      get.handler(...event);
    } else {
      try {
        this.trigger(target, type);
      } catch (e) { }
    }
  }

  trigger = (target, type) => {
    if ('createEvent' in document) {
      const ev = document.createEvent('HTMLEvents');
      ev.initEvent(type, true, true);
      target.dispatchEvent(ev);
    } else {
      target.fireEvent(`on${type}`);
    }
  }
}

const Events = new EventsClass();
Object.freeze(Events);

export default Events;
