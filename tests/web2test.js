let url;
function startup({ alien }) {
  url = alien.args.shift();
}
function next() {
  return { url };
}
function shutdown({ alien, results }) {
  results.forEach(result => {
    if (result.status == 200) {
      const json = JSON.parse(result.responseText);
      if (json[0].failed) {
        result.status = 500;
        result.statusText = 'Internal Server Error; WEB2 Test Failed';
      }
    }
  });
console.dir(results);
}
function report({ alien, results, summary }) {
  alien.showSummary(summary);
}
module.exports = { startup, next, shutdown, report };
// vi:ts=2 sw=2 expandtab
