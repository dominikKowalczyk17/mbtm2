class Animate {
  constructor(options = {}) {
    const defaults = {
      duration: 500,
      from: 0,
      to: 1,
      easing: Animate.easing.easeOutCubic,
      onStart: null,
      onPlay: null,
      onPause: null,
      onStop: null,
      onUpdate: null,
      onEnd: null
    };

    this.config = Object.assign({}, defaults, options);

    this._pause = null;
    this._update = this._update.bind(this);
  }

  play() {
    if (!this._start) {
      if (this._call('onStart') === false) {
        this._call('onEnd', this._step);
        return;
      }
    }
    this._start = Date.now() - this._pause;
    this._call('onPlay', this._step);
    this._update();
  }

  pause() {
    cancelAnimationFrame(this._raf);
    this._pause = Date.now() - this._start;
    this._call('onPause', this._step);
  }

  stop() {
    cancelAnimationFrame(this._raf);
    this._call('onStop');
    this._start = this._step = this._current = this._pause = null;
  }

  _update() {
    this._current = Date.now() - this._start;
    if (this._current < this.config.duration) {
      this._raf = requestAnimationFrame(this._update);
      this._step = this.config.easing(
        this._current,
        this.config.from,
        -this.config.from + this.config.to,
        this.config.duration
      );
    } else {
      this._step = this.config.to;
      requestAnimationFrame(() => {
        this.stop();
        this._call('onEnd', this._step);
      });
    }

    this._call('onUpdate', this._step);
  }

  _call(fn, step) {
    if (typeof this.config[fn] === 'function') {
      return this.config[fn].call(null, this, step);
    }
  }
}

Animate.easing = {
  linear(t, b, c, d) {
    return (c * t) / d + b;
  },
  easeOutCubic(t, b, c, d) {
    return c * (Math.pow(t / d - 1, 3) + 1) + b;
  },
  easeInOutCubic(t, b, c, d) {
    // eslint-disable-next-line
    if ((t /= d / 2) < 1) {
      return (c / 2) * Math.pow(t, 3) + b;
    }
    return (c / 2) * (Math.pow(t - 2, 3) + 2) + b;
  }
};

Animate.calculate = function(from, to, step) {
  return from + (to - from) * step;
};

export default Animate;
