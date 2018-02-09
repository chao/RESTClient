let urlParser = require('url');
export function isWebUrl(str) {
  let url = urlParser.parse(str);
  // console.log(`[url.js][isWebUrl]`, url);
  if ((url.protocol == 'http:' || url.protocol == 'https:') && url.hostname !== null) {
    return true;
  }
  return false;
}
export function urlResolve (from, to) {
  return urlParser.resolve(from, to);
}