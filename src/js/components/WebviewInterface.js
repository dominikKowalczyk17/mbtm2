import Events from '../utils/Events';
import { createEl, delegate, isValidDate, transitionEndEvent } from '../utils/helpers';

export default () => {

  const WebviewInterfaceName = 'LoveIsland';

  const TYPE_CONTEST = 'contest';
  const TYPE_QUESTION = 'question';

  const WebviewInterface = window[WebviewInterfaceName] || (window[WebviewInterfaceName] = {
    getVotedFlag: (...args) => {
      console.info('%c getVotedFlag', 'color: green', ...args);

      return false;
    },
    setVotedFlag: (...args) => {
      console.info('%c setVotedFlag', 'color: green', ...args);
    },
    setUploadState: (...args) => {
      console.info('%c setUploadState', 'color: green', ...args);
    },
    toggleMenu: (...args) => {
      console.info('%c toggleMenu', 'color: green', ...args);

      'toggleMenu' in window && window.toggleMenu(...args);
    },
    goBack: (...args) => {
      console.info('%c goBack', 'color: green', ...args);

      window.history.back();
    },
    getPhoneNumber: (...args) => {
      console.info('%c getPhoneNumber', 'color: green', ...args);

      return '+48000000000';
    },
    getEmailAddress: (...args) => {
      console.info('%c getEmailAddress', 'color: green', ...args);

      return 'test@test.pl';
    },
  });

  const WebviewInterfaceCall = function(method, ...args) {
    if (method in WebviewInterface) {
      return WebviewInterface[method].call(WebviewInterface, ...args);
    }
  };

  const {
    url: ContestUrl,
    from: ContestFrom,
    to: ContestTo,
    type: ContestType = TYPE_CONTEST,
  } = window.contest || {};

  const shouldHandleVotedFlag = ContestType === TYPE_CONTEST;

  const typeIntl = ({
    [TYPE_CONTEST]: {
      send() {
        return 'Zgłoszenie zostało wysłane';
      },
      ended() {
        return 'Konkurs zakończony';
      },
      willStart(timeStr) {
        return `Konkurs rozpocznie się za:&nbsp;<b>${timeStr}</b>`;
      },
      takePart() {
        return 'Weź udział w konkursie';
      },
      takePartWithTime(timeStr) {
        return `Weź udział jeszcze przez:&nbsp;<b>${timeStr}</b>`;
      },
    },
    [TYPE_QUESTION]: {
      send() {
        return 'Zgłoszenie zostało wysłane';
      },
      ended() {
        return 'Ankieta zakończona';
      },
      willStart(timeStr) {
        return `Ankieta rozpocznie się za:&nbsp;<b>${timeStr}</b>`;
      },
      takePart() {
        return 'Weź udział w ankiecie';
      },
      takePartWithTime(timeStr) {
        return `Weź udział jeszcze przez:&nbsp;<b>${timeStr}</b>`;
      },
    }
  })[ContestType];

  /**
   * contestState - add helper class
   */
  const contest = document.getElementById('contest');
  const contestState = document.getElementById('contest-state');
  if (contestState) {
    const from = new Date(ContestFrom);
    const to = new Date(ContestTo);
    let isVoted = shouldHandleVotedFlag && WebviewInterfaceCall('getVotedFlag', ContestUrl);

    const el = document.getElementById('contest-info');
    const setStatus = (type, msg) => {
      el.innerHTML = `<span class="news-type news-type--${type}">${msg}</span>`;
    };


    const timeToStr = d => {
      const diff = d / 1000;
      const hours = String(Math.floor(diff / 3600)).padStart(2, 0);
      const minutes = String(Math.floor((diff / 60) % 60)).padStart(2, 0);
      const seconds = String(Math.floor(diff % 60)).padStart(2, 0);

      return `${hours}:${minutes}:${seconds}`;
    };

    let renderTimer;
    const renderStatus = () => {
      clearTimeout(renderTimer);

      const now = new Date();

      const isNowAfterFrom = now > from;
      const isNowBeforeTo = now < to;
      const isNowBeforeToMoreThan24h = isNowBeforeTo && ((to - now) > 1000 * 60 * 60 * 24);

      requestAnimationFrame(() => {
        const isNowBeforeFrom = !isNowAfterFrom;
        const isNowAfterTo = isValidDate(to) && !isNowBeforeTo;
        const isReallyVoted = shouldHandleVotedFlag && isVoted;
        contestState.hidden = isNowBeforeFrom || isNowAfterTo || isReallyVoted;
      });

      if (isVoted) {
        setStatus('accept', typeIntl.send());
      } else if (now >= to) {
        setStatus('alert', typeIntl.ended());
      } else if (!isNowAfterFrom) {
        const diff = from.getTime() - now.getTime();
        const timeStr = timeToStr(diff);

        setStatus('bell', typeIntl.willStart(timeStr));
        renderTimer = setTimeout(renderStatus, 1000);
      } else if (!isValidDate(to) || isNowBeforeToMoreThan24h) {
        setStatus('bell', typeIntl.takePart());
      } else if (isNowBeforeTo) {
        const diff = to.getTime() - now.getTime();
        const timeStr = timeToStr(diff);

        setStatus('bell', typeIntl.takePartWithTime(timeStr));
        renderTimer = setTimeout(renderStatus, 1000);
      }
    };

    renderStatus();


    const onPopState = event => {
      if (event.state === null) {
        issetHistory = false;
        changeState(false);
      } else if (event.state.Contest) {
        issetHistory = true;
        changeState(true);
      }
    };

    Events.on(window, 'popstate', onPopState);

    let issetHistory = false;
    const historyPush = () => {
      if (!issetHistory) {
        issetHistory = true;
        window.history.pushState({ Contest: true }, null, null);
      }
    };

    const historyBack = () => {
      if (issetHistory) {
        issetHistory = false;
        history.back();
      }
    };

    const changeState = state => {
      if (contestState.checked !== state) {
        contestState.checked = state;
        Events.trigger(contestState, 'change');
      }
    };

    let uploadState = false;
    Events.on(contestState, 'change', event => {
      const state = event.target.checked;
      document.documentElement.classList.toggle('is--contest-open', state);
      WebviewInterfaceCall('toggleMenu', !state);

      if (state) {
        historyPush();
        WebviewInterfaceCall('setUploadState', false);
      } else {
        historyBack();
        WebviewInterfaceCall('setUploadState', uploadState);
      }
    });

    Events.on('Contest', 'changeState', (STATES, props) => {
      const { state, reset: contestFormReset } = props;
      uploadState = state !== STATES.SUCCESS;

      if (state === STATES.SUCCESS || state === STATES.ERROR) {
        changeState(true);
      }

      if (state === STATES.SUCCESS) {
        if (shouldHandleVotedFlag) {
          WebviewInterfaceCall('setVotedFlag', ContestUrl, true);
        }

        Events.one(contestState, 'change', () => {
          if (transitionEndEvent) {
            Events.one(contest, transitionEndEvent, () => {
              contestFormReset();
            });
          } else {
            contestFormReset();
          }
        });

        isVoted = true;
        renderStatus();
      }
    });

    Events.on('Contest', 'getEmailAddress', callback => {
      const email = WebviewInterfaceCall('getEmailAddress');
      callback(email);
    });
  }



  // zamiana videoPlayer na obrazek
  var vods = [...document.querySelectorAll('.videoPlayer')];
  vods.forEach(vod => {
    const cls = [...vod.classList].find(cls => cls.startsWith('player'));

    if (cls) {
      const id = cls.replace('player', '');
      if (!isNaN(parseInt(id))) {
        vod.src = 'about:blank';
        vod.load();

        const img = createEl('img', 'video-preplay');
        img.alt = '';
        img.dataset.vod = id;
        img.src = vod.poster;

        const replaceWith = vod.closest('.feed__description > *') || vod;
        const newEl = createEl('figure', 'feed__video-wrap', [img]);
        replaceWith.parentNode.replaceChild(newEl, replaceWith);
      }
    }
  });

  // dodanie listenera na obrazkach preplay
  Events.on(document, 'click', delegate('.video-preplay', event => {
    const vod = event.delegateTarget;
    const id = vod.dataset.vod;
    let json = window.preplay[`vod${id}`];
    json = JSON.stringify(json);

    const channel = window.Video || window.parent;
    channel.postMessage(json);
  }));


  // dodanie obslugi dla shareowania
  (function SharingPostMessage () {
    Events.on(document, 'click', delegate('.feed__share', event => {
      event.preventDefault();

      const channel = window.Sharing || window.parent;
      const target = event.delegateTarget;
      const share = target.getAttribute('data-share');

      channel.postMessage(share || '');
    }));
  })();
};
