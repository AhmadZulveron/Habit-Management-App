require('dotenv').config();
const habitService = require('./src/services/habitService');
const pool = require('./src/config/database');

async function createUser(name) {
    const email = 'user_' + Math.random().toString(36).substring(7) + '@test.com';
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, 'password']
    );
    return result.insertId;
}

async function createHabit(userId, priority, title, createdDaysAgo = 0) {
    let date = new Date();
    date.setDate(date.getDate() - createdDaysAgo);
    
    const [result] = await pool.query(
        'INSERT INTO habits (user_id, category_id, title, status, priority, created_at) VALUES (?, 1, ?, "active", ?, ?)',
        [userId, title, priority, date]
    );
    const habitId = result.insertId;
    
    // Add schedule for every day
    const scheduleValues = [0, 1, 2, 3, 4, 5, 6].map(day => [habitId, day]);
    await pool.query(
        'INSERT INTO habit_schedules (habit_id, day_of_week) VALUES ?',
        [scheduleValues]
    );
    return habitId;
}

async function runTests() {
    try {
        console.log("=== Test A/B: Mixed Priority (LOW, HIGH, MEDIUM, HIGH, LOW) ===");
        const user1 = await createUser('Test User 1');
        await createHabit(user1, 'low', 'A', 0);
        await createHabit(user1, 'high', 'B', 1);
        await createHabit(user1, 'medium', 'C', 2);
        await createHabit(user1, 'high', 'D', 3);
        await createHabit(user1, 'low', 'E', 4);
        
        const today1 = await habitService.getTodayHabits(user1);
        console.log("Today's Habit (Mixed):", today1.map(h => `${h.priority} (${h.title})`).join(' -> '));
        
        const list1 = await habitService.getHabits(user1);
        console.log("Habit List (Mixed):", list1.map(h => `${h.priority} (${h.title})`).join(' -> '));


        console.log("\n=== Test C: Already Sorted ===");
        const user2 = await createUser('Test User 2');
        await createHabit(user2, 'high', 'A', 2);
        await createHabit(user2, 'medium', 'B', 1);
        await createHabit(user2, 'low', 'C', 0);
        const list2 = await habitService.getHabits(user2);
        console.log("Already Sorted:", list2.map(h => `${h.priority} (${h.title})`).join(' -> '));


        console.log("\n=== Test D: Reverse Sorted ===");
        const user3 = await createUser('Test User 3');
        await createHabit(user3, 'low', 'A', 2);
        await createHabit(user3, 'medium', 'B', 1);
        await createHabit(user3, 'high', 'C', 0);
        const list3 = await habitService.getHabits(user3);
        console.log("Reverse Sorted:", list3.map(h => `${h.priority} (${h.title})`).join(' -> '));


        console.log("\n=== Test E: Equal Priority (Tie-breakers) ===");
        const user4 = await createUser('Test User 4');
        // created_at descending means smallest createdDaysAgo is first
        await createHabit(user4, 'high', 'Z', 3); // oldest
        await createHabit(user4, 'high', 'A', 2);
        await createHabit(user4, 'high', 'M', 1); // newest
        
        const today4 = await habitService.getTodayHabits(user4);
        console.log("Today's Habit (Equal Priority) [Expected: A -> M -> Z]:", today4.map(h => h.title).join(' -> '));
        
        const list4 = await habitService.getHabits(user4);
        console.log("Habit List (Equal Priority) [Expected: M -> A -> Z]:", list4.map(h => h.title).join(' -> '));


        console.log("\n=== Test F: Empty List ===");
        const user5 = await createUser('Test User 5');
        const empty1 = await habitService.getTodayHabits(user5);
        const empty2 = await habitService.getHabits(user5);
        console.log("Empty Today:", empty1.length === 0 ? "Pass" : "Fail");
        console.log("Empty List:", empty2.length === 0 ? "Pass" : "Fail");


        console.log("\n=== Test G: Single Habit ===");
        const user6 = await createUser('Test User 6');
        await createHabit(user6, 'medium', 'A', 0);
        const single1 = await habitService.getTodayHabits(user6);
        const single2 = await habitService.getHabits(user6);
        console.log("Single Today:", single1.length === 1 && single1[0].title === 'A' ? "Pass" : "Fail");
        console.log("Single List:", single2.length === 1 && single2[0].title === 'A' ? "Pass" : "Fail");

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        pool.end();
    }
}

runTests();
