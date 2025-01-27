import Cookie from 'js-cookie';
import Fingerprint2 from 'fingerprintjs2';
import { fetchStatus } from './helpers';
import { localStore } from './StorageFactory';

export const getPlatform = (function () {
  var ua = navigator.userAgent.toLowerCase(),
      IEMobile = ua.indexOf('iemobile') > -1 || ua.indexOf('windows phone') > -1,
      Android = ua.indexOf('android') > -1 && !IEMobile,
      iOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;

  return Android || iOS || IEMobile ? 2 : 1;
})();

export const getSID = () => {
  const storage = localStore;
  const isStorageSupported = storage instanceof Storage;

  const get = () => {
    return new Promise(resolve => {
      const sid = storage.getItem('TRACKID') || Cookie.get('PERMTID');
      
      sid &&
      sid !== 'undefined' /* backward compatibility */ ? 
        resolve(sid) :
        fetch('/sid/', {
          cache: 'no-cache',
        })
          .then(fetchStatus)
          .finally(() => {
            resolve(Cookie.get('TRACKID'));
          });
    });
  };

  const set = (sid) => {
    if (sid) {
      isStorageSupported
        ? (storage.setItem('TRACKID', sid))
        : Cookie.set('PERMTID', sid, {
          path: '/',
          expires: 365,
        });
    }

    return sid;
  };

  return get().then(set);
};


let storeGetUserData = {};
export const getUserData = ({ sid = false } = {}) => {
  const config = JSON.stringify({ sid });
  return storeGetUserData[config]
    ? storeGetUserData[config]
    : storeGetUserData[config] = new Promise(resolve => {
      resolve({});
      // Fingerprint().then(({result: user_hash}) => {
      //   if (sid) {
      //     getSID()
      //       .then(user_id => {
      //         resolve({
      //           user_id,
      //           user_hash,
      //           platform: getPlatform
      //         });
      //       });
      //   } else {
      //     resolve({
      //       user_hash,
      //       platform: getPlatform
      //     });
      //   }
      // });
    });
};

let promiseFingerprint = null;
export const Fingerprint = () => {
  return promiseFingerprint
    ? promiseFingerprint
    : new Promise(resolve => {
      requestIdleCallback(() => {
        new Fingerprint2().get((result, components) => {
          resolve({
            result,
            components
          });
        });
      });
    });
};
