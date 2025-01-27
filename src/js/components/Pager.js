/**
 * Pager - more events fetcher
 * @author Piotr Chrobak
 */

import templateBuilder from '../utils/templateBuilder';
import { fetchStatus, setHTML } from '../utils/helpers';
import Events from '../utils/Events';

const Pager = (config = {
  selector: '.pager',
  target: '.pager__target',
  button: '.pager__button',
}) => {

  const els = Array.from(document.querySelectorAll(config.selector));
  const click = event => {
    const { target: eventTarget, currentTarget } = event;
    const elButton = currentTarget.querySelector(config.button);

    if (elButton && elButton.contains(eventTarget)) {
      const { pager, item, type = 'html', infinite } = currentTarget.dataset;
      const { url } = elButton.dataset;

      window.pagerStore = window.pagerStore || {};
      const stored = window.pagerStore[pager] || [];

      elButton.classList.add('is--loading');
      elButton.disabled = true;

      fetch(url)
        .then(fetchStatus)
        .then(response => {
          if (type === 'json' || response.headers.get('content-type').indexOf('application/json') !== -1) {
            return response.json().then(json => {
              const { items, button } = json;
              
              const isFullPage = currentTarget.classList.contains('news-list--full-page');
              const html = items.reduce((html, item, index) => {
                const id = (stored.length + index + 1) % 5; // co piaty element powinien dostac inne obrazki
                return html + templateBuilder(item, id, isFullPage);
              }, '');

              return `${html}${button}`;
            });
          } else {
            return response.text();
          }
        })
        .then(data => {
          let fragment = document.createDocumentFragment();
          let div = document.createElement('div');
          fragment.appendChild(div);
          setHTML(div, `${stored.join('')}${data}`);

          window.pagerStore[pager] = !stored.length || !div.querySelector(config.button)
            ? []
            : Array.from(div.querySelectorAll(item))
              .slice(stored.length * -1)
              .map(el => el.parentNode.removeChild(el).outerHTML);

          data = div.innerHTML;
          fragment = null;

          const elTarget = currentTarget.querySelector(config.target);
          elTarget.insertAdjacentHTML('afterend', data);
          elTarget.parentNode.removeChild(elTarget);

          Events.emit('DOM', 'change', currentTarget);

          if (infinite === 'true') {
            observe(currentTarget);
          }
        })
        .catch(error => {
          console.error(error);
          elButton.classList.remove('is--loading');
          elButton.disabled = false;
        });

    }
  };

  const observe = (el) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio > 0) {
            observer.unobserve(entry.target);
            Events.emit(el, 'click', {
              target: entry.target,
              currentTarget: el
            });
          }
        });
      }, { rootMargin: '25% 0px' });

      el.querySelectorAll(config.button).forEach(button => {
        observer.observe(button);
      });
    }
  };

  els.forEach(el => {
    const { infinite } = el.dataset;

    Events.on(el, 'click', click);

    if (infinite === 'true') {
      observe(el);
    }
  });
};

export default Pager;
