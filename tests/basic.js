let url;
function startup({ alien }) {
  url = alien.args.shift();
}
function next() {
  return { url };
}
function report({ summary }) {
  console.log(summary);
}
module.exports = { startup, next, report };
// vi:ts=2 sw=2 expandtab
