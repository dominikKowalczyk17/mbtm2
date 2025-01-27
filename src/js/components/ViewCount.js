/**
 * ViewCount - post view counts to icm
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import { getUserData } from '../utils/getUserData';
import { prepareSearchParams } from '../utils/helpers';
import { localStore } from '../utils/StorageFactory';

const ViewCount = (container = document, icmData = {}) => {

  const viewCountData = container.querySelector('.viewCountData');

  try {
    let json = JSON.parse(viewCountData.innerHTML);

    getUserData().then(data => {
      let ref;

      json = {
        ...json,
        ...data,
        ref: icmData.ref || (ref = location.search.match(/[?&]ref=([^&]*)/)) && ref[1],
        ref_url: icmData.referrer || document.referrer,
      };

      const { action, ...params } = json;
      const searchParams = prepareSearchParams(params);

      fetch(action, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: searchParams,
      });

      if (params.FK_ELEMENT_TYPES_ID === 3) {
        const id = params.ELEMENT_ID;
        const storage = localStore;

        try {
          const visited = JSON.parse(storage.getItem('visited') || '[]');

          if (visited.indexOf(id) === -1) {
            visited.unshift(id);
            visited.length = Math.min(50, visited.length);
          }

          storage.setItem('visited', JSON.stringify(visited));
        } catch (e) { }
      }
    });

    viewCountData.parentNode.removeChild(viewCountData);

  } catch (e) { }
};

Events.on('Series', 'init', (container, icmData) => {
  new ViewCount(container, icmData);
});

Events.on('Photos', 'init', (container, icmData) => {
  new ViewCount(container, icmData);
});

export default ViewCount;
