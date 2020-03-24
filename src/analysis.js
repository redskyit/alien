function calculatePercents(percents, total) {
  const keys = Object.keys(percents);
  const min = keys[0]|0;
  const max = keys[keys.length-1]|0;
  const size = (((max-min+1)/10)|0) + 1;
  const slots = [];
  for (let i = 0; i < 10; i++) {
    slots.push({ min: min + (i * size), max: min + ((i + 1) * size) - 1, count: 0 });
  }
  keys.forEach(k => {
    const v = percents[k];
    const slot = slots.find(slot => k >= slot.min && k <= slot.max);
    slot.count += (v|0);
  });
  slots.forEach(slot => slot.percent = Math.round(slot.count / total * 1000) / 10);
  return slots;
}

function analyze({ results, start, end, program }) {
  const analysis = { start, end, total: (end - start), min: (end - start), max: 0, failed: 0, success: 0 };
  const statuses = {};
  let ts = 0;
  let tf = 0;

  const counts = {};

  // Analyze the results
  results.forEach(result => {
    const { status, took } = result;

    let success = status >= 200 && status <= 200;
    if (program.failOnText && result.responseText.indexOf(program.failOnText) > -1) {
      success = false;
    }
    if (program.failOnExpr && result.responseText.match(new RegExp(program.failOnExpr)) != null) {
      success = false;
    }

	  // count success and failed requests and work out total time (used for averages below)
    if (success) {
      analysis.success ++;
      ts += took;
    } else {
      analysis.failed ++;
      tf += took;
    }

    // Counts by status
    statuses[status] = (statuses[status] || 0) + 1;

    // counts by timing
	  counts[took|0] = (counts[took]||0) + 1;

	  // track min and max 
    if (took > analysis.max) analysis.max = took;
    if (took < analysis.min) analysis.min = took;
  }); 

  // Calculate averages for success and failed requests, and overall average.
  analysis.averages = { 
    success: (ts / analysis.success) || 0,
    failed: (tf / analysis.failed) || 0,
    total: (ts + tf) / results.length
  };
  analysis.percents = calculatePercents(counts, results.length);
  analysis.statuses = statuses;
  return analysis;
}

module.exports = { analyze };

// vi:ts=2 sw=2 expandtab
