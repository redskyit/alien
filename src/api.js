
function lpad(n, width, z = ' ') {
  n += '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function checkMinVersion(required) {
  const version = this.version.split('.');
  const v = required.split('.');
  if (version[0] != v[0]) return version[0] > v[0];
  if (version[1] != v[1]) return version[1] > v[1];
  return version[2] >= v[2];
}

function showResponseTimePercentages(percents) {
  console.log('');
  console.log(`${lpad('Response Time',20)}/Percent of Requests`);
  percents.forEach(slot => {
    console.log(`${lpad(`${slot.min}-${slot.max}ms`,20)} ${lpad(slot.percent,6)}%`);
  });
  console.log('');
}

function showSummary(summary, { percents } = {}) {
  const { start, end, total, min, max, failed, success, averages } = summary;
  console.log([
    `Success: ${success} Fails: ${failed}`,
    `Elapsed: ${total/1000}s Min: ${min/1000}s Max: ${max/1000}s`,
    `Success Avg: ${averages.success/1000}s Fail Avg: ${averages.failed/1000}s`
  ].join(' '));
  if (percents) showResponseTimePercentages(summary.percents);
}

function handleASPNETSessionCookie({ state, cookies }) {
  if (!state.ASPNETSessionId) {
    const cookie = cookies['ASP.NET_SessionId'];
    if (cookie) {
      state.ASPNETSessionId = cookie.value;
      (state.cookies = (state.cookies || {}))['ASP.NET_SessionId'] = state.ASPNETSessionId;
    }
  }
}

function showFailedRequests(results) {
  results.forEach(result => {
    if (result.status < 200 || result.status > 299) {
      const text = [];
      const errors = result.responseText.match(/<pre>(.*?)<\/pre>/gs);
      if (errors) {
        errors.forEach(error => {
          text.push(error.substr(5,error.length - 11).replace(/<[\/]*font[^>]*>/g, ""));
        });
      } else {
        text.push(result.responseText);
      }
      console.log(`> B${result.batch}R${result.request} ${result.status} ${result.statusText} ${text.join('')}`);
    }
  });
}

module.exports = {
  lpad,
  checkMinVersion,
  showSummary,
  showResponseTimePercentages,
  handleASPNETSessionCookie,
  showFailedRequests,
};
// vi:ts=2 sw=2 expandtab
