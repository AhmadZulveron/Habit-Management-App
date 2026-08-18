const pool = require('../config/database');

/**
 * Report Service
 * Business logic for generating habit completion reports
 */
class ReportService {
  /**
   * Generates a weekly report for the user based on selected start and end dates.
   * @param {number} userId 
   * @param {string} startDate Format: YYYY-MM-DD
   * @param {string} endDate Format: YYYY-MM-DD
   */
  async getWeeklyReport(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      // 1. Fetch active habits and their schedules for the user
      const [habits] = await connection.query(
        `SELECT h.id, h.title, h.created_at, 
                GROUP_CONCAT(hs.day_of_week) as schedule_days
         FROM habits h
         LEFT JOIN habit_schedules hs ON h.id = hs.habit_id
         WHERE h.user_id = ? AND h.status = 'active'
         GROUP BY h.id`,
        [userId]
      );

      // 2. Fetch all completions for the user within the date range
      const [completions] = await connection.query(
        `SELECT hc.id, hc.completed_at, h.title
         FROM habit_completions hc
         JOIN habits h ON hc.habit_id = h.id
         WHERE h.user_id = ? AND DATE(hc.completed_at) BETWEEN ? AND ?
         ORDER BY hc.completed_at DESC`,
        [userId, startDate, endDate]
      );

      // Initialize structures
      const startParts = startDate.split('-');
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      
      const endParts = endDate.split('-');
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

      const dailyProgress = [];
      let totalScheduled = 0;
      let totalCompleted = 0;

      // Loop through each day in the range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayOfWeek = d.getDay(); // 0 = Sunday
        const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek];

        let scheduledToday = 0;
        let completedToday = 0;

        // Calculate scheduled occurrences for this day
        for (const habit of habits) {
           const habitCreatedDate = new Date(habit.created_at);
           habitCreatedDate.setHours(0, 0, 0, 0);
           const currentDayDate = new Date(d);
           currentDayDate.setHours(0, 0, 0, 0);
           
           // Only count if the habit existed on or before this day
           if (currentDayDate >= habitCreatedDate) {
              if (habit.schedule_days) {
                  const scheduleArr = habit.schedule_days.split(',').map(Number);
                  if (scheduleArr.includes(dayOfWeek)) {
                      scheduledToday++;
                  }
              }
           }
        }

        // Calculate completions for this day
        for (const comp of completions) {
           const compDateStr = `${comp.completed_at.getFullYear()}-${String(comp.completed_at.getMonth() + 1).padStart(2, '0')}-${String(comp.completed_at.getDate()).padStart(2, '0')}`;
           if (compDateStr === currentDateStr) {
               completedToday++;
           }
        }

        totalScheduled += scheduledToday;
        totalCompleted += completedToday;
        
        let rate = 0;
        if (scheduledToday > 0) {
            rate = parseFloat(((completedToday / scheduledToday) * 100).toFixed(2));
        }

        dailyProgress.push({
            date: currentDateStr,
            dayName: dayName,
            scheduled: scheduledToday,
            completed: completedToday,
            rate: rate
        });
      }
      
      // Calculate overall completion rate
      let completionRate = 0;
      if (totalScheduled > 0) {
          completionRate = parseFloat(((totalCompleted / totalScheduled) * 100).toFixed(2));
      }

      // Format completion history
      const history = completions.map(c => ({
          id: c.id,
          title: c.title,
          completedAt: c.completed_at // This will be serialized to ISO 8601 by Express
      }));

      return {
          startDate,
          endDate,
          totalScheduled,
          totalCompleted,
          completionRate,
          dailyProgress,
          history
      };

    } finally {
      connection.release();
    }
  }
}

module.exports = new ReportService();
