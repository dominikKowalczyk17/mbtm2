import Events from '../utils/Events';
import { localStore } from '../utils/StorageFactory';
import { removeEl, createEl } from '../utils/helpers';

/**
 * Helpful - obsluga modulu oceny artykulu
 * @author Piotr Chrobak
 */
const Helpful = () => {
  const el = document.querySelector('.helpful');

  if (!el) return;

  const id = parseInt(el.querySelector('[name=ELEMENT_ID]').value);
  const storage = localStore;
  let rated = [];

  try {
    const tmp = JSON.parse(storage.getItem('helpful'));

    if (Array.isArray(tmp)) {
      rated = tmp;
    }
  } catch (e) { }

  if (rated.indexOf(id) === -1) {
    el.hidden = false;

    Events.one(el, 'change', () => {
      const iframe = createEl('iframe');
      el.target = iframe.name = 'helpful__iframe';
      iframe.style.display = 'none';
      el.appendChild(iframe);

      Events.one(iframe, 'load', () => {
        const response = iframe.contentDocument.body.innerHTML;
        const statusOk = '<resp status="ok"></resp>';

        if (response === statusOk) {
          rated.push(id);
          storage.setItem('helpful', JSON.stringify(rated));
        }
      });

      el.submit();
    });
  } else {
    removeEl(el);
  }
};

export default Helpful;
