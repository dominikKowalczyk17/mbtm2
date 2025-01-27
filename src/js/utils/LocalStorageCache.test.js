/* eslint-disable no-undef */
import LocalStorageCache from './LocalStorageCache';

const lsc = new LocalStorageCache();
const d = new Date(2019, 4, 21, 21, 34, 47);

it('test formatDate with mode 0', () => {
  let dres = new Date(2019, 1, 1, 0, 0, 0,);
  expect(lsc.formatDate(d, 0).getTime()).toEqual(dres.getTime());
});

it('test formatDate with mode 1', () => {
  let dRes = new Date(2019, 4, 1, 0, 0, 0);
  expect(lsc.formatDate(d, 1).getTime()).toEqual(dRes.getTime());
});

it('test formatDate with mode 2', () => {
  let dRes = new Date(2019, 4, 21, 0, 0, 0);
  expect(lsc.formatDate(d, 2).getTime()).toEqual(dRes.getTime());
});

it('test formatDate with mode 3', () => {
  let dRes = new Date(2019, 4, 21, 21, 0, 0);
  expect(lsc.formatDate(d, 3).getTime()).toEqual(dRes.getTime());
});

it('test formatDate with mode 4', () => {
  let dRes = new Date(2019, 4, 21, 21, 34, 0);
  expect(lsc.formatDate(d, 4).getTime()).toEqual(dRes.getTime());
});

it('test formatDate with mode 5', () => {
  let dRes = new Date(2019, 4, 21, 21, 34, 47);
  expect(lsc.formatDate(d, 5).getTime()).toEqual(dRes.getTime());
});

it('test if setItem config is correct', () => {
  expect(lsc.prefix).not.toBeNull();
  expect(lsc.expirationSuffix).not.toBeNull();
});

it('test if setItem works fine when cache is up to date', () => {
  let p = lsc.prefix, s = lsc.expirationSuffix, add = 1000*60*5;
  let now = new Date();

  let expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0);
  let expectedAdd = expectedDate.getTime() + add;

  lsc.setItem('test key', 'test value', 5, 2);

  expect(localStorage.getItem(p+'test key')).toEqual(JSON.stringify('test value'));
  expect(localStorage.getItem(p+'test key'+s)).toEqual(JSON.stringify(expectedAdd));

  localStorage.removeItem(p+'test key');
  localStorage.removeItem(p+'test key'+s);
});

it('test if setItem works fine when cache is not up to date', () => {
  let p = lsc.prefix, s = lsc.expirationSuffix, add = 1000*60*60*24*5;
  let now = new Date();

  let expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  let expectedRem = expectedDate.getTime() - add;
  lsc.setItem('test key 2', 'test value', -5, 0);

  expect(localStorage.getItem(p+'test key 2')).toEqual(JSON.stringify('test value'));
  expect(localStorage.getItem(p+'test key 2'+s)).toEqual(JSON.stringify(expectedRem));
  expect(lsc.getItem('test key 2')).toBeNull();

  localStorage.removeItem(p+'test key 2');
  localStorage.removeItem(p+'test key 2'+s);
});

it('test setItem throws error when key is incorrect', () => {
  expect(() => {
    lsc.setItem(null, 'abc', 2, 2);
  }).toThrowError("Wymagany parametr key!");
});

it('test setItem throws error when val is incorrect', () => {
  expect(() => {
    lsc.setItem('abc', null, 2, 2);
  }).toThrowError("Wymagany parametr val!");
});

it('test setItem throws error when expiration is NaN', () => {
  expect(() => {
    lsc.setItem('abc', 'abc', 'abc', 2);
  }).toThrowError("Parametr expiration powinien być liczbą!");
});

it('test setItem throws error when mode is NaN', () => {
  expect(() => {
    lsc.setItem('abc', 'abc', 2, 'abc');
  }).toThrowError("Parametr mode powinien być liczbą!");
});
