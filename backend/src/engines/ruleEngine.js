/**
 * Rule Engine
 * Evaluates contextual and candidate-specific rules for recommendations.
 */

/**
 * Normalizes a date to YYYY-MM-DD
 * @param {Date|string} date 
 * @returns {string}
 */
const normalizeDate = (date) => {
  const d = new Date(date);
  // Ensure it's formatted in the local timezone perspective if needed, 
  // but using simple string splitting is safest for ISO dates.
  return d.toISOString().split('T')[0];
};

/**
 * Gets the difference in calendar days between two normalized date strings
 * @param {string} date1 YYYY-MM-DD
 * @param {string} date2 YYYY-MM-DD
 * @returns {number}
 */
const getDayDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1 - d2);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Evaluate rules for a user to filter applicable recommendations
 * 
 * @param {object} userContext - User data including habits and completions
 * @param {Array} candidates - All available recommendations (habit_templates)
 * @returns {object} { userContext: [], candidates: [] }
 */
const evaluateRules = (userContext, candidates) => {
  const { habits = [], completionHistory = [] } = userContext;
  
  const todayNormalized = normalizeDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayNormalized = normalizeDate(yesterdayDate);

  // Group active vs inactive habits
  const activeHabits = habits.filter(h => h.status === 'active');
  const activeHabitCategoryIds = new Set(activeHabits.map(h => h.category_id));
  const activeHabitsHaveHighPriority = activeHabits.some(h => h.priority === 'high');

  // R1: Prepare normalized titles for duplicate filtering (All habits)
  const userHabitTitles = new Set(habits.map(h => h.title.trim().toLowerCase()));

  // Process completion history for streaks and recency
  // Map habits to their unique, descending completion dates
  const completionsByHabit = {};
  for (const c of completionHistory) {
    const normDate = normalizeDate(c.completed_at);
    if (!completionsByHabit[c.habit_id]) {
      completionsByHabit[c.habit_id] = new Set();
    }
    completionsByHabit[c.habit_id].add(normDate);
  }

  let hasHighStreak = false; // R2
  let allActiveHabitsInactive = false; // R3

  if (activeHabits.length > 0) {
    let minDaysInactive = Infinity;

    for (const habit of activeHabits) {
      // Calculate Streak
      let currentStreak = 0;
      const dates = completionsByHabit[habit.id] ? Array.from(completionsByHabit[habit.id]).sort().reverse() : [];
      
      if (dates.length > 0) {
        // Streak must include today or yesterday
        if (dates[0] === todayNormalized || dates[0] === yesterdayNormalized) {
          currentStreak = 1;
          let expectedNextDate = new Date(dates[0]);
          for (let i = 1; i < dates.length; i++) {
            expectedNextDate.setDate(expectedNextDate.getDate() - 1);
            if (dates[i] === normalizeDate(expectedNextDate)) {
              currentStreak++;
            } else {
              break; // Streak broken
            }
          }
        }
      }

      if (currentStreak >= 7) {
        hasHighStreak = true;
      }

      // Calculate Inactivity
      let daysInactive;
      if (dates.length > 0) {
        daysInactive = getDayDifference(todayNormalized, dates[0]);
      } else {
        daysInactive = getDayDifference(todayNormalized, normalizeDate(habit.created_at));
      }
      
      if (daysInactive < minDaysInactive) {
        minDaysInactive = daysInactive;
      }
    }

    // If the minimum days inactive across all active habits is >= 3, all are inactive
    if (minDaysInactive >= 3 && minDaysInactive !== Infinity) {
      allActiveHabitsInactive = true;
    }
  }

  // Build Output Context
  const outputUserContext = [];
  if (hasHighStreak) {
    outputUserContext.push({
      ruleId: 'R2',
      text: 'Pengguna berhasil mempertahankan konsistensi (streak) yang tinggi.'
    });
  }
  if (allActiveHabitsInactive) {
    outputUserContext.push({
      ruleId: 'R3',
      text: 'Pengguna memiliki kebiasaan aktif yang tidak dikerjakan baru-baru ini.'
    });
  }

  // Broad Eligibility checks
  const isColdStart = habits.length === 0; // R4
  const isAllInactive = habits.length > 0 && activeHabits.length === 0; // R5

  // Process Candidates
  const eligibleCandidates = [];

  for (const candidate of candidates) {
    // R1: Duplicate filter
    if (userHabitTitles.has(candidate.title.trim().toLowerCase())) {
      continue;
    }

    const matchedRules = [];
    const candidateReasons = [];

    // R4 & R5: Broad eligibility
    if (isColdStart) {
      matchedRules.push('R4');
      candidateReasons.push({
        ruleId: 'R4',
        text: 'Pengguna belum pernah membuat kebiasaan, kandidat ini cocok untuk memulai rutinitas.'
      });
    } else if (isAllInactive) {
      matchedRules.push('R5');
      candidateReasons.push({
        ruleId: 'R5',
        text: 'Karena belum ada kebiasaan yang aktif saat ini, cobalah memulai kembali dengan rutinitas ini.'
      });
    }

    // Candidate-specific eligibility (Only if R4 & R5 are false, or if we want to enrich them)
    // Actually, R4/R5 make ALL candidates eligible (broad). We only append R6/R7 if we want to enrich.
    // The plan says: "Templates ONLY become eligible if they individually match R6 or R7" (when R4 & R5 are false).
    // Let's add them regardless so we have more reasons.

    // R6: Missing Active Category
    if (activeHabits.length > 0 && !activeHabitCategoryIds.has(candidate.category_id)) {
      matchedRules.push('R6');
      candidateReasons.push({
        ruleId: 'R6',
        text: 'Eksplorasi kategori baru ini untuk menyeimbangkan rutinitas harianmu.'
      });
    }

    // R7: Missing High-Priority Habit
    if (activeHabits.length > 0 && !activeHabitsHaveHighPriority && candidate.priority === 'high') {
      matchedRules.push('R7');
      candidateReasons.push({
        ruleId: 'R7',
        text: 'Tambahkan kebiasaan prioritas tinggi ini untuk rutinitas yang lebih berdampak.'
      });
    }

    // If candidate matched at least one broad or specific rule, it's eligible
    if (matchedRules.length > 0) {
      eligibleCandidates.push({
        ...candidate,
        matchedRules,
        candidateReasons
      });
    }
  }

  return {
    userContext: outputUserContext,
    candidates: eligibleCandidates
  };
};

module.exports = {
  evaluateRules
};
