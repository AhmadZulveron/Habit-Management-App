const { _calculateUserMetrics, calculateScore, _normalizeToLocalDate } = require('./src/engines/scoringEngine');

function runTests() {
  console.log('--- RUNNING TESTS FOR SCORING ENGINE ---');
  let passed = 0;
  let failed = 0;

  function assertEqual(testName, actual, expected) {
    // Add small tolerance for floats
    if (Math.abs(actual - expected) < 0.001) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} | Expected ${expected}, got ${actual}`);
      failed++;
    }
  }

  // Common setup
  const todayDate = new Date('2026-08-19T10:00:00Z'); // Wednesday
  const todayLocal = _normalizeToLocalDate(todayDate);
  // Wednesday is day 3

  // Habit A: Scheduled Mon, Wed, Fri (1, 3, 5)
  const habitA = {
    id: 1,
    status: 'active',
    category_id: 10,
    created_at: new Date(todayLocal.getTime() - 40 * 24 * 60 * 60 * 1000) // 40 days ago
  };

  const schedules = [
    { habit_id: 1, day_of_week: 1 },
    { habit_id: 1, day_of_week: 3 },
    { habit_id: 1, day_of_week: 5 }
  ];

  // Helper to create completion
  const createComp = (habitId, daysAgo) => ({
    habit_id: habitId,
    completed_at: new Date(todayLocal.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  });

  // Test: Cold Start
  const coldMetrics = _calculateUserMetrics({ habits: [], completionHistory: [], schedules: [] }, todayDate);
  assertEqual('Cold Start - Streak Score = 0', coldMetrics.streakScore, 0);
  assertEqual('Cold Start - Completion Score = 0', coldMetrics.completionScore, 0);
  const coldScore = calculateScore(coldMetrics, { category_id: 10 });
  assertEqual('Cold Start - Final Score = 0', coldScore, 0);

  // Test: Streak - Today pending
  // Mon completed, Wed pending. Today is Wed.
  const metricsPending = _calculateUserMetrics({
    habits: [habitA],
    completionHistory: [createComp(1, 2)], // Completed Mon (2 days ago)
    schedules
  }, todayDate);
  assertEqual('Streak - Today Pending (Mon completed) -> streak 1', Math.round(metricsPending.streakScore / (100/30)), 1);

  // Test: Streak - Missed occurrence
  // Mon completed, Wed missed, Fri is today pending.
  const fridayDate = new Date('2026-08-21T10:00:00Z'); // Friday
  const metricsMissed = _calculateUserMetrics({
    habits: [habitA],
    completionHistory: [createComp(1, 4)], // Completed Mon(4 days ago). Missed Wed(2 days ago).
    schedules
  }, fridayDate);
  assertEqual('Streak - Missed occurrence -> streak 0', Math.round(metricsMissed.streakScore / (100/30)), 0);

  // Test: 30-day boundary test for Completion Rate
  // 1 completion 29 days ago (in window), 1 completion 30 days ago (outside window)
  // Window is today + 29 previous days = exactly 30 days.
  // Today is day 0. 29 days ago is day 29. 30 days ago is day 30 (outside).
  const habitDaily = { id: 2, status: 'active', category_id: 20, created_at: new Date(todayLocal.getTime() - 40 * 24 * 60 * 60 * 1000) };
  const dailySchedules = [0,1,2,3,4,5,6].map(d => ({ habit_id: 2, day_of_week: d }));
  
  const metricsBoundary = _calculateUserMetrics({
    habits: [habitDaily],
    completionHistory: [createComp(2, 29), createComp(2, 30)],
    schedules: dailySchedules
  }, todayDate);
  // Exactly 30 scheduled days in the window. Only 1 completion inside the window (day 29). Day 30 is outside.
  assertEqual('Completion Rate - 30-day boundary (1/30 inside)', metricsBoundary.completionScore, (1 / 30) * 100);

  // Test: Category Preference Score & Recency Score
  const compsCategory = [];
  for(let i=0; i<7; i++) compsCategory.push(createComp(1, i+1)); // Cat 10
  for(let i=0; i<3; i++) compsCategory.push(createComp(2, i+1)); // Cat 20
  const metricsCategory = _calculateUserMetrics({
    habits: [habitA, habitDaily],
    completionHistory: compsCategory,
    schedules: [...schedules, ...dailySchedules]
  }, todayDate);
  
  // Cat 10 total completions = 7, Cat 20 total completions = 3. Total = 10.
  // Last completion for Cat 10 was 1 day ago. Recency = 90.
  // Last completion for Cat 20 was 1 day ago. Recency = 90.
  
  // Test: Candidate-specific score differences
  // Candidate in Cat 10 vs Candidate in Cat 20
  // Cat 10 Pref = 70. Cat 20 Pref = 30.
  // R=90 for both. S & C are user-level, so identical for both.
  const scoreCat10 = calculateScore(metricsCategory, { category_id: 10 });
  const scoreCat20 = calculateScore(metricsCategory, { category_id: 20 });
  
  assertEqual('Candidate Specific - Cat 10 gets higher score than Cat 20', scoreCat10 > scoreCat20 ? 1 : 0, 1);
  // Verify exact preference internally
  assertEqual('Category Preference - Cat 10 is 70%', (metricsCategory.categoryCompletions30Days[10] / metricsCategory.totalCompletions30Days) * 100, 70);
  assertEqual('Category Preference - Cat 20 is 30%', (metricsCategory.categoryCompletions30Days[20] / metricsCategory.totalCompletions30Days) * 100, 30);

  // Test: Full-formula test
  // S=60, C=80, R=90, P=70 → expected Relevance Score=74.5.
  // Formula: 0.25*60 + 0.30*80 + 0.20*90 + 0.25*70 = 15 + 24 + 18 + 17.5 = 74.5
  const mockMetrics = {
    streakScore: 60,
    completionScore: 80,
    latestCompletionDateByCategory: { 99: new Date(todayLocal.getTime() - 1 * 24 * 60 * 60 * 1000) }, // 1 day ago -> R=90
    categoryCompletions30Days: { 99: 7 },
    totalCompletions30Days: 10, // P = 7/10*100 = 70
    todayLocal: todayLocal
  };
  const fullScore = calculateScore(mockMetrics, { category_id: 99 });
  assertEqual('Full Formula (S=60, C=80, R=90, P=70) -> 74.5', fullScore, 74.5);

  // Explicitly assert Recency degradation outside 30 days
  // R=0 if 12 days ago
  const mockMetricsRecency0 = {
    ...mockMetrics,
    latestCompletionDateByCategory: { 99: new Date(todayLocal.getTime() - 12 * 24 * 60 * 60 * 1000) } // 12 days ago -> max(0, 100-120)=0
  };
  const rec0Score = calculateScore(mockMetricsRecency0, { category_id: 99 });
  // S=60, C=80, R=0, P=70 -> 15 + 24 + 0 + 17.5 = 56.5
  assertEqual('Recency Score drops to 0 at 12 days', rec0Score, 56.5);

  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
}

runTests();
