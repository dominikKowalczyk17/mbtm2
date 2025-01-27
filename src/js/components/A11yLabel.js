/**
 * A11y Label - add tabing ability for label's
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';

class A11yLabel {
  constructor () {
    this.init();

    Events.on('DOM', 'change', this.init);
  }

  init = (container = document) => {
    const labels = Array.from(container.querySelectorAll('label')).filter(label => {
      return !label.A11yLabel && label.tabIndex > -1 && label.control;
    });

    labels.forEach(label => {
      label.A11yLabel = true;
      Events.on(label, 'focus', this.focus, true);
      Events.on(label, 'blur', this.blur, true);
    });
  }

  focus = () => {
    Events.on(window, 'keydown', this.keydown);
  }

  blur = () => {
    Events.off(window, 'keydown', this.keydown);
  }

  keydown = (event) => {
    if(event.keyCode === 13 || event.keyCode === 32) {
      event.preventDefault();
      event.target.click();
    }
  }
}

export default A11yLabel;
