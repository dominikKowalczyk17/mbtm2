import 'focus-visible';
import WebviewInterface from './components/WebviewInterface';
import Grid from './components/Grid';
import LazyLoad from './components/LazyLoad';
import Pager from './components/Pager';
import Helpful from './components/Helpful';
import ViewCount from './components/ViewCount';
import A11yLabel from './components/A11yLabel';
import Events from './utils/Events';
import ShareDialog from './components/ShareDialog';

const app = () => {
  window.DEBUG = process.env.NODE_ENV !== 'production';

  new WebviewInterface();

  new Grid();

  new LazyLoad();

  new Pager();

  new Helpful();

  new ViewCount();

  new A11yLabel();

  new ShareDialog();

  /**
   * Loader for Polling - only when needed
   */
  (function PollingCheck(el) {
    if ((el = document.querySelector('.polling'))) {
      import('./components/Polling' /* webpackChunkName: 'Polling' */).then(({ default: Polling }) => {
        new Polling(el);
      });
    }
  })();

  /**
   * Loader for Quiz - only when needed
   */
  (function QuizCheck(el) {
    if ((el = document.querySelector('.quiz'))) {
      import('./components/Quiz' /* webpackChunkName: 'Quiz' */).then(({ default: Quiz }) => {
        new Quiz(el);
      });
    }
  })();

  /**
   * Loader for Contest - only when needed
   */
  (function ContestCheck(el) {
    if ((el = document.querySelector('#contest'))) {
      import('./components/Contest' /* webpackChunkName: 'Contest' */).then(({ default: Contest }) => {
        new Contest(el);
      });
    }
  })();

  /**
   * Silly SPAM prevent
   */
  Array.from(document.querySelectorAll('form')).forEach(form => {
    const action = !form.getAttribute('action') && form.dataset.action;

    if (action) {
      form.setAttribute('action', action);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    (function DeepLink(els) {
      if ((els = document.querySelectorAll('.deep-link')).length) {
        [...els].forEach(el => {
          const input = el.querySelector('.deep-link__input');

          Events.on(input, 'select', () => {
            document.execCommand('copy');
          });

          Events.on(input, 'focus', () => {
            input.select();
          });
        });
      }
    })();
  }
};

export default app;
