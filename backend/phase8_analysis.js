const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, 'results', 'raw_benchmark_1787129759106.json');
const SUMMARY_FILE = path.join(__dirname, 'results', 'summary_benchmark_1787129759106.json');

const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
const summaryData = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));

// We want to recompute the statistics from rawData.rawResults
const results = rawData.rawResults;
const SIZES = [10, 50, 100, 500, 1000, 5000, 10000];
const DISTRIBUTIONS = ['Random', 'Ascending', 'Descending', 'Duplicate-Heavy'];
const EXPECTED_RUNS = 50;

const analysis = {
  metadata: {
    timestamp: new Date().toISOString(),
    sourceFile: RAW_FILE
  },
  completenessAudit: [],
  discrepancies: [],
  recomputedSummary: [],
  outlierAnalysis: [],
  duplicateHeavyFailure: null,
  realisticTrace: null
};

const chapter4Summary = {
  metadata: {
    timestamp: new Date().toISOString(),
    description: "Validated statistical summary of QuickSort empirical performance."
  },
  data: []
};

// 1. Audit Completeness & Recompute Stats
for (const size of SIZES) {
  for (const distribution of DISTRIBUTIONS) {
    // Filter raw data
    const group = results.filter(r => r.size === size && r.distribution === distribution);
    const hasError = group.length > 0 && group.some(r => r.error !== null);
    // Actually, in Phase 7 I didn't push the error to rawResults if it broke instantly, 
    // Wait, the code was: if (failed) break; then push error to summary. 
    // Let's check summary to see if it failed.
    const summaryItem = summaryData.summaryResults.find(s => s.size === size && s.distribution === distribution);
    const failed = summaryItem && summaryItem.error;
    
    analysis.completenessAudit.push({
      size,
      distribution,
      expectedRuns: EXPECTED_RUNS,
      actualRuns: group.length,
      status: failed ? 'FAILED' : (group.length === EXPECTED_RUNS ? 'COMPLETE' : 'INCOMPLETE')
    });

    if (failed) {
      if (size === 10000 && distribution === 'Duplicate-Heavy') {
        analysis.duplicateHeavyFailure = {
          size, distribution, error: summaryItem.error, actualRunsRecorded: group.length
        };
      }
      continue; // Skip stats calculation for failed ones
    }

    if (group.length === 0) continue;

    // Verify Determinism
    const firstComp = group[0].comparisons;
    const firstSwap = group[0].swaps;
    const isDeterministic = group.every(r => r.comparisons === firstComp && r.swaps === firstSwap);
    if (!isDeterministic) {
      analysis.discrepancies.push(`Determinism violated for ${size} | ${distribution}`);
    }

    // Execution Time Stats
    const execTimes = group.map(r => r.executionTimeMs).sort((a,b) => a-b);
    const min = execTimes[0];
    const max = execTimes[execTimes.length-1];
    const mean = execTimes.reduce((a,b) => a+b, 0) / execTimes.length;
    
    const median = execTimes.length % 2 === 0 
      ? (execTimes[execTimes.length/2 - 1] + execTimes[execTimes.length/2]) / 2
      : execTimes[Math.floor(execTimes.length/2)];
    
    // Std Dev
    const variance = execTimes.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / execTimes.length;
    const stddev = Math.sqrt(variance);

    // Compare with old summary
    if (summaryItem) {
      const msDelta = Math.abs(summaryItem.executionTimeMs_median - median);
      if (msDelta > 0.0001) {
        analysis.discrepancies.push(`Median mismatch for ${size}|${distribution}: Raw=${median}, Old=${summaryItem.executionTimeMs_median}`);
      }
    }

    analysis.recomputedSummary.push({
      size, distribution,
      comparisons: firstComp, swaps: firstSwap,
      min, max, mean, median, stddev,
      observations: group.length,
      isDeterministic
    });

    analysis.outlierAnalysis.push({
      size, distribution,
      min, median, mean, max,
      range: max - min,
      cv: stddev / mean, // Coefficient of variation
      impact: Math.abs(mean - median) / median
    });

    chapter4Summary.data.push({
      size, distribution,
      comparisons: firstComp,
      swaps: firstSwap,
      medianTimeMs: median,
      meanTimeMs: mean
    });
  }
}

// 2. Realistic Trace Extraction
const realisticSummary = summaryData.summaryResults.find(s => s.distribution === 'Realistic Recommendation DB Trace');
if (realisticSummary) {
  analysis.realisticTrace = realisticSummary;
}

const timestamp = Date.now();
const PHASE8_FILE = path.join(__dirname, 'results', `phase8_analysis_${timestamp}.json`);
const CHAPTER4_FILE = path.join(__dirname, 'results', `chapter4_quicksort_summary_${timestamp}.json`);

fs.writeFileSync(PHASE8_FILE, JSON.stringify(analysis, null, 2));
fs.writeFileSync(CHAPTER4_FILE, JSON.stringify(chapter4Summary, null, 2));

console.log('Phase 8 Analysis Complete');
console.log('Output:', PHASE8_FILE);
console.log('Output:', CHAPTER4_FILE);
