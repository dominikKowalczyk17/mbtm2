/**
 * Local Storage caching
 * @author Sebastian Kopyto
 * @version 1.0
 */

class LocalStorageCache{

  constructor(){
    this.prefix = "CACHED_";
    this.expirationSuffix = "_EXPIRATION";
  }

  /**
   * Zwraca obiekt daty o określonym przybliżeniu (zaokrągleniu)
   * @param {Date} date - obiekt daty
   * @param type
   * 0 - rok
   * 1 - miesiąc
   * 2 - dzień
   * 3 - godzina
   * 4 - minuta
   * 5 - sekunda
   * @returns Obiekt Date o określonym stopniu przybliżenia (zaokrąglenia)
   */
  formatDate = (date, type) => {
    let d = date instanceof Date?date:new Date(), result = null;
    let year = 1, month = 1, days = 1, hours = 0, mins = 0, secs = 0;

    switch(type) {
      case 5: secs = d.getSeconds();
      // eslint-disable-next-line no-fallthrough
      case 4: mins = d.getMinutes();
      // eslint-disable-next-line no-fallthrough
      case 3: hours = d.getHours();
      // eslint-disable-next-line no-fallthrough
      case 2: days = d.getDate();
      // eslint-disable-next-line no-fallthrough
      case 1: month = d.getMonth();
      // eslint-disable-next-line no-fallthrough
      case 0: year = d.getFullYear();
      // eslint-disable-next-line no-fallthrough
      default: break;
    }

    result = new Date(year, month, days, hours, mins, secs);

    return result;
  }

  /**
   * Dodaje dane do cache
   * @param key - klucz wpisu
   * @param val - wartość wpisu - dane do cache
   * @param {Map} expiration liczba jednostek czasowych w zależności od trybu 'mode'
   * @param mode tryb liczenia czasu cache: 0 - dzień, 1 - godzina, 2- minuta, 3 - sekunda
   */
  setItem = (key, val, expiration, mode) => {
    let v = val, m=0, add, ms=1000, t = this.formatDate(null, mode + 2), stamp;
    if(!isNaN(add = parseInt(expiration)) && !isNaN(m = parseInt(mode)) && key && val){
      switch(m) {
        case 0: add = add * 24;
        // eslint-disable-next-line no-fallthrough
        case 1: add = add * 60;
        // eslint-disable-next-line no-fallthrough
        case 2: add = add * 60;
        // eslint-disable-next-line no-fallthrough
        case 3: add = add * ms;
        // eslint-disable-next-line no-fallthrough
        default: break;
      }

      stamp = t.getTime() + add;

      try {
        v = JSON.stringify(v);
      }catch(e){console.error(e)}

      localStorage.setItem(`${this.prefix}${key}`, v);
      localStorage.setItem(`${this.prefix}${key}${this.expirationSuffix}`, stamp);
    } else {
      if(!key) {
        throw new Error("Wymagany parametr key!");
      } else if (!val) {
        throw new Error("Wymagany parametr val!");
      } else if(isNaN(parseInt(expiration))){
        throw new Error("Parametr expiration powinien być liczbą!");
      } else if(isNaN(parseInt(mode))){
        throw new Error("Parametr mode powinien być liczbą!");
      }
    }
  }

  /**
   * Zwraca wartość klucza z cache - sprawdza czy jest cacheowany, gdy brak - zwraca null
   * @param key - nazwa klucza
   * @returns wartość klucza z cache
   */
  getItem = (key) => {
    let val = localStorage.getItem(`${this.prefix}${key}`);
    let isCached = this.isCached(key);
    if(val && isCached) {
      try{
        val = JSON.parse(val);
        return val;
      } catch(e) {return val}
    } else return null;
  }

  /**
   * Sprawdza czy klucz jest w cache i jest aktualny
   * @param key - nazwa klucza
   * @returns true jeśli dane w cache są aktualne, false jeśli nieaktualne
   */
  isCached = (key) => {
    let val = localStorage.getItem(`${this.prefix}${key}`);
    let expiration = null;
    let now = null;
    if(val){
      expiration = parseInt(localStorage.getItem(`${this.prefix}${key}${this.expirationSuffix}`));
      now = this.formatDate(null, 5);
      if(expiration >= now.getTime()) return true;
      else{
        localStorage.removeItem(`${this.prefix}${key}`);
        localStorage.removeItem(`${this.prefix}${key}${this.expirationSuffix}`);
        return false;
      }
    }
  }
}
export default LocalStorageCache;