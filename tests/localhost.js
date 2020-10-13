function next() {
	return { url: 'http://localhost/' };
}
function report({ results, summary }) {
  console.log(summary);
}
module.exports = { next, report };
