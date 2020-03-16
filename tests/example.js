const fs = require('fs');

let ARG1;
let ARG2;
let ARG3;

let verbose = false;

// Load the body template, we will use this to generate request bodies.
const BODY_TEMPLATE = fs.readFileSync('example.tmpl', 'utf8');

////////////////////////////////////////////////////////////////////////////////////
// Helper functions 
////////////////////////////////////////////////////////////////////////////////////

// Generate a unique ID based on ARG1 from the command line and the current timestamp
const UNIQUE = { next: 0 };
function UNIQUE_REQUEST_ID(ts) {
  ts = `${ts}-${++UNIQUE.next}`;		// ensures UNIQUE REQUEST ID is unique
  UNIQUE.next %= 100;
  return `${ARG2}-${ts}`;
}

function getBody(RID, ts) {        // Return body for this request
  return BODY_TEMPLATE
    .replace(/{{ARG2}}/g, ARG2)
    .replace(/{{ARG3}}/g, ARG3)
    .replace(/{{UNIQUE_REQUEST_ID}}/g, RID)
    .replace(/{{DATE}}/g, ts);
}

////////////////////////////////////////////////////////////////////////////////////
// Test Module Lifecycle methods
////////////////////////////////////////////////////////////////////////////////////

async function onload({ alien }) {      // Called before any test run starts
  if (verbose) console.log('onload');

  // Check for -v (verbose) option
  if (alien.args[0] == '-v') {
    verbose = true;
    alien.args.shift();
  }
}

async function startup({ alien }) {     // Called at the start of a test run

  if (verbose) console.log('startup');

  // make sure the correct number of arguments has been supplied, abort if not
  if (alien.args.length < 3) {
    console.log('Usage: <ARG1> <ARG2> <ARG3>');
    process.exit(1);
  }

	// Extract test arguments from the command line
  ARG1 = alien.args[0];
  ARG2 = alien.args[1];
  ARG3 = alien.args[2];
}

// called by alien to get the details of the next request. 
// Should return an object that contains details of the request:
// {
//  url: "the url including query string if necessary",
//  method: 'GET|POST',
//  body: "the body if a POST request",
//  headers: { ... request headers ... },
//  cookies: { ... cookies to send to server ... }
// }
async function next({ alien, state, ts, results, batchResults, batchIndex, requestIndex }) {

  // Extra logging if -v option supplied.
  if (verbose) console.log(`Batch: ${batchIndex} Request: ${requestIndex}`);

  // Get a unique ID for this request.
  const RID = UNIQUE_REQUEST_ID(ts);

  // Build up a query string.
  const query = [ 'r=post', `deviceID=${ARG2}`, `ctid=${RID}`, `docID=form10210:${RID}` ];

  // Handle ASP.NET session cookie (updates state.cookies)
  alien.api.handleASPNETSessionCookie(alien.run);

  // Return the request object
  return {
    url: `${ARG1}?${query.join('&')}`,        // the URL for the request
    method: 'POST',                           // The request method (we are POSTing this data to the server)
    body: getBody(RID, ts),                   // The request body
    cookies: state.cookies,                   // Our cookies (set by handleASPNETSessionCookie)
    headers: {                                // Request headers
      'Content-Type': 'text/xml',
    },
  };
}

// Called after all requests have completed for a test.
async function shutdown({ alien }) {
  if (verbose) console.log('shutdown');
}

// Called after all requests have completed and after shutdown() 
async function report({ alien, results, summary }) {
  alien.api.showSummary(summary, { percents: true });
}

// Called after all requests from all tests have completed.
async function onunload({ alien }) {
  if (verbose) console.log('unloading');
}

module.exports = { onload, startup, next, shutdown, report, onunload };
// vi: ts=2 sw=2 expandtab
