
function lpad(n, width, z = ' ') {
  n += '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function S(ms) {
  return (ms|0) / 1000;
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
    `Elapsed: ${S(total)}s Min: ${S(min)}s Max: ${S(max)}s`,
    `Success Avg: ${S(averages.success)}s Fail Avg: ${S(averages.failed)}s`
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

module.exports = { lpad, S, showSummary, showResponseTimePercentages, handleASPNETSessionCookie };
// vi:ts=2 sw=2 expandtab
