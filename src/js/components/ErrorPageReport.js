/**
 * ErrorPageReport - post error info to icm
 * @author Piotr Chrobak
 */

import { getUserData } from '../utils/getUserData';
import { prepareSearchParams } from '../utils/helpers';

const ErrorPageReport = (el) => {
  try {
    let json = JSON.parse(el.innerHTML);

    getUserData().then(data => {
      json = {
        ...json,
        URL: window.location.href,
        USER_HASH: data.user_hash,
        REFERER: document.referrer || '',
      };

      const { action, ...params } = json;
      const searchParams = prepareSearchParams(params);

      fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: searchParams,
      });
    });

    el.parentNode.removeChild(el);

  } catch (e) { }
};

export default ErrorPageReport;
