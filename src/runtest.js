const fetch = require('node-fetch');
const { Headers } = fetch;

function TIMESTAMP() {
  return (new Date).toISOString().replace(/[-:]/g,"").replace(/[T.]/g,'-').substr(0,19);
}

function processSetCookies(cookies, result) {
  const cookie = result.headers['set-cookie'];
  if (cookie) {
    cookie.forEach(crumb => {
      const parts = crumb.split(/;[ \t]*/);
      const nv = parts.shift().split('=');
      cookies[nv[0]] = { value: nv[1], params: parts };
    });
  }
}

function makeHeaders(alien, headers, cookies) {
  const cookie = [];
  const meta = new Map();
  meta.set('User-Agent', alien.userAgent);
  if (headers) Object.keys(headers).forEach(k => meta.set(k, headers[k]));
  if (cookies) Object.keys(cookies).forEach(k => cookie.push(`${k}=${cookies[k]}`));
  if (cookie.length) meta.set('Cookie', cookie.join('; '));
  return new Headers(meta);
}

async function HTTP(request, { alien, batchIndex, requestIndex, results, cookies }) {
  const { url, method = 'GET', body, headers } = request;
  const start = Date.now();
  const res = await fetch(url, { method, body, headers: makeHeaders(alien, headers, request.cookies) });
  const took = Date.now() - start;
  const { status, statusText } = res;
  const responseText = await res.text();
  const result = { 
    batch: batchIndex, request: requestIndex,
    url, 
    method, 
    bodyLength: body ? body.length : 0, 
    start,
    took,
    status,
    statusText,
    responseText,
    responseLength: responseText.length,
    headers: res.headers.raw(),
  };
  processSetCookies(cookies, result);
  results.push(result);
}

module.exports = async function runtest(test, alien) {
  const { requests, concurrent, results, state, cookies } = alien.run;
  let i = 0;
  let batchIndex = 0;

  if (typeof test.startup == "function") {
    await test.startup({ alien });
  }

  while (i < requests) {
    const pending = [];
    const batchResults = i > 0 ? results.slice(i-concurrent) : [];
    for (let j = i; j < requests && j < i + concurrent; j++) {
      pending.push(
        (async function(requestIndex, batchIndex) {
          const request =  await test.next({ ts: TIMESTAMP(), state, results, batchResults, batchIndex, requestIndex, alien })
          return HTTP(request, { alien, batchIndex, requestIndex, results, cookies });
        })(j, batchIndex)
      );
    }
    await Promise.all(pending);
    i += concurrent;
    batchIndex ++;
  }

  if (typeof test.shutdown == "function") {
    await test.shutdown({ alien, results });
  }
}

// vi: ts=2 sw=2 expandtab
