require('dotenv').config();
const badgeService = require('./src/services/badgeService');
const habitService = require('./src/services/habitService');
const pool = require('./src/config/database');

async function createUser() {
    const email = 'user_' + Math.random().toString(36).substring(7) + '@test.com';
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Test User', email, 'password']
    );
    return result.insertId;
}

async function createHabit(userId, createdDaysAgo = 0) {
    let date = new Date();
    date.setDate(date.getDate() - createdDaysAgo);
    
    const [result] = await pool.query(
        'INSERT INTO habits (user_id, category_id, title, status, created_at) VALUES (?, 1, "Test Habit", "active", ?)',
        [userId, date]
    );
    const habitId = result.insertId;
    
    // Add schedule for every day (0-6)
    const scheduleValues = [0, 1, 2, 3, 4, 5, 6].map(day => [habitId, day]);
    await pool.query(
        'INSERT INTO habit_schedules (habit_id, day_of_week) VALUES ?',
        [scheduleValues]
    );
    return habitId;
}

async function addCompletion(habitId, dateStr, points = 10) {
    await pool.query(
        'INSERT INTO habit_completions (habit_id, completed_at, points_earned) VALUES (?, ?, ?)',
        [habitId, dateStr, points]
    );
}

async function runQa() {
    try {
        console.log("=== API Retrieval (New User) ===");
        const newUserId = await createUser();
        const initialBadges = await badgeService.getUserBadges(newUserId);
        console.log(`Retrieved ${initialBadges.length} badges. Earned count: ${initialBadges.filter(b => b.isEarned).length}`);
        
        console.log("\n=== Test First Completion -> Pemula ===");
        const habit1 = await createHabit(newUserId);
        // We will call habitService.completeHabit to test the full flow
        const response1 = await habitService.completeHabit(newUserId, habit1);
        console.log("Completion response earned_badges:", JSON.stringify(response1.earned_badges, null, 2));

        console.log("\n=== Test Duplicate Prevention ===");
        const habit2 = await createHabit(newUserId);
        const response2 = await habitService.completeHabit(newUserId, habit2);
        console.log("Completion response earned_badges:", JSON.stringify(response2.earned_badges, null, 2));

        console.log("\n=== Test 100 Completions ===");
        const user100Id = await createUser();
        const habit100 = await createHabit(user100Id);
        
        // Manually insert 99 valid completions (using past dates to avoid unique constraint if there is one)
        let date = new Date();
        for (let i=0; i<99; i++) {
            date.setDate(date.getDate() - 1);
            await addCompletion(habit100, date.toISOString());
        }
        
        const response100 = await habitService.completeHabit(user100Id, habit100);
        console.log("Completion response earned_badges (100th completion):", JSON.stringify(response100.earned_badges, null, 2));

        console.log("\n=== Test 3-Day Streak ===");
        const userStreak3Id = await createUser();
        // Create habit as if it was created 3 days ago
        const habitStreak3 = await createHabit(userStreak3Id, 3);
        
        let date3_1 = new Date();
        date3_1.setDate(date3_1.getDate() - 2);
        await addCompletion(habitStreak3, date3_1.toISOString());
        
        let date3_2 = new Date();
        date3_2.setDate(date3_2.getDate() - 1);
        await addCompletion(habitStreak3, date3_2.toISOString());
        
        const responseStreak3 = await habitService.completeHabit(userStreak3Id, habitStreak3);
        console.log("Completion response earned_badges (3rd day):", JSON.stringify(responseStreak3.earned_badges, null, 2));

        const streakHelper = require('./src/utils/streakHelper');
        const [habits] = await pool.query('SELECT id, user_id, created_at FROM habits WHERE user_id = ?', [userStreak3Id]);
        const [completions3] = await pool.query('SELECT habit_id, completed_at FROM habit_completions WHERE habit_id = ?', [habitStreak3]);
        const [schedules3] = await pool.query('SELECT habit_id, day_of_week FROM habit_schedules WHERE habit_id = ?', [habitStreak3]);
        const maxStreak = streakHelper.calculateMaxStreak(habits, completions3, schedules3, new Date());
        console.log("Calculated maxStreak for 3-Day User:", maxStreak);

        console.log("\n=== Test Broken Streak ===");
        const userBrokenId = await createUser();
        const habitBroken = await createHabit(userBrokenId, 5);
        
        // Today, Yesterday (missed), Day Before Yesterday (completed), 3 days ago (completed), 4 days ago (completed)
        // If they complete today, streak should only be 1 because yesterday was missed!
        let dateBroken = new Date();
        dateBroken.setDate(dateBroken.getDate() - 2);
        await addCompletion(habitBroken, dateBroken.toISOString());
        dateBroken.setDate(dateBroken.getDate() - 1);
        await addCompletion(habitBroken, dateBroken.toISOString());
        dateBroken.setDate(dateBroken.getDate() - 1);
        await addCompletion(habitBroken, dateBroken.toISOString());

        const responseBroken = await habitService.completeHabit(userBrokenId, habitBroken);
        console.log("Completion response earned_badges (broken streak):", JSON.stringify(responseBroken.earned_badges, null, 2));

        // Evaluate actual max streak for the broken user
        const finalBadgesBroken = await badgeService.getUserBadges(userBrokenId);
        console.log("User Broken Earned Badges:", finalBadgesBroken.filter(b => b.isEarned).map(b => b.name));

        console.log("\n=== Test Points Regression ===");
        console.log("Points before completion: 0");
        console.log("Points returned in completion:", response1.pointsEarned);
        const [u1] = await pool.query('SELECT total_points FROM users WHERE id = ?', [newUserId]);
        console.log("Points in DB after 2 completions:", u1[0].total_points);

    } catch (e) {
        console.error("QA Test Error:", e);
    } finally {
        pool.end();
    }
}

runQa();
