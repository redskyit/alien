const fs = require('fs');
const { Command } = require('commander');
const program = new Command();

const state = {};

module.exports = { 

  async onload({ alien }) {
    // parse default module options
    program
      .option('-v', 'Verbose')
      .option('-b <body>', 'set body of request')
      .option('-f <file>', 'set body of request from file contents')
      .option('-e <encoding>', 'body encoding to use for file (-f)')
      .option('-T <content-type>', 'Set content type header')
      .option('-H <header=value;header=value>', 'Set HTTP header(s)')
      .option('-m <method>', ' Use specified HTTP method');
    program.parse([ 'module:default', ...alien.args ]);

    // pre-load some stuff
    if (program.F) {
      state.body = fs.readFileSync(program.F, program.E);
    }
  },

  async startup({ alien }) {
    alien.run.state.url = alien.args[0];
  },

  async next({ alien, ts }) {
    alien.handleASPNETSessionCookie(alien.run);
    const request = {
      method: (program.M || 'GET').toUpperCase(),
      url: alien.run.state.url,
      body: state.body || program.B,
      headers: {},
      cookies: alien.run.cookies
    };

    if (program.H) {
      program.H.split(/\|[ ]*/).forEach(header => { 
        const nv = header.split(/:[ ]*/);
        request.headers[nv[0]] = nv[1];
      });
    }
    if (program.T) {
      request.headers['Content-Type'] = program.T;
    }
    return request;
  },

  async report({ alien, results, summary }) {
    alien.showSummary(summary, { percents: true });
    if (program.V) alien.showAllRequests(results);
  }

};
// vi: ts=2 sw=2 expandtab
