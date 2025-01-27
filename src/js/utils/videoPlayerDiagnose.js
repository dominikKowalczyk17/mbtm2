window.videoPlayerDiagnose = function (video) {

  var CONST = {
    action: '/icm/',
    surveyId: 98,
    questions: {
      logs: 700,
      email: 701,
      msg: 702,
    },
    portal: 'pnews',
  };

  function connectionType() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return (connection && connection.effectiveType || null);
  }

  function log(components) {

    if(!video || video.skipDiagnose) return;

    var form = video.mask.html([
      '<form action="' + CONST.action + '" method="post" class="videoPlayer__form">',
      '	<div class="videoPlayer__form-scroll">',
      '		<div class="videoPlayer__form-wrap">',
      '			<input type="hidden" name="module_id" value="NTE5Nw==">',
      '			<input type="hidden" name="survey_id" value="' + CONST.surveyId + '">',
      '			<input type="hidden" name="question' + CONST.questions.logs + '" class="videoPlayer__form-logs">',
      '			<div class="videoPlayer__form-info">',
      '				<p>',
      '					Drogi Użytkowniku,<br>',
      '					prosimy, wyślij nam raport techniczny, który wygenerował się na bazie danych zgromadzonych podczas wystąpienia błędu w odtwarzaczu wideo.',
      '				</p>',
      '				<p>',
      '					Dzięki tym danym szybciej ustalimy ewentualne przyczyny błędów i wprowadzimy zmiany, dzięki którym w przyszłości materiał wideo będzie odtwarzany bez zakłóceń.',
      '				</p>',
      '				<p>',
      '					Możesz również uzupełnić zgłoszenie o komentarz opisujący problem.',
      '				</p>',
      '			</div>',
      // '			<label class="videoPlayer__form-field">',
      // '				<div class="videoPlayer__form-label">Podaj swój adres e-mail</div>',
      // '				<input type="email" name="question' + CONST.questions.email + '" class="videoPlayer__form-input" placeholder="...">',
      // '			</label>',
      '			<label class="videoPlayer__form-field">',
      '				<div class="videoPlayer__form-label">Dodaj komentarz opisujący problem</div>',
      '				<textarea name="question' + CONST.questions.msg + '" class="videoPlayer__form-input videoPlayer__form-input--textarea" placeholder="..."></textarea>',
      '			</label>',
      '		</div>',
      '	</div>',
      '	<button class="videoPlayer__button videoPlayer__button--diagnose videoPlayer__button--icm">Wyślij raport techniczny</button>',
      '</form>',
    ].join('')).find('.videoPlayer__form');

    var sources = [],
        srcs = video.videoEl.container.find(video.videoEl.media).find('source');

    if(srcs.length) {
      for(var i = 0, source; (source = srcs[i++]); ) {
        var src = source.getAttribute('src'),
            type = source.getAttribute('type') || 'video/' + src.split('.').pop();
        sources.push({
          src: src,
          status: null,
          type: type,
          canPlay: video.videoEl.media.canPlayType(type),
        });
      }
    }
    else if((srcs = video.videoEl.media.getAttribute('src'))) {
      var type = 'video/' + srcs.split('.').pop();
      sources.push({
        src: srcs,
        status: null,
        type: type,
        canPlay: video.videoEl.media.canPlayType(type),
      });
    }

    for(var i = 0, source; (source = sources[i]); i++) {
      (function(i) {
        window.DOM.xhr({
          url: source.src,
          method: 'HEAD',
          onload: function(data, xhr) {
            sources[i].status = xhr.status;
          }
        });
      })(i);
    }

    form.on('submit', function(event) {
      event.preventDefault();

      var data = [],
          logs = {
            player: {
              init: video.init,
              errorGeo: video.errorGeo,
              supported: video.supported,
              sources: sources,
              connection: connectionType(),
              ip: video.errorIp,
              logs: video.logs
            },
            user: components || null,
            page: {
              url: location.href,
              ref: document.referrer || null,
              timestamp: Date.now(),
              lastModified: +(new Date(document.lastModified))
            }
          };

      form.find('.videoPlayer__form-logs').val(JSON.stringify(logs));

      for(var i = 0, input; (input = this[i++]); ) {
        if(input.name) {
          data.push(encodeURIComponent(input.name) + '=' + encodeURIComponent(input.value));
        } else if(input.nodeName === 'BUTTON') {
          window.DOM(input).addClass('is--loading').attr('disabled', 'disabled');
        }
      }

      function complete() {
        video.mask.html('<span class="_">Dziękujemy za&nbsp;wysłanie raportu&nbsp;technicznego!</span>');
      }

      window.DOM.xhr({
        url: this.action,
        method: this.method.toUpperCase(),
        data: data.join('&').replace(/%20/g, '+'),
        onload: complete,
        onerror: complete
      });
    });
  }

  import('./getUserData' /* webpackChunkName: 'getUserData' */).then(({Fingerprint}) => {
    Fingerprint().then(({ result, components }) => {
      var comp = {},
          disabled = ['canvas', 'webgl', 'js_fonts'];

      for (var i = 0, c; (c = components[i++]); ) {
        if (disabled.indexOf(c.key) === -1) {
          comp[c.key] = c.value;
        }
      }

      log(comp);
    });
  }).catch(log);

};
