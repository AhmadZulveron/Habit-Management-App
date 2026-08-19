/**
 * Scoring Engine - Relevance Score v1.0
 * 
 * Calculates relevance scores for recommendations based on 4 factors:
 * 1. Streak Score (25%) - User Context Metric
 * 2. Completion Score (30%) - User Context Metric
 * 3. Recency Score (20%) - Candidate-Category Metric
 * 4. Category Preference Score (25%) - Candidate-Category Metric
 * 
 * Uses consistent LOCAL timezone date handling to prevent offset errors.
 */

/**
 * Returns a normalized local date string YYYY-MM-DD
 * @param {Date} dateObj
 * @returns {string}
 */
const getLocalDateString = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Returns the difference in calendar days between two Date objects
 * @param {Date} dateObj1 
 * @param {Date} dateObj2 
 * @returns {number}
 */
const getDayDifference = (dateObj1, dateObj2) => {
  const d1 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate());
  const d2 = new Date(dateObj2.getFullYear(), dateObj2.getMonth(), dateObj2.getDate());
  return Math.abs(Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)));
};

/**
 * Normalizes an arbitrary string or date to a midnight Date object in local timezone
 * @param {Date|string} date
 * @returns {Date}
 */
const normalizeToLocalDate = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Check if a specific Date is a scheduled day for a habit
 * @param {Array} habitSchedules - array of day_of_week integers (0=Sun, 6=Sat)
 * @param {Date} dateObj 
 * @returns {boolean}
 */
const isScheduled = (habitSchedules, dateObj) => {
  return habitSchedules.includes(dateObj.getDay());
};

/**
 * Calculate user context metrics (Streak & Completion Rate)
 */
const calculateUserMetrics = (userContext, todayDate) => {
  const { habits = [], completionHistory = [], schedules = [] } = userContext;
  const activeHabits = habits.filter(h => h.status === 'active');
  const todayLocal = normalizeToLocalDate(todayDate);
  const todayLocalString = getLocalDateString(todayLocal);

  // Parse completions into a Set of local date strings for quick lookup
  const completionsByHabit = {};
  for (const c of completionHistory) {
    const cDate = normalizeToLocalDate(c.completed_at);
    if (!completionsByHabit[c.habit_id]) {
      completionsByHabit[c.habit_id] = new Set();
    }
    completionsByHabit[c.habit_id].add(getLocalDateString(cDate));
  }

  // --- 1. Streak Score (25%) ---
  let maxStreak = 0;
  for (const habit of activeHabits) {
    let currentStreak = 0;
    const habitSchedules = schedules.filter(s => s.habit_id === habit.id).map(s => s.day_of_week);
    
    // Evaluate starting from today
    let evalDate = new Date(todayLocal);
    let evalDateString = getLocalDateString(evalDate);
    const hasTodayCompletion = completionsByHabit[habit.id] && completionsByHabit[habit.id].has(evalDateString);
    
    // If today is scheduled but NOT completed yet (pending), skip today
    if (isScheduled(habitSchedules, evalDate) && !hasTodayCompletion) {
      evalDate.setDate(evalDate.getDate() - 1);
      evalDateString = getLocalDateString(evalDate);
    }
    
    const habitCreatedDate = normalizeToLocalDate(habit.created_at);

    // Walk backwards indefinitely through calendar days
    // Stop when we reach before the habit was created
    while (evalDate >= habitCreatedDate) {
      if (isScheduled(habitSchedules, evalDate)) {
        if (completionsByHabit[habit.id] && completionsByHabit[habit.id].has(evalDateString)) {
          currentStreak++;
        } else {
          // Missed scheduled occurrence instantly terminates the streak
          break;
        }
      }
      evalDate.setDate(evalDate.getDate() - 1);
      evalDateString = getLocalDateString(evalDate);
    }
    
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }
  let streakScore = Math.min((maxStreak / 30.0) * 100, 100);

  // --- 2. Completion Score (30%) ---
  // Window is exactly 30 calendar days: today + previous 29 days
  const exact30Days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayLocal);
    d.setDate(d.getDate() - i);
    exact30Days.push({
      dateObj: d,
      dateStr: getLocalDateString(d)
    });
  }

  let scheduledOccurrences = 0;
  let completedOccurrences = 0;

  for (const habit of activeHabits) {
    const habitSchedules = schedules.filter(s => s.habit_id === habit.id).map(s => s.day_of_week);
    const habitCreatedDate = normalizeToLocalDate(habit.created_at);
    
    for (const day of exact30Days) {
      if (day.dateObj >= habitCreatedDate && isScheduled(habitSchedules, day.dateObj)) {
        scheduledOccurrences++;
        if (completionsByHabit[habit.id] && completionsByHabit[habit.id].has(day.dateStr)) {
          completedOccurrences++;
        }
      }
    }
  }

  let completionScore = scheduledOccurrences === 0 ? 0 : (completedOccurrences / scheduledOccurrences) * 100;

  // Additional prep for Candidate-Category Metrics
  // We need to count completions per category within the exact 30 days
  let totalCompletions30Days = 0;
  const categoryCompletions30Days = {};
  
  for (const habit of activeHabits) {
    categoryCompletions30Days[habit.category_id] = 0;
    const habitCreatedDate = normalizeToLocalDate(habit.created_at);
    for (const day of exact30Days) {
      // Just check actual completions in the last 30 days for this habit
      // We only count completions that occurred, regardless of if they were scheduled.
      if (completionsByHabit[habit.id] && completionsByHabit[habit.id].has(day.dateStr)) {
        categoryCompletions30Days[habit.category_id]++;
        totalCompletions30Days++;
      }
    }
  }

  // We also need Recency per category: findLatestCompletionDateForCategoryIndefinitely
  const latestCompletionDateByCategory = {};
  for (const c of completionHistory) {
    const habit = habits.find(h => h.id === c.habit_id);
    if (habit) {
      const cDate = normalizeToLocalDate(c.completed_at);
      if (!latestCompletionDateByCategory[habit.category_id] || cDate > latestCompletionDateByCategory[habit.category_id]) {
        latestCompletionDateByCategory[habit.category_id] = cDate;
      }
    }
  }

  return {
    streakScore,
    completionScore,
    totalCompletions30Days,
    categoryCompletions30Days,
    latestCompletionDateByCategory,
    todayLocal
  };
};

/**
 * Calculate Relevance Score for a single candidate
 */
const calculateScore = (metrics, candidate) => {
  const catId = candidate.category_id;
  
  // --- 3. Recency Score (20%) ---
  let recencyScore = 0;
  const lastCompletionDate = metrics.latestCompletionDateByCategory[catId];
  if (lastCompletionDate) {
    const d = getDayDifference(metrics.todayLocal, lastCompletionDate);
    recencyScore = Math.max(0, 100 - (10 * d));
  }

  // --- 4. Category Preference Score (25%) ---
  const catCompletions = metrics.categoryCompletions30Days[catId] || 0;
  let categoryPrefScore = metrics.totalCompletions30Days === 0 ? 0 : (catCompletions / metrics.totalCompletions30Days) * 100;

  // Final Formula
  const relevanceScore = (0.25 * metrics.streakScore) 
                       + (0.30 * metrics.completionScore) 
                       + (0.20 * recencyScore) 
                       + (0.25 * categoryPrefScore);
                       
  return parseFloat(relevanceScore.toFixed(2));
};

/**
 * Calculate scores for multiple recommendations
 */
const calculateScores = (userContext, recommendations) => {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }

  const todayDate = new Date();
  const metrics = calculateUserMetrics(userContext, todayDate);

  return recommendations.map((rec) => ({
    ...rec,
    relevanceScore: calculateScore(metrics, rec),
  }));
};

module.exports = {
  calculateScore,
  calculateScores,
  // Exported for unit testing
  _calculateUserMetrics: calculateUserMetrics,
  _normalizeToLocalDate: normalizeToLocalDate,
};
