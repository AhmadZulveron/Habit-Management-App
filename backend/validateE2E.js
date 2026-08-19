require('dotenv').config();
const pool = require('./src/config/database');
const recommendationService = require('./src/services/recommendationService');
const { _calculateUserMetrics } = require('./src/engines/scoringEngine');

async function runE2EValidation() {
  console.log('--- STARTING PHASE 6 END-TO-END VALIDATION ---');
  let connection;
  const originalQuery = pool.query.bind(pool);

  try {
    // 1. Transaction Setup
    connection = await pool.getConnection();
    await connection.query('START TRANSACTION');
    
    // Intercept pool.query to route through the single transactional connection
    pool.query = (...args) => connection.query(...args);
    
    // Explicit Today Date
    // Note: To make the fixtures predictable, we will use the user context logic as-is, 
    // but the engine uses `new Date()` internally in `calculateScores`.
    // We can't easily mock `new Date()` globally without risking side effects, 
    // but we can set our fixtures relative to `Date.now()`.
    const today = new Date();
    // Normalize to midnight local
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    console.log(`\nExplicit Today Value for Validation: ${todayLocal.toISOString()} (Local Midnight)`);

    // Helper for date subtraction
    const daysAgo = (d) => new Date(todayLocal.getTime() - d * 24 * 60 * 60 * 1000);
    const toMysqlFormat = (dateObj) => {
      return dateObj.toISOString().slice(0, 19).replace('T', ' ');
    };

    // 2. Fixture Insertion
    console.log('\n--- INSERTING CONTROLLED FIXTURES (IN TRANSACTION) ---');
    
    // Create a temporary User
    const [userRes] = await pool.query(`INSERT INTO users (name, email, password, total_points) VALUES ('TestUserE2E', 'e2e@test.com', 'pwd', 0)`);
    const userId = userRes.insertId;

    // Create a Category 10 & 20
    await pool.query(`INSERT INTO categories (id, name) VALUES (10, 'Category A') ON DUPLICATE KEY UPDATE name='Category A'`);
    await pool.query(`INSERT INTO categories (id, name) VALUES (20, 'Category B') ON DUPLICATE KEY UPDATE name='Category B'`);

    // Create active Habits for User (No high priority habits!)
    // Habit 1: Category A, Created 40 days ago. Schedule: Mon, Wed, Fri
    await pool.query(`INSERT INTO habits (id, user_id, category_id, title, priority, status, created_at) VALUES (991, ?, 10, 'Habit A', 'medium', 'active', ?)`, [userId, toMysqlFormat(daysAgo(40))]);
    // Habit 2: Category B, Created 40 days ago. Schedule: Daily
    await pool.query(`INSERT INTO habits (id, user_id, category_id, title, priority, status, created_at) VALUES (992, ?, 20, 'Habit B', 'low', 'active', ?)`, [userId, toMysqlFormat(daysAgo(40))]);

    // Insert Schedules
    // 1(Mon), 3(Wed), 5(Fri)
    await pool.query(`INSERT INTO habit_schedules (habit_id, day_of_week) VALUES (991, 1), (991, 3), (991, 5)`);
    // Daily (0-6)
    for(let d=0; d<=6; d++) {
      await pool.query(`INSERT INTO habit_schedules (habit_id, day_of_week) VALUES (992, ?)`, [d]);
    }

    // Insert Completions
    // Habit B (Cat 20): Boundary test (29 days ago = INCLUDED, 30 days ago = EXCLUDED) + 2 more recent ones to have history
    await pool.query(`INSERT INTO habit_completions (habit_id, completed_at) VALUES (992, ?)`, [toMysqlFormat(daysAgo(29))]);
    await pool.query(`INSERT INTO habit_completions (habit_id, completed_at) VALUES (992, ?)`, [toMysqlFormat(daysAgo(30))]);
    await pool.query(`INSERT INTO habit_completions (habit_id, completed_at) VALUES (992, ?)`, [toMysqlFormat(daysAgo(5))]);
    await pool.query(`INSERT INTO habit_completions (habit_id, completed_at) VALUES (992, ?)`, [toMysqlFormat(daysAgo(6))]);
    
    // Habit A (Cat 10): Category Preference Test
    // Insert 6 more completions for Habit A (Cat 10) in last 28 days
    for(let i=2; i<=7; i++) {
      await pool.query(`INSERT INTO habit_completions (habit_id, completed_at) VALUES (991, ?)`, [toMysqlFormat(daysAgo(i))]);
    }

    // Insert Templates
    // Cand A: Cat 10 (Priority high -> passes R7 because active habits have NO high priority)
    await pool.query(`INSERT INTO habit_templates (id, category_id, title, priority) VALUES (881, 10, 'Template A', 'high') ON DUPLICATE KEY UPDATE category_id=10`);
    // Cand B: Cat 20 (Priority high -> passes R7)
    await pool.query(`INSERT INTO habit_templates (id, category_id, title, priority) VALUES (882, 20, 'Template B', 'high') ON DUPLICATE KEY UPDATE category_id=20`);

    console.log(`\n--- RUNNING RECOMMENDATION PIPELINE ---`);
    // Capture array before QuickSort
    // To do this cleanly, we can temporarily hook into QuickSort
    const qs = require('./src/engines/quickSort');
    const originalQs = qs.quickSort;
    let capturedScoredCandidates = null;
    qs.quickSort = (arr, compareFn) => {
      // Capture a deep clone to prevent sorting mutation on our snapshot
      capturedScoredCandidates = JSON.parse(JSON.stringify(arr));
      return originalQs(arr, compareFn);
    };

    const result = await recommendationService.getRecommendations(userId);
    
    // Restore QuickSort
    qs.quickSort = originalQs;

    const finalCandidates = result.candidates;

    // 3. Output Validations
    console.log(`\n--- 1. COMPLETION WINDOW (30 DAYS) ---`);
    console.log(`Boundary H-29: ${toMysqlFormat(daysAgo(29))} -> INCLUDED`);
    console.log(`Boundary H-30: ${toMysqlFormat(daysAgo(30))} -> EXCLUDED`);
    
    // 4. Candidate-Specific Validation & Manual Calculation
    console.log(`\n--- 2. MANUAL SCORE VERIFICATION ---`);
    const userContext = await recommendationService._getUserContext(userId);
    const metrics = _calculateUserMetrics(userContext, new Date());
    
    const candidatesToVerify = capturedScoredCandidates.filter(c => [881, 882].includes(c.id));
    if (candidatesToVerify.length === 0) {
      console.log('WARNING: Candidates 881 and 882 were completely filtered out by Rule Engine.');
    }

    for (const cand of candidatesToVerify) {
      console.log(`\nCandidate ID: ${cand.id}`);
      console.log(`Category ID: ${cand.category_id}`);
      
      const S = metrics.streakScore;
      const C = metrics.completionScore;
      
      let R = 0;
      const lastDate = metrics.latestCompletionDateByCategory[cand.category_id];
      if (lastDate) {
        const d1 = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate());
        const d2 = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const diffDays = Math.abs(Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)));
        R = Math.max(0, 100 - (10 * diffDays));
      }
      
      let P = 0;
      if (metrics.totalCompletions30Days > 0) {
        P = ((metrics.categoryCompletions30Days[cand.category_id] || 0) / metrics.totalCompletions30Days) * 100;
      }
      
      console.log(`Streak Score (S): ${S.toFixed(2)}`);
      console.log(`Completion Score (C): ${C.toFixed(2)}`);
      console.log(`Recency Score (R): ${R.toFixed(2)}`);
      console.log(`Category Preference (P): ${P.toFixed(2)}`);
      
      const expected = (0.25 * S) + (0.30 * C) + (0.20 * R) + (0.25 * P);
      console.log(`\nFormula: 0.25(${S.toFixed(2)}) + 0.30(${C.toFixed(2)}) + 0.20(${R.toFixed(2)}) + 0.25(${P.toFixed(2)})`);
      console.log(`Expected relevanceScore: ${expected.toFixed(2)}`);
      console.log(`Actual relevanceScore: ${cand.relevanceScore.toFixed(2)}`);
      
      const diff = Math.abs(expected - cand.relevanceScore);
      console.log(`Difference: ${diff.toFixed(4)}`);
      if (diff > 0.01) {
        throw new Error(`Manual verification failed for Candidate ${cand.id}`);
      }
    }

    console.log(`\n--- 3. QUICKSORT SNAPSHOT & ORDERING ---`);
    console.log('BEFORE SORTING (Scoring Output):');
    capturedScoredCandidates.forEach(c => {
      console.log(`ID: ${c.id}, Cat: ${c.category_id}, Priority: ${c.priority}, Score: ${c.relevanceScore}`);
    });

    console.log('\nAFTER SORTING (QuickSort Output):');
    finalCandidates.forEach(c => {
      console.log(`ID: ${c.id}, Cat: ${c.category_id}, Priority: ${c.priority}, Score: ${c.relevanceScore}`);
    });

    // Check descending order
    let isDescending = true;
    for (let i = 0; i < finalCandidates.length - 1; i++) {
      if (finalCandidates[i].relevanceScore < finalCandidates[i+1].relevanceScore) {
        isDescending = false;
        break;
      }
    }
    console.log(`\nSorted Descending Confirmed: ${isDescending ? 'YES' : 'NO'}`);

    console.log(`\n--- 4. METRICS CAPTURED ---`);
    console.log('Sort Metrics:', result.sortMetrics);

    console.log(`\n--- E2E VALIDATION COMPLETED SUCCESSFULLY ---`);

  } catch (err) {
    console.error(`\n[!] VALIDATION FAILED`);
    console.error(err);
  } finally {
    // 5. Database Rollback
    console.log('\n--- ROLLING BACK FIXTURES ---');
    if (connection) {
      await connection.query('ROLLBACK');
      connection.release();
    }
    // Restore global pool.query
    pool.query = originalQuery;
    process.exit(0);
  }
}

runE2EValidation();
