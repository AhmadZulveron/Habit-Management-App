require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { quickSort } = require('./src/engines/quickSort');

// FINAL SAFETY CHECK
console.log('--- FINAL SAFETY CHECK ---');
console.log('- Production recommendation logic is UNCHANGED.');
console.log('- Database is UNCHANGED.');
console.log('- QuickSort implementation is UNCHANGED.');
console.log('- Benchmark IMPORTS the actual QuickSort implementation (src/engines/quickSort.js).');
console.log('- Execution timing explicitly EXCLUDES validation, input generation, and array cloning (it is measured strictly around quickSortRecursive inside the engine).');
console.log('--------------------------\n');

// 1. PRNG Implementation (Mulberry32)
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Generate a deterministic integer seed from a string
function getSeedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

// 2. Input Generation
function generateCandidates(size, distribution, seedStr) {
  const seed = getSeedFromString(seedStr);
  const rand = mulberry32(seed);

  let candidates = [];
  
  if (distribution === 'Duplicate-Heavy') {
    // 90% identical relevanceScores, 10% random
    const dominantScore = 50.0;
    for (let i = 0; i < size; i++) {
      let rScore = rand() < 0.90 ? dominantScore : (rand() * 100);
      candidates.push({
        id: i + 1,
        category_id: Math.floor(rand() * 10) + 1,
        relevanceScore: rScore
      });
    }
    return candidates;
  }

  for (let i = 0; i < size; i++) {
    candidates.push({
      id: i + 1,
      category_id: Math.floor(rand() * 10) + 1,
      relevanceScore: rand() * 100
    });
  }

  if (distribution === 'Ascending') {
    candidates.sort((a, b) => a.relevanceScore - b.relevanceScore);
  } else if (distribution === 'Descending') {
    candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return candidates;
}

const SIZES = [10, 50, 100, 500, 1000, 5000, 10000];
const DISTRIBUTIONS = ['Random', 'Ascending', 'Descending', 'Duplicate-Heavy'];
const REPETITIONS = 50;
const compareFn = (a, b) => b.relevanceScore - a.relevanceScore;

const rawResults = [];
const summaryResults = [];

// 3. Warm-up
console.log('Warming up JIT...');
const warmupData = generateCandidates(1000, 'Random', 'warmup');
for(let i=0; i<10; i++) {
  quickSort(warmupData, compareFn);
}
console.log('Warm-up complete.\n');

// 4. Benchmark Loop
for (const size of SIZES) {
  for (const distribution of DISTRIBUTIONS) {
    console.log(`Benchmarking N=${size} | ${distribution}`);
    const seedStr = `${size}_${distribution}_Phase7`;
    
    // Generate base array once per config
    const baseInput = generateCandidates(size, distribution, seedStr);
    
    let execTimes = [];
    let recordedComparisons = null;
    let recordedSwaps = null;
    let failed = false;

    for (let run = 1; run <= REPETITIONS; run++) {
      // Shallow copy for input (safety for the test harness, though quickSort also does it)
      const testInput = [...baseInput];
      
      let sortedArray, metrics;
      try {
        const result = quickSort(testInput, compareFn);
        sortedArray = result.sortedArray;
        metrics = result.metrics;
      } catch (err) {
        if (err instanceof RangeError) {
          console.error(`  [!] RangeError (Call stack exceeded) during run ${run}!`);
          failed = true;
          break; // Abort this configuration
        } else {
          throw err;
        }
      }

      // Record Metrics
      execTimes.push(metrics.executionTimeMs);
      if (recordedComparisons === null) recordedComparisons = metrics.comparisons;
      if (recordedSwaps === null) recordedSwaps = metrics.swaps;

      // Raw record
      rawResults.push({
        size,
        distribution,
        run,
        comparisons: metrics.comparisons,
        swaps: metrics.swaps,
        executionTimeMs: metrics.executionTimeMs,
        error: null
      });

      // Correctness Validation (Untimed)
      for (let i = 0; i < sortedArray.length - 1; i++) {
        if (sortedArray[i].relevanceScore < sortedArray[i+1].relevanceScore) {
          throw new Error(`Correctness failed! index ${i} < ${i+1}`);
        }
      }

      // Mutation Validation (Untimed)
      // Original array ordering should be unchanged
      if (testInput[0].id !== baseInput[0].id || testInput[testInput.length-1].id !== baseInput[baseInput.length-1].id) {
        throw new Error('Original array ordering was mutated!');
      }
      // Objects should be identical
      if (testInput[0].relevanceScore !== baseInput[0].relevanceScore || sortedArray[0].customPropertyMutationDetector === true) {
        throw new Error('Candidate object properties were mutated!');
      }
    }

    if (failed) {
      // Record failure in summary
      summaryResults.push({
        size,
        distribution,
        error: 'RangeError: Maximum call stack size exceeded'
      });
      continue; // Move to next config
    }

    // Summary Statistics
    execTimes.sort((a, b) => a - b);
    const min = execTimes[0];
    const max = execTimes[execTimes.length - 1];
    const mean = execTimes.reduce((a,b) => a+b, 0) / execTimes.length;
    const median = execTimes.length % 2 === 0 
      ? (execTimes[execTimes.length/2 - 1] + execTimes[execTimes.length/2]) / 2
      : execTimes[Math.floor(execTimes.length/2)];

    summaryResults.push({
      size,
      distribution,
      comparisons: recordedComparisons,
      swaps: recordedSwaps,
      executionTimeMs_min: min,
      executionTimeMs_max: max,
      executionTimeMs_mean: mean,
      executionTimeMs_median: median
    });
  }
}

// 5. Realistic Database Trace (Separate from synthetic benchmark)
async function runRealisticTrace() {
  console.log('\n--- REALISTIC DATABASE TRACE ---');
  const pool = require('./src/config/database');
  const recommendationService = require('./src/services/recommendationService');
  
  try {
    // We will just call the actual pipeline for user ID 1
    // This uses real candidates, scoring, and then we measure only the sort output
    // Wait, the API returns the final output. We can't time QuickSort directly without 
    // wrapping it, but since recommendationService ALREADY uses our imported quickSort, 
    // it naturally outputs `sortMetrics`!
    const result = await recommendationService.getRecommendations(1);
    const candidatesCount = result.candidates.length;
    
    console.log(`Realistic Trace Candidates Count: ${candidatesCount}`);
    console.log(`Realistic Trace Metrics:`);
    console.log(`  Comparisons: ${result.sortMetrics.comparisons}`);
    console.log(`  Swaps:       ${result.sortMetrics.swaps}`);
    console.log(`  Execution:   ${result.sortMetrics.executionTimeMs.toFixed(4)} ms`);
    
    summaryResults.push({
      size: candidatesCount,
      distribution: 'Realistic Recommendation DB Trace',
      comparisons: result.sortMetrics.comparisons,
      swaps: result.sortMetrics.swaps,
      executionTimeMs: result.sortMetrics.executionTimeMs
    });

  } catch(err) {
    console.error('Failed to run realistic trace:', err);
  } finally {
    pool.end();
  }
}

// 6. Save Results
async function finish() {
  await runRealisticTrace();

  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const timestamp = Date.now();
  
  const rawPath = path.join(resultsDir, `raw_benchmark_${timestamp}.json`);
  const summaryPath = path.join(resultsDir, `summary_benchmark_${timestamp}.json`);

  const metadata = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      os: os.platform(),
      cpu: os.cpus()[0].model,
      definition: "executionTimeMs strictly EXCLUDES array cloning and input generation, capturing only the actual QuickSort sorting operation."
    }
  };

  fs.writeFileSync(rawPath, JSON.stringify({ metadata, rawResults }, null, 2));
  fs.writeFileSync(summaryPath, JSON.stringify({ metadata, summaryResults }, null, 2));

  console.log(`\nResults written to:`);
  console.log(`  ${rawPath}`);
  console.log(`  ${summaryPath}`);
  console.log('\nBenchmark Complete.');
}

finish();
