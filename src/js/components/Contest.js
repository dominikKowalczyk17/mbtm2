/**
 * Contest - obsluga wrzutni
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import { delegate, removeEl, transitionEndEvent, createEl, fetchStatus, throttle } from '../utils/helpers';

window.URL = window.URL || window.webkitURL;

// delete window.FormData;

class Contest {
  static STATES = {
    SUCCESS: 'success',
    ERROR: 'error',
    PROGRESS: 'progress',
  };

  constructor (container) {
    this.container = container;
    this.form = this.container.querySelector('.contest-form');
    this.fileInput = this.form.querySelector('.contest-form__input--file');
    this.filesList = this.form.querySelector('.contest-file-list');
    this.emailAddress = this.form.querySelector('.contest-email-address');
    this.button = this.form.querySelector('.contest-form__button--submit');
    this.statusEl = this.container.querySelector('.contest-status');
    this.svgCircle = this.statusEl.querySelector('.contest-status__progress circle');
    this.svgText = this.statusEl.querySelector('.contest-status__percent');

    this.MAX_TRY_COUNT = 3;
    this.CANVAS_WIDTH = 200;
    this.CANVAS_HEIGHT = 112;
    this.MAX_FILES_SIZE = Math.min(200, this.fileInput && parseInt(this.fileInput.dataset.maxSize) || 200); // MB
    this.MAX_FILES_COUNT = this.fileInput && parseInt(this.fileInput.dataset.maxCount);
    this.VALIDATORS_ERROR_MSG = {
      REQUIRED: 'Wpisz odpowiedź',
      TermsValidator: 'Zaakceptuj regulamin',
      FileValidator: {
        'empty': 'Dodaj co najmniej jeden plik',
        'size': `Rozmiar dodanych plików został przekroczony o&nbsp;{overLimit} (maksymalnie&nbsp;${this.MAX_FILES_SIZE}&nbsp;MB). Zmniejsz rozmiar lub liczbę plików i&nbsp;spróbuj ponownie.`,
        'ext': 'Dodaj plik w prawidłowym formacie. Obsługiwane pliki:&nbsp;{extList}.',
        'count': `Maksymalna liczba plików wynosi ${this.MAX_FILES_COUNT}. Usuń nadmiarowe pliki.`,
      },
    };

    Events.emit('Contest', 'getEmailAddress', email => {
      this.emailAddress.value = email || '';
    });

    this.tryCount = 0;
    this.filesToUpload = [];
    this.isUploadForm = !!this.fileInput;

    if (this.isUploadForm) {
      this.addFileHandler(this.fileInput);
    }

    const termInput = document.querySelector('.contest-form__input--checkbox');
    if (termInput) {
      this.addTermsHandler(termInput);
    }

    Events.on(this.button, 'click', this.onButtonClick);
    Events.on(this.statusEl, 'click', delegate('.contest-form__button--abort', this.onAbort));
    Events.on(this.statusEl, 'click', delegate('.contest-form__button--retry', this.onRetry));
    Events.on(this.form, 'submit', this.onSubmit);
    Events.on(this.form, 'reset', this.onReset);

    const textarea = [...this.form.querySelectorAll('.contest-form__input--textarea')];
    this.addTextAreaHandle(textarea);

    // wylaczam walidacje formularza, bo jesli jest JS to obsluga zajme sie sam
    this.form.noValidate = true;
    this.button.disabled = false;
  }

  addTextAreaHandle(inputs) {
    inputs.forEach(input => {
      Object.defineProperty(input, 'customValidity', {
        get: () => ({
          valid: this.checkTextareaValidity(input)
        })
      });

      const limit = parseInt(input.maxLength);
      const infoEl = document.querySelector(input.getAttribute('data-limit-info'));
      const infoMsg = input.getAttribute('data-limit-msg') || '';
      if (limit && infoEl && infoMsg) {
        Events.on(input, 'input change', () => {
          const remains = limit - input.value.length;
          infoEl.innerHTML = infoMsg.replace('{limit}', limit).replace('{remains}', remains);
        });

        Events.on(this.form, 'reset', () => {
          // opozniam emit poniewaz od razu po resecie, wartosci inputow dalej sa stare (reset jest async?)
          setTimeout(() => {
            Events.emit(input, 'change');
          });
        });
      }
    });
  }

  addFileHandler(input) {
    input.required = false;

    Object.defineProperty(input, 'customValidity', {
      get: () => ({
        valid: this.checkFilesValidity(input)
      })
    });

    // ustawiam listenery
    Events.on(input, 'change', this.onFileChange);
    Events.on(this.filesList, 'click', delegate('.contest-file__remove', this.onFileRemove));
    Events.on(this.form, 'reset', this.removeAllFiles);

    if (input.files.length) {
      Events.trigger(input, 'change');
    }

    if ('FormData' in window) {
      input.multiple = true;
    } else {
      this.container.classList.add('is--no-form-data');
    }
  }

  addTermsHandler(input) {
    Object.defineProperty(input, 'customValidity', {
      get: () => ({
        valid: this.checkTermsValidity(input)
      })
    });

    const termsLink = this.form.querySelector('.contest-form__terms');
    if (termsLink) {

      const changeState = state => {
        this.container.classList.toggle('is--terms', state);

        if (state) {
          historyPush();
        } else {
          historyBack();
        }
      };

      const onPopState = event => {
        if (event.state) {
          if (event.state.ContestTerms) {
            issetHistory = true;
            if (termsFetched) {
              changeState(true);
            } else {
              termsLink.click();
            }
          } else {
            issetHistory = false;
            changeState(false);
          }
        }
      };

      Events.on(window, 'popstate', onPopState);

      let issetHistory = false;
      const historyPush = () => {
        if (!issetHistory) {
          issetHistory = true;
          window.history.pushState({ ContestTerms: true }, null, null);
        }
      };

      const historyBack = () => {
        if (issetHistory) {
          issetHistory = false;
          history.back();
        }
      };

      let termsFetched = false;
      const terms = this.container.querySelector('.contest-terms');
      const termsContent = terms.querySelector('.contest-terms__content');
      Events.on(termsLink, 'click', event => {
        event.preventDefault();

        changeState(true);

        if (!termsFetched) {
          requestIdleCallback(() => {
            fetch(termsLink.href)
              .then(fetchStatus)
              .then(resp => resp.text())
              .then(data => {
                termsContent.innerHTML = data;
                termsFetched = true;
              })
              .catch(() => {
                termsContent.innerHTML = `
                  Coś poszło nie tak... :(<br>
                  Proszę spróbować ponownie.
                `;
              });
          });
        }
      });

      Events.on(terms, 'click', delegate('.contest-terms__close', event => {
        event.preventDefault();
        changeState(false);
      }));
    }
  }

  onReset = () => {
    const inputs = [...this.form.querySelectorAll('.contest-form__input')];
    inputs.forEach(input => {
      this.cleanInputErrorMsg(input);
    });

    this.clearStatus();
  }

  onRetry = event => {
    if (++this.tryCount === this.MAX_TRY_COUNT) {
      event.delegateTarget.hidden = true;
    } else if (this.tryCount < this.MAX_TRY_COUNT) {
      event.preventDefault();
      this.setStatusView();
    }
  }

  onAbort = event => {
    event.preventDefault();

    if (this.xhr) {
      this.xhr.abort();
    }

    this.tryCount = 0;
  }

  onSubmit = event => {

    this.updateProgressView(0);
    this.setStatusView(Contest.STATES.PROGRESS);

    Events.on(window, 'beforeunload', this.onBeforeUnload);

    if ('FormData' in window) {

      event.preventDefault();

      const form = event.target;
      let fileInputName;

      if (this.isUploadForm) {
        fileInputName = this.fileInput.dataset.name || this.fileInput.name;
        this.fileInput.dataset.name = fileInputName;
        this.fileInput.removeAttribute('name');
      }

      const formData = new FormData(form);

      if (this.isUploadForm) {
        this.filesToUpload.forEach((file, i) => {
          formData.append(`${fileInputName}_${i}`, file);
        });
      }


      this.xhr = new XMLHttpRequest();
      this.xhr.open('POST', this.form.action);
      this.xhr.onload =
      this.xhr.onerror =
      this.xhr.onabort =
      this.xhr.ontimeout = this.onComplete;

      if (this.xhr.upload) {
        this.statusEl.querySelector('.contest-form__button--abort').disabled = false;
        this.xhr.upload.onprogress = this.onProgress;
        this.xhr.upload.onloadend = this.onUploadEnd;
      }

      this.xhr.send(formData);

    } else {

      let iframeStatus = 'load';
      const iframe = createEl('iframe');
      iframe.name = this.form.target = 'upload-iframe';
      iframe.style.display = 'none';
      this.container.appendChild(iframe);
      this.xhr = iframe;
      this.xhr.abort = function () {
        iframeStatus = 'abort';
        iframe.src = 'about:blank';
      };

      Events.one(iframe, 'load', () => {
        const response = iframe.contentDocument.body.innerHTML;
        const statusOk = '<resp status="ok"></resp>';
        if (response !== statusOk) {
          iframeStatus = 'error';
        }

        this.onComplete({
          target: {
            status: 200,
          },
          type: iframeStatus,
        });

        removeEl(iframe);
      });

    }
  }

  onUploadEnd = () => {
    this.statusEl.querySelector('.contest-form__button--abort').disabled = true;
  }

  onComplete = event => {
    let { target: req, type } = event;

    if (type === 'load' && req.status !== 200) {
      type = 'error';
    }

    this.xhr = null;

    Events.off(window, 'beforeunload', this.onBeforeUnload);

    switch (type) {
      case 'abort':
        this.setStatusView();
        return;
      case 'load':
        this.setStatusView(Contest.STATES.SUCCESS);
        break;
      case 'error':
      case 'timeout':
      default:
        this.setStatusView(Contest.STATES.ERROR);
        break;
    }

    window.navigator.vibrate([100, 50, 100]);
  }

  onBeforeUnload (event) {
    event.preventDefault();
    event.returnValue = '';
  }

  clearStatus = () => {
    this.container.classList.remove(
      `is--${Contest.STATES.SUCCESS}`,
      `is--${Contest.STATES.ERROR}`,
      `is--${Contest.STATES.PROGRESS}`
    );
  }

  setStatusView = state => {
    this.clearStatus();

    if (state) {
      this.container.classList.add(`is--${state}`);
    }

    Events.emit('Contest', 'changeState', Contest.STATES, {
      state,
      reset: () => {
        this.form.reset();
      },
    });
  }

  onProgress = event => {
    if (event.lengthComputable) {
      const progress = event.loaded / event.total;
      this.updateProgressView(progress);
    }
  }

  updateProgressView = (progress = 0) => {
    const percent = Math.round(progress * 100);
    this.svgCircle.style['strokeDashoffset'] = this.strokeDashOffset(progress);
    this.svgCircle.style['transition'] = progress === 0 ? 'none' : '';
    this.svgText.innerHTML = percent;

    // przy 100% dalej mozna bylo przerwac, mimo ze upload juz zrobiony.
    // wylaczam mozliwosc anulowania.
    if (percent === 100) {
      this.onUploadEnd();
    }
  }

  strokeDashOffset (current) {
    var x = this.svgCircleStrokeDashArray
        || (this.svgCircleStrokeDashArray = this.svgCircle.getAttribute('stroke-dasharray'));

    return (x - current * x).toFixed(2);
  }

  onFileRemove = event => {
    event.preventDefault();

    if (this.fileRemoving) return;

    const fileEl = event.delegateTarget.closest('.contest-file');
    fileEl.classList.add('is--removed');

    // sprawdza obsluge transitionEnd
    if (transitionEndEvent) {
      this.fileRemoving = true;

      Events.one(fileEl, transitionEndEvent, () => {
        this.removeFile(fileEl);

        this.fileRemoving = false;
      });
    } else {
      this.removeFile(fileEl);
    }
  }

  removeFile = fileEl => {
    // sprawdzam index usuwanego elementu
    const index = [...fileEl.parentElement.children].indexOf(fileEl);
    this.filesToUpload.splice(index, 1);

    if (this.filesToUpload.length === 0) {
      this.fileInput.value = '';
    }

    removeEl(fileEl);

    requestIdleCallback(() => {
      this.checkValidity(this.fileInput);
    });
  }

  removeAllFiles = () => {
    this.filesToUpload.length = 0;
    this.fileInput.value = '';
    this.filesList.innerHTML = '';
  }

  onFileChange = () => {
    const files = this.fileInput.files;
    const input = this.fileInput;
    input.classList.add('is--loading');
    input.blur();

    const uniqFiles = this.getUniqFilesToUpload([...files]);
    this.filesToUpload = this.filesToUpload.concat(uniqFiles);

    if ('FormData' in window) {
      input.value = '';
    }

    Promise.all(
      // zlecam wyrenderowanie podgladu pliku
      uniqFiles.map(this.renderFile)
    ).then(
      // generuje DOM dla plikow
      filesAndCanvas => new Promise(resolve => {
        requestIdleCallback(() => {
          resolve(filesAndCanvas.map(this.templateFile));
        });
      })
    ).then(
      // dodaje wygenerowane pliki do listy
      filesTpl => new Promise(resolve => {
        requestIdleCallback(() => {
          filesTpl.forEach(tpl => {
            this.filesList.appendChild(tpl);
          });
          resolve();
        });
      })
    ).then(() => {
      input.classList.remove('is--loading');

      this.checkValidity(input);
    });
  }

  checkFilesValidity = input => {
    const maxMb = this.MAX_FILES_SIZE * 1024 * 1024;
    const validExt = (input.accept || input.dataset.accept).split(',');

    let customError = '';
    let size = 0;
    let tmpSize = 0;
    let invalidExt = false;
    let errorFilesLength = 0;

    Array
      .from(this.filesList.querySelectorAll('.contest-file.is--error'))
      .forEach(file => {
        file.classList.remove('is--error', 'is--error-size', 'is--error-name');
      });

    const children = this.filesList.children;
    this.filesToUpload.forEach((file, i) => {
      const fileEl = children[i];

      /**
       * jesli fn odpalona zostala po `change` lub `input`
       * to filesToUpload.length !== children.length
       */
      if (!fileEl) {
        return;
      }

      const fileSize = file.size;
      size += fileSize;
      tmpSize += fileSize;

      if (tmpSize > maxMb) {
        tmpSize -= file.size;
        fileEl.classList.add('is--error', 'is--error-size');
        errorFilesLength++;
      }

      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (validExt.indexOf(ext) === -1) {
        invalidExt = true;
        fileEl.classList.add('is--error', 'is--error-name');
        errorFilesLength++;
      }

      if (this.MAX_FILES_COUNT && i >= (this.MAX_FILES_COUNT + errorFilesLength)) {
        fileEl.classList.add('is--error');
      }
    });

    if (this.filesToUpload.length === 0) {
      customError = this.getValidatorErrorMsg('FileValidator', 'empty');
    } else if (size > maxMb) {
      customError = this.getValidatorErrorMsg('FileValidator', 'size').replace('{overLimit}', this.calcSize(size - (maxMb)));
    } else if (invalidExt) {
      customError = this.getValidatorErrorMsg('FileValidator', 'ext').replace('{extList}', validExt.join(', '));
    } else if (this.MAX_FILES_COUNT && this.filesToUpload.length > this.MAX_FILES_COUNT) {
      customError = this.getValidatorErrorMsg('FileValidator', 'count');
    }

    input.setCustomValidity(customError);

    return customError === '';
  }

  getUniqFilesToUpload = files => {
    return files.filter(file => (
      this.filesToUpload.every(fileToUpload => (
        !this.isSameFiles(file, fileToUpload)
      ))
    ));
  }

  isSameFiles(file1, file2) {
    return (
      file1.lastModified === file2.lastModified
      && file1.size === file2.size
      && file1.name === file2.name
      && file1.type === file2.type
    );
  }

  templateFile = ({ file, canvas }) => {
    // const fileChunks = file.name.split('.');
    // const fileExt = fileChunks.length > 1 ? `.${fileChunks.pop()}` : '';
    // const fileName = fileChunks.join('.');
    // const fileSize = this.calcSize(file.size);

    return createEl('li', 'contest-file', [
      createEl('figure', 'contest-file__figure', [
        canvas,
        '<button class="contest-file__remove">Usuń</button>',
      ])
    ]);
  }

  calcSize (size) {
    if (size > 1024 * 1024) return (Math.round(size * 100 / (1024 * 1024)) / 100).toFixed(2) + '&nbsp;MB';
    else if (size > 1024) return (Math.round(size * 100 / 1024) / 100).toFixed(2) + '&nbsp;KB';
    else return (Math.round(size * 100) / 100).toFixed(2) + '&nbsp;B';
  }

  renderFile = file => new Promise(resolve => {
    let obj = {};

    if (file.type.match('video/.*')) {
      obj = document.createElement('video');
    } else if (file.type.match('image/.*')) {
      obj = document.createElement('img');
    }

    obj.onload = obj.onloadeddata = obj.onerror = event => {
      let canvas;

      clearTimeout(timer);

      if (event && event.type !== 'error') {
        const self = event.target;
        const isVideo = self.tagName === 'VIDEO';

        canvas = createEl('canvas', 'contest-file__canvas is--loading');

        window.requestIdleCallback(() => {
          this.createCanvas(canvas, self).then(canvas => {
            if (isVideo && this.isCanvasBlank(canvas)) {
              self.ontimeupdate = () => {
                self.pause();
                self.ontimeupdate = null;

                this.createCanvas(canvas, self).then(canvas => {
                  if (!this.isCanvasBlank(canvas)) {
                    canvas.classList.remove('is--loading');
                  }
                });
              };

              self.playsinline = true;
              self.muted = true;
              self.play();
            } else {
              canvas.classList.remove('is--loading');
            }
          });
        });
      }

      window.URL.revokeObjectURL(this.src);
      obj = null;

      resolve({
        file,
        canvas
      });
    };

    obj.src = window.URL.createObjectURL(file);

    // fallback
    const timer = setTimeout(() => {
      obj.onload.call(obj);
    }, 5000);

    // jeśli wgrany plik nie jest ani obrazkiem, ani wideo, odpalam manualnie onload
    if (!obj.tagName) {
      obj.onload.call(obj);
    }

  });

  createCanvas = (canvas, source) => new Promise(resolve => {
    const ctx = canvas.getContext('2d'),
          canvasW = this.CANVAS_WIDTH,
          canvasH = this.CANVAS_HEIGHT,
          sourceW = source.width || source.videoWidth,
          sourceH = source.height || source.videoHeight,
          drawW = Math.min(sourceW, canvasW),
          drawH = Math.min(sourceH, canvasH),
          drawX = (canvasW - drawW) / 2,
          drawY = (canvasH - drawH) / 2,
          ratio = Math.min(canvasW / sourceW, canvasH / sourceH);

    let newW = sourceW * ratio,
        newH = sourceH * ratio,
        cropW, cropH, cropX, cropY, aspectRatio;

    canvas.width = canvasW;
    canvas.height = canvasH;

    if (newW < canvasW) {
      aspectRatio = canvasW / newW;
    } else if (newH < canvasH) {
      aspectRatio = canvasH / newH;
    }

    newW *= aspectRatio;
    newH *= aspectRatio;

    cropW = Math.max(drawW, Math.min(sourceW, sourceW / (newW / drawW)));
    cropH = Math.max(drawH, Math.min(sourceH, sourceH / (newH / drawH)));

    cropX = Math.max(0, (sourceW - cropW) * .5);
    cropY = Math.max(0, (sourceH - cropH) * .5);

    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropW > sourceW) cropW = sourceW;
    if (cropH > sourceH) cropH = sourceH;

    ctx.drawImage(source, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH);

    resolve(canvas);
  });

  isCanvasBlank = canvas => {
    try {
      return canvas.toDataURL() === this.getCanvasBlank();
    } catch (e) {
      return true;
    }
  }

  getCanvasBlank = () => {
    return this.canvasBlank || (this.canvasBlank = (() => {
      const canvasBlank = document.createElement('canvas');

      canvasBlank.width = this.CANVAS_WIDTH;
      canvasBlank.height = this.CANVAS_HEIGHT;

      return canvasBlank.toDataURL();
    })());
  }

  scrollToFirstError = inputs => {
    // znajduje pierwszy bledny input, zeby przescrollowac do niego
    inputs.some(input => {
      if (input.classList.contains('is--error')) {
        input.focus();
        (input.errorMsgElement || input).scrollIntoView({ block: 'center', behavior: 'smooth' });

        return true;
      }
    });
  }

  onButtonClick = event => {
    const inputs = [...this.form.querySelectorAll('.contest-form__input')];

    if (!this.checkInputsValid(inputs)) {
      event.preventDefault();
      this.scrollToFirstError(inputs);
    }
  }

  checkInputsValid = inputs => {
    let isValid = true;

    inputs.forEach(input => {
      if (!this.checkValidity(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  checkTermsValidity(input) {
    let customError = '';

    if (!input.checked) {
      customError = this.getValidatorErrorMsg('TermsValidator');
    }

    input.setCustomValidity(customError);

    return customError === '';
  }

  checkTextareaValidity(input) {
    let customError = '';

    if (input.value.trim() === '') {
      customError = this.getValidatorErrorMsg('REQUIRED');
    }

    input.setCustomValidity(customError);

    return customError === '';
  }

  checkValidity = input => {
    this.cleanInputErrorMsg(input);

    if (
      !input.disabled && (
        ('customValidity' in input && !input.customValidity.valid) ||
        ('validity' in input && !input.validity.valid)
      )
    ) {
      this.setInputErrorMsg(input);

      return false;
    }

    return true;
  }

  cleanInputErrorMsg (input) {
    input.classList.remove('is--error');

    if (input.inputHandler) {
      Events.off(input, 'input change', input.inputHandler);
      input.inputHandler = null;
    }

    if (input.errorMsgElement) {
      removeEl(input.errorMsgElement);
      input.errorMsgElement = null;
    }
  }

  setInputErrorMsg (input) {
    input.classList.add('is--error');

    const errorMsgElement = this.generateErrorMsgElement(input);
    input.parentNode.appendChild(errorMsgElement);
    input.errorMsgElement = errorMsgElement;

    if (!input.inputHandler) {
      input.inputHandler = throttle(() => {
        input.setCustomValidity('');
        this.checkValidity(input);
      });

      Events.on(input, 'input change', input.inputHandler);
    }
  }

  generateErrorMsgElement (input) {
    const errorEl = createEl('label', 'contest-form__info contest-form__info--error', input.validationMessage);
    errorEl.htmlFor = input.id;
    return errorEl;
  }

  getValidatorErrorMsg = (validator, field) => {
    const error = this.VALIDATORS_ERROR_MSG[validator] || '';
    return error[field] || error['default'] || error;
  }
}

export default Contest;
