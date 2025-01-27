/**
 * Grid
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import { delegate, getOffset, getScrollTop } from '../utils/helpers';

const Grid = () => {
  const grid = document.querySelector('#grid');

  if (!grid) return;

  const matchMedia = window.matchMedia('(min-width: 640px)');
  let children = Array.from(grid.children);
  let msnry = null;

  const onMediaChange = event => {
    if (event.matches) {
      if (!msnry) {
        import('masonry-layout' /* webpackChunkName: 'Masonry' */).then(({ default: Masonry }) => {
          msnry = new Masonry(grid, {
            percentPosition: true,
          });
        });
      }
    } else if (msnry) {
      msnry.destroy();
      msnry = null;
    }
  };

  matchMedia.addListener(onMediaChange);
  onMediaChange(matchMedia);

  Events.on('DOM', 'change', container => {
    if (msnry && container === grid) {
      const newChildren = Array.from(container.children);
      const diff = newChildren.filter(x => !children.includes(x));

      children = newChildren;

      msnry.appended(diff);
      msnry.layout();
    }
  });

  // Events.on(grid, 'click', delegate('.feed__link', event => {
  //   event.preventDefault();

  //   const { delegateTarget: link } = event;
  //   const feed = link.closest('.feed');

  //   document.body.style.overflow = 'hidden';
  //   const from = {
  //     top: feed.offsetTop + 'px',
  //     left: feed.offsetLeft + 'px',
  //     right: (grid.offsetWidth - (feed.offsetLeft + feed.offsetWidth)) + 'px',
  //   };

  //   const to = {
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //   };

  //   feed.style.position = 'fixed';
  //   feed.style.width = 'auto';

  //   const keyframes = new KeyframeEffect(feed, [
  //     from,
  //     to,
  //   ], {
  //     duration: 10000,
  //     fill: 'forwards',
  //     easing: 'ease-in',
  //   });

  //   const animation = new Animation(keyframes);

  //   animation.play();

  //   setTimeout(() => {
  //     // location.assign(link.href);
  //   }, 10000);
  // }));

};

export default Grid;
