// vi:set ts=2 sw=2 expandtab
const program = require('commander');
const path = require('path');
const runtest = require('./runtest');
const { analyze } = require('./analysis');
const api = require('./api');

const VERSION = '1.0.4';

// Define main program options
program.version(VERSION);
program
  .option('--version', 'Show program version')
  .option('--help', 'Show help')
  .option('-n <requests>', 'Set total request count')
  .option('-c <n>', 'Set concurrent request count')
  .option('-r <n>', 'Set concurrent test count')
  .option('-t <test-module>', 'Optional test module that defines requests')
  .option('--');

// Loads either the default or named module (-t module.js). 
function loadModule(program) {
  const { args, T } = program;
  if (T) {
    const modulefn = path.isAbsolute(T) ? T : `${process.cwd()}/${T}`;
    process.chdir(path.dirname(modulefn));
    return { module: require(modulefn), custom: modulefn };
  } 
  return { module: require('./default') };
}

async function run(argv) {
  // Process arguments
  program.parse(argv);

  if (program.VERSION) {
    console.log(`Version ${program._version}`);
  }

  // Load test or default module. 
  const { module } = loadModule(program);

  // Clone program args
  const args = [ ...program.args ];

  // How many tests to run concurrently
  const concurrentTests = (program.R|0) || 1;
  const requestsPerTest = (program.N|0) || 1;
  const concurrentRequests = (program.C|0) || 1;
  const tests = [];

  const userAgent = `Alien/${VERSION}; http://github/redskyit/alien`;
  let alien = {
    version: VERSION,
    api,
    args,
    env: process.env,
    tests: { concurrent: concurrentTests },
    shared: {},
  };

  // Before all tests are run, call onload if defined
  if (typeof module.onload == "function") {
    await module.onload({ alien });
  }

  // Run concurrent tests (or just the one)
  for (let i = 0; i < concurrentTests; i++) {
    tests.push((async function(test) {

      // test run context
      const run = {
        test,
        requests: requestsPerTest, 
        concurrent: concurrentRequests,
        results: [],
        start: Date.now(),
        cookies: {},
        state: {},
      };

      // Create a test instance for this test run. It must be separate from other test runs,
      // except for some shared properties, api, args, env, tests and shared.
      const alienTestInstance = { api, args, env: alien.env, tests: alien.tests, shared: alien.shared, run, userAgent };

      // Run the test
      await runtest(module, alienTestInstance);

      // Post test analysis
      run.end = Date.now();
      run.summary = analyze(run.results, run.start, run.end);
      if (typeof module.report == "function") {
        await module.report({ alien: alienTestInstance, run, summary: run.summary, results: run.results });
      } else {
        console.log(run.summary);
      }

    })(i));
  }

  // Wait for all tests to finish
  await Promise.all(tests);

  // After all tests are run, call onunload if defined
  if (typeof module.onunload == "function") {
    await module.onunload({ alien });
  }
}

module.exports = { run };

// vi: ts=2 sw=2 expandtab
