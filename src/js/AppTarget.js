import Events from './utils/Events';
import Share from './components/Share';
import Recommended from './components/Recommended';
import ViewCount from './components/ViewCount';
import { delegate } from './utils/helpers';

export default () => {

  new Share();

  new Recommended();

  new ViewCount();

  /**
   * Loader for Series - only when needed
   */
  (function SeriesCheck(el) {
    if((el = document.querySelector('#series'))) {
      import('./components/Series' /* webpackChunkName: 'Series' */).then(({default: Series}) => {
        new Series(el);
      });
    }
  })();

  /**
   * Loader for Photos - only when needed
   */
  (function PhotosCheck() {
    const PhotosClick = delegate(
      link => {
        return link.matches && link.matches('.news__photos-link');
      }, event => {
        event.preventDefault();
        event.delegateTarget.classList.add('is--loading');

        import('./components/Photos' /* webpackChunkName: 'Photos' */).then(({ PhotosLoader }) => {
          new PhotosLoader(event.delegateTarget);
        });
      }
    );

    const PhotosChecker = (container = document) => {
      let photos;
      if ((photos = Array.from(container.querySelectorAll('.photos'))).length) {
        import('./components/Photos' /* webpackChunkName: 'Photos' */).then(({ default: Photos }) => {
          photos.forEach(photo => {
            new Photos(photo);
          });
        });
      }
    };

    PhotosChecker();
    Events.on('Photos', 'init', PhotosChecker);

    try {
      const parent = document.querySelector('.news--target').parentNode;
      Events.on(parent, 'click', PhotosClick);
    } catch (e) { }
  })();

  /**
   * Loader for Liveblog - only when needed
   */
  const LiveblogCheck = (container = document) => {
    let el;
    if((el = container.querySelector('.liveblog'))) {

      if (!el.dataset.url || el.dataset.finished === 'true') {
        el.classList.remove('is--loading');
      } else {
        import('./components/Liveblog' /* webpackChunkName: 'Liveblog' */).then(({ default: Liveblog }) => {
          new Liveblog(el);
        });
      }

    }
  };

  LiveblogCheck();
  Events.on('Series', 'init', LiveblogCheck);

};
