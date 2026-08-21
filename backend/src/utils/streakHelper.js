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
 * Normalizes an arbitrary string or date to a midnight Date object in local timezone
 * @param {Date|string} date
 * @returns {Date}
 */
const normalizeToLocalDate = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Check if a habit is scheduled for a given date
 * @param {Array<number>} habitSchedules 
 * @param {Date} dateObj 
 * @returns {boolean}
 */
const isScheduled = (habitSchedules, dateObj) => {
  return habitSchedules.includes(dateObj.getDay());
};

/**
 * Calculate the maximum streak across all given habits.
 * A streak is the number of consecutive scheduled occurrences that were completed,
 * starting from the evaluation date backwards.
 * 
 * @param {Array} activeHabits - List of active habits
 * @param {Array} completionHistory - List of all completion records
 * @param {Array} schedules - List of all schedule records
 * @param {Date|string} todayDate - The reference date (usually today)
 * @returns {number} The maximum streak across all active habits
 */
const calculateMaxStreak = (activeHabits, completionHistory, schedules, todayDate) => {
  const todayLocal = normalizeToLocalDate(todayDate);
  
  // Parse completions into a Set of local date strings for quick lookup
  const completionsByHabit = {};
  for (const c of completionHistory) {
    const cDate = normalizeToLocalDate(c.completed_at);
    if (!completionsByHabit[c.habit_id]) {
      completionsByHabit[c.habit_id] = new Set();
    }
    completionsByHabit[c.habit_id].add(getLocalDateString(cDate));
  }

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

  return maxStreak;
};

module.exports = {
  isScheduled,
  calculateMaxStreak
};
