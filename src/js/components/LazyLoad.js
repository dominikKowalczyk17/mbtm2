/**
 * Lazy Load - class to lazy load images & iframes using Intersection Observer
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import placeholder from '../../gfx/placeholder.png';

class LazyLoad {
  constructor (parent = document) {
    const elements = parent.querySelectorAll('.lazy-load');

    this.elements = Array.from(elements).filter(el => !el.LazyLoad);
    this.config = {
      rootMargin: '50% 0px'
    };

    Events.on(document.body, 'load', this.handleStateChange, true);
    Events.on(document.body, 'error', this.handleStateChange, true);

    this.init();
  }

  init = () => {
    if (!('IntersectionObserver' in window)) {
      Array.from(this.elements).forEach(this.preloadElement);
    } else if (this.elements.length) {
      this.observer = new IntersectionObserver(this.onIntersection, this.config);
      this.elements.forEach(el => {
        this.observer.observe(el);
        el.LazyLoad = true;
      });
    } else {
      this.disconnect();
    }
  }

  preloadElement = el => {
    el.LazyLoadLoading = true;

    ['srcset', 'src'].forEach(attr => {
      const data = el.dataset[attr];
      
      if (data) {
        requestAnimationFrame(() => {
          el[attr] = data;
          delete el.dataset[attr];
        });
      }
    });
  }

  disconnect = () => {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    Events.off(document.body, 'load', this.handleStateChange, true);
    Events.off(document.body, 'error', this.handleStateChange, true);
  }

  onIntersection = entries => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        this.observer.unobserve(entry.target);
        this.preloadElement(entry.target);
      }
    });
  }

  handleStateChange = event => {
    if (event.target.LazyLoadLoading) {
      const id = this.elements.indexOf(event.target);
      if (id !== -1) {
        this.elements.splice(id, 1);

        event.target.classList.add('lazy-load--loaded');
        delete event.target.LazyLoadLoading;

        if (this.elements.length === 0) {
          this.disconnect();
        }
      }

      if (event.type === 'error') {
        if (event.target.srcset) event.target.srcset = '';
        event.target.src = placeholder;
      }
    }
  }
}

Events.on('DOM', 'change', container => {
  new LazyLoad(container);
});

export default LazyLoad;
