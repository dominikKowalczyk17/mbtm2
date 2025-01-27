/**
 * Share - skrypt do zarzadzania shareowaniem targetow
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import { delegate, debounce } from '../utils/helpers';

const Share = (container = document) => {
  const share = container.querySelector('.news__share');
  if (!share) return;
  
  let nativeShareError = false;
  
  let commentsEl;
  const commentsFocus = debounce(() => {
    commentsEl.focus();
    Events.off(window, 'scroll', commentsFocus);
  });

  const matches = el => {
    return el.matches && el.matches('.nav__item');
  };

  const click = event => {
    const item = event.delegateTarget;
    const link = item.querySelector('.nav__link');
    const cls = item.className;
    if (navigator.share && nativeShareError === false && cls.indexOf('--share') !== -1) {
      event.preventDefault();

      const {title, url} = share.dataset;

      navigator.share({
        url,
        title,
        text: title,
      }).catch(error => {
        if (error instanceof TypeError) {
          nativeShareError = error;
          link.control.checked = !link.control.checked;
        }
      });
    } else if (cls.indexOf('--comments') !== -1) {
      event.preventDefault();

      const id = link.href.split('#').pop();
      commentsEl = document.getElementById(id);
      if (commentsEl) {
        window.history.replaceState(null, null, `#${id}`);
        Events.on(window, 'scroll', commentsFocus);
        commentsEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (link.href) {
      event.preventDefault();
      event.stopPropagation();

      window.open(link.href, '_blank', `left=10,top=10,width=600,height=500,noopener`);
    }
  };

  Events.on(share, 'click', delegate(matches, click));
};

Events.on('Series', 'init', container => {
  new Share(container);
});

export default Share;
