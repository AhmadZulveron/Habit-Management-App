const { quickSort } = require('./src/engines/quickSort');
const { calculateScores } = require('./src/engines/scoringEngine');

function runTests() {
  console.log('--- RUNNING TESTS FOR QUICKSORT ---');
  let passed = 0;
  let failed = 0;

  function assertEqual(testName, actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} | Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      failed++;
    }
  }

  function assert(testName, condition) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const compareFn = (a, b) => b.relevanceScore - a.relevanceScore;

  // A. Empty array
  const resA = quickSort([], compareFn);
  assertEqual('Empty array -> Empty array', resA.sortedArray, []);
  
  // B. Single candidate
  const single = [{ id: 1, relevanceScore: 50 }];
  const resB = quickSort(single, compareFn);
  assertEqual('Single candidate -> Unchanged', resB.sortedArray, single);

  // C. Ascending input
  const asc = [{ relevanceScore: 10 }, { relevanceScore: 20 }, { relevanceScore: 30 }, { relevanceScore: 40 }];
  const resC = quickSort(asc, compareFn);
  assertEqual('Ascending -> Descending', resC.sortedArray.map(x => x.relevanceScore), [40, 30, 20, 10]);

  // D. Descending input
  const desc = [{ relevanceScore: 40 }, { relevanceScore: 30 }, { relevanceScore: 20 }, { relevanceScore: 10 }];
  const resD = quickSort(desc, compareFn);
  assertEqual('Descending -> Unchanged', resD.sortedArray.map(x => x.relevanceScore), [40, 30, 20, 10]);

  // E. Random input
  const rand = [{ relevanceScore: 25 }, { relevanceScore: 75 }, { relevanceScore: 15 }, { relevanceScore: 50 }];
  const resE = quickSort(rand, compareFn);
  assertEqual('Random -> Descending', resE.sortedArray.map(x => x.relevanceScore), [75, 50, 25, 15]);

  // F. Duplicate scores
  const dups = [
    { id: 1, relevanceScore: 90 }, 
    { id: 2, relevanceScore: 70 }, 
    { id: 3, relevanceScore: 90 }, 
    { id: 4, relevanceScore: 50 }, 
    { id: 5, relevanceScore: 70 }
  ];
  const resF = quickSort(dups, compareFn);
  assertEqual('Duplicate scores -> Sorted Descending', resF.sortedArray.map(x => x.relevanceScore), [90, 90, 70, 70, 50]);

  // G. Decimal scores
  const decs = [{ relevanceScore: 74.5 }, { relevanceScore: 91.2 }, { relevanceScore: 63.75 }];
  const resG = quickSort(decs, compareFn);
  assertEqual('Decimal scores -> Correct order', resG.sortedArray.map(x => x.relevanceScore), [91.2, 74.5, 63.75]);

  // H. Boundary scores
  const bounds = [{ relevanceScore: 0 }, { relevanceScore: 100 }, { relevanceScore: 50 }];
  const resH = quickSort(bounds, compareFn);
  assertEqual('Boundary scores -> Correct order', resH.sortedArray.map(x => x.relevanceScore), [100, 50, 0]);

  // I. Candidate object preservation & Mutability
  const originalCands = [
    { id: 1, category_id: 10, relevanceScore: 30, customProp: 'hello' },
    { id: 2, category_id: 20, relevanceScore: 80, customProp: 'world' }
  ];
  const resI = quickSort(originalCands, compareFn);
  assert('Candidate object structure completely preserved', 
    resI.sortedArray[0].id === 2 && 
    resI.sortedArray[0].category_id === 20 && 
    resI.sortedArray[0].customProp === 'world'
  );
  assert('Original array is NOT mutated (shallow copy worked)', originalCands[0].id === 1);

  // J. Metric collection
  assert('Execution time exists and >= 0', typeof resC.metrics.executionTimeMs === 'number' && resC.metrics.executionTimeMs >= 0);
  assert('Comparisons counted > 0', resC.metrics.comparisons > 0);
  assert('Swaps counted >= 0', resC.metrics.swaps >= 0); // swaps could theoretically be 0 if perfectly in place, but here it shouldn't be

  // K. Integration test
  // Rule Engine output mock
  const ruleEngineOutput = {
    candidates: [
      { id: 1, category_id: 10, priority: 2 },
      { id: 2, category_id: 20, priority: 3 },
      { id: 3, category_id: 30, priority: 1 }
    ]
  };
  const mockUserContext = { habits: [], completionHistory: [], schedules: [] };
  
  // Scoring Engine output
  const scoredCands = calculateScores(mockUserContext, ruleEngineOutput.candidates);
  // Let's artificially assign scores so they aren't all 0
  scoredCands[0].relevanceScore = 40;
  scoredCands[1].relevanceScore = 90;
  scoredCands[2].relevanceScore = 60;
  
  const resK = quickSort(scoredCands, compareFn);
  
  assertEqual('Integration - Final array sorted', resK.sortedArray.map(x => x.relevanceScore), [90, 60, 40]);
  assertEqual('Integration - Priority does NOT override relevance', resK.sortedArray.map(x => x.id), [2, 3, 1]); // id 3 has priority 1, id 1 has priority 2, but id 3 scored higher

  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
}

runTests();
