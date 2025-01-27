/**
 * templateBuilder - .news template builder
 * @author Piotr Chrobak
 */

const tpl = {
  cls: (data) => {
    return data.cls
      ? data.cls.reduce((str, cls) => {
        return str + ` news--${cls}`;
      }, '')
      : '';
  },
  image: (data, index, isFullPage = false) => {
    if (isFullPage) {
      switch (index) {
        case 1:
          return `
            <img
               class="news__img lazy-load"
            data-src="${data.img.maxi}"
         data-srcset="${data.img.maxi} 740w,
                      ${data.img.midi} 480w"
               sizes="(max-width: 480px) 160px,
                      740px"
                 alt="${data.alt}">
          `;
        case 2:
          return `
            <img
               class="news__img lazy-load"
            data-src="${data.img.midi}"
         data-srcset="${data.img.maxi} 740w,
                      ${data.img.midi} 480w,
                      ${data.img.mini} 360w"
               sizes="(max-width: 740px) 120px,
                      (max-width: 1023px) 160px,
                      740px"
                 alt="${data.alt}">
          `;
        default:
          return `
            <img
               class="news__img lazy-load"
            data-src="${data.img.midi}"
         data-srcset="${data.img.midi} 480w,
                      ${data.img.mini} 360w"
               sizes="(max-width: 740px) 120px,
                      (max-width: 1023px) 160px,
                      480px"
                alt="${data.alt}">
          `;
      }
    } else {
      return index === 1 ? `
        <img
           class="news__img lazy-load"
        data-src="${data.img.maxi}"
     data-srcset="${data.img.maxi} 740w,
                  ${data.img.mini} 360w"
           sizes="(max-width: 480px) 120px,
                  (max-width: 1479px) 740px,
                  120px"
             alt="${data.alt}">
      ` : `
        <img class="news__img lazy-load" data-src="${data.img.mini}" alt="${data.alt}">
      `;
    }
  },
  label: (data) => {
    return data.label ? `
      <span class="news__label label${data.label.alert ? ' label--alert' : ''}">${data.label.name}</span>
    ` : '';
  },
  time: (data) => {
    const date = new Date(data.timestamp);
    const d = dateFormat(date, 'getDate');
    const M = dateFormat(date, 'getMonth');
    const y = dateFormat(date, 'getFullYear');
    const h = dateFormat(date, 'getHours');
    const m = dateFormat(date, 'getMinutes');

    return `<time class="news__time" datetime="${y}-${M}-${d} ${h}:${m}">${d}.${M}.${y}, ${h}:${m}</time>`;
  },
  category: (data) => {
    return data.category ? `<span class="news__category">${data.category.name}</span>` : '';
  },
};

const dateFormat = (date, getter, pad = 2) => {
  let d = date[getter]();
  if (getter === 'getMonth') {
    d += 1;
  }
  return String(d).padStart(pad, '0');
};

const templateBuilder = (item, index, isFullPage) => {
  const {
    url,
    title,
    timestamp,
    img,
    cls,
    label,
    category,
  } = item;

  const _cls = tpl.cls({
    cls,
  });
  
  const _image = tpl.image({
    img,
    alt: title,
  }, index, isFullPage);

  const _label = tpl.label({
    label,
  });

  const _time = tpl.time({
    timestamp,
  });

  const _category = tpl.category({
    category,
  });

  return `
    <article class="news${_cls}">
      <a href="${url}" class="news__link">
        <figure class="news__figure">
          ${_image}
          ${_label}
        </figure>
        <header class="news__header">
          <div class="news__info">
            ${_time}
            ${_category}
          </div>
          <h2 class="news__title">${title}</h2>
        </header>
      </a>
    </article>
  `;
};

export default templateBuilder;
