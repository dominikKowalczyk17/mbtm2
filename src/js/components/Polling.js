/**
 * Polling
 * @author Piotr Chrobak
 */

import Cookie from 'js-cookie';
import { delegate, fetchStatus, prepareSearchParams, createEl, parseSearchParams } from '../utils/helpers';
import { getUserData } from '../utils/getUserData';
import Events from '../utils/Events';

class Polling {
  constructor (el) {
    this.poll = this.content = el;
    this.inputs = Array.from(this.poll.querySelectorAll('.polling__input'));
    this.errorCount = 0;

    const config = this.poll.querySelector(this.poll.dataset.config);
    if (config) {
      try {
        this.params = JSON.parse(config.innerHTML);
        this.poll.removeAttribute('data-config');

        if (this.isPollAnswered(this.params.POLLING_ID)) {
          this.poll.classList.add('is--loading');
          this.prepareResults();
          return;
        }
    
        getUserData()
          .then(data => {
            this.params = {
              ...this.params,
              ...data,
            };
          })
          .then(this.init);
      } catch(e) {
        throw new Error(e);
      }
    }
  }

  init = () => {
    this.inputs.forEach(input => {
      input.disabled = false;
    });

    Events.on(this.poll, 'change', delegate(this.matches, this.answer));
    this.poll.classList.remove('is--loading');
  }

  matches = el => {
    return el.matches && el.matches('.polling__input');
  }

  answer = event => {
    const id = event.delegateTarget.value;

    this.inputs.forEach(input => {
      input.disabled = true;
    });

    if (this.poll.classList.contains('is--loading') || !id)
      return;

    this.poll.classList.add('is--loading');

    const errorEl = this.poll.querySelector('.polling__msg--error');
    if (errorEl) {
      errorEl.parentNode.removeChild(errorEl);
    }

    this.params = {
      ...this.params,
      QUESTION_ID: id,
    };

    const { action, ...params } = this.params;
    const searchParams = prepareSearchParams(params);

    // fetch(action, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    //   },
    //   body: searchParams,
    // })
    //   .then(fetchStatus)
    //   .then(response => response.text())
    //   .then(this.success)
    //   .catch(this.error);

    this.XHR(action, searchParams)
      .catch(this.XHRerror)
      .finally(this.XHRfinally);
  }

  XHR = (action, params) => {
    return new Promise((resolve, reject) => {
      try {
        this.xhr = new XMLHttpRequest();
        this.xhr.open('POST', action);
        this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        this.xhr.withCredentials = true;
        this.xhr.onload =
        this.xhr.onerror =
        this.xhr.onabort =
        this.xhr.ontimeout = this.onXHRComplete(resolve, reject);

        params = parseSearchParams(params);
        delete params.url_ok;
        delete params.url_error;
        params = prepareSearchParams(params);

        this.xhr.send(params);
        this.xhrStart = Date.now();
      } catch(err) {
        reject({
          type: err
        });
      }
    });
  }

  onXHRComplete = (resolve, reject) => event => {
    let { target: response, type } = event;

    if (type === 'load' && response.status !== 200) {
      type = 'error';
    } else if (response.responseText !== '<resp status="ok"/>') {
      type = 'error';
    }

    this.xhr = null;

    response.eventType = type;

    switch (type) {
      case 'load':
        resolve(response);
        break;
      case 'abort':
      case 'error':
      case 'timeout':
      default:
        reject(response);
        break;
    }
  }

  XHRfinally = xhr => {
    this.setPollAsAnswered(this.params.POLLING_ID, this.params.QUESTION_ID);
    this.prepareResults();
  }

  XHRerror = xhr => {
    if (xhr.responseText) {
      const error = JSON.stringify({
        ver: 3,
        eventType: xhr.eventType,
        readyState: xhr.readyState,
        responseText: xhr.responseText,
        responseType: xhr.responseType,
        responseURL: xhr.responseURL,
        status: xhr.status,
        statusText: xhr.statusText,
        withCredentials: xhr.withCredentials,
        headers: xhr.getAllResponseHeaders(),
        time: Date.now() - this.xhrStart
      });
      const { action, ...params } = this.params;
      const searchParams = prepareSearchParams({
        module_id: 'MA==',
        ERROR_TYPE: 'POLLING',
        error,
        ua: navigator.userAgent,
        connection: (function(){
          const { effectiveType, rtt, downlink } = navigator.connection || {};
          return JSON.stringify({ effectiveType, rtt, downlink });
        })(),
        params: JSON.stringify(params)
      });

      fetch(action, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: searchParams,
      });
    }
  }


  success = data => {
    this.setPollAsAnswered(this.params.POLLING_ID, this.params.QUESTION_ID);
    this.printResults(data);
  }

  error = (error) => {
    const { action, ...params } = this.params;
    const searchParams = prepareSearchParams({
      module_id: 'MA==',
      ERROR_TYPE: 'POLLING',
      error,
      stack: error.stack,
      ua: navigator.userAgent,
      connection: (function(){
        const { effectiveType, rtt, downlink } = navigator.connection || {};
        return JSON.stringify({ effectiveType, rtt, downlink });
      })(),
      params: JSON.stringify(params)
    });

    fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: searchParams,
    }).finally(() => {
      if (++this.errorCount < 3) {
        this.setErrorMsg(`Wystąpił błąd. Prosimy spróbować ponownie.`);
        this.poll.classList.remove('is--loading');
        this.inputs.forEach(input => {
          input.checked = null;
          input.disabled = false;
        });
      } else {
        this.prepareResults();
      }
    });
  }

  setErrorMsg = msg => {
    const errEl = createEl('div', 'polling__msg polling__msg--error', msg);
    this.content.appendChild(errEl);
    errEl.scrollIntoView({behavior: 'smooth'});
    // this.content.insertAdjacentHTML('beforeend', `<div class="polling__msg polling__msg--error">${msg}</div>`);
  }

  printResults = data => {
    this.content.innerHTML = data;
    this.content.offsetTop; // trigger layout

    this.poll.classList.remove('is--loading');

    const answerId = this.getPollAnswer(this.params.POLLING_ID);
    const answered = this.content.querySelector(`.polling__answer[data-answer="${answerId}"]`);
    if (answered) {
      answered.classList.add('is--active');
    }

    Events.emit('DOM', 'change', this.poll.parentNode);
  }

  prepareResults = () => {
    fetch(this.params.url_ok + '?' + Date.now(), {
      credentials: 'include'
    })
      .then(fetchStatus)
      .then(response => response.text())
      .then(this.printResults)
      .catch((e) => {
        console.error(e);
        const htmlEl = this.poll.querySelector('.polling__results-html');
        if (htmlEl && htmlEl.innerHTML) {
          this.printResults(htmlEl.innerHTML);
        } else {
          const answers = this.poll.querySelector('.polling__answers');
          if (answers) {
            answers.parentNode.removeChild(answers);
          }
          this.setErrorMsg('Wystąpił błąd. Prosimy spróbować ponownie za parę minut.');
          this.poll.classList.remove('is--loading');
        }
      });
  }

  getPollAnswer = id => {
    return Cookie.get('POLLING' + id);
  }

  isPollAnswered = id => {
    return typeof Cookie.get('POLLING' + id) !== 'undefined';
  }

  setPollAsAnswered = (id, answerId) => {
    Cookie.set('POLLING' + id, answerId || 'X', {
      path: '/',
      expires: 365,
    });
  }
}

export default Polling;
