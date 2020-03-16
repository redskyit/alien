module.exports = { 

  async startup({ alien }) {
    alien.run.state.url = alien.args[0];
  },

  async next({ alien, ts }) {
    alien.api.handleASPNETSessionCookie(alien.run);
    return { url: alien.run.state.url, method: 'GET', cookies: alien.run.cookies };
  },

  async report({ alien, results, summary }) {
    alien.api.showSummary(summary, { percents: true });
  }

};
// vi: ts=2 sw=2 expandtab
