-- Seed data for habit_templates
USE habit_management;

-- Clear existing data if any (optional, but good for idempotency)
TRUNCATE TABLE habit_templates;

-- Insert master data templates
INSERT INTO habit_templates (category_id, title, description, difficulty, priority, popularity_score) VALUES
(1, 'Minum 2 Liter Air', 'Pastikan tubuh tetap terhidrasi dengan minum 8 gelas air per hari.', 'easy', 'high', 95.5),
(1, 'Tidur 8 Jam', 'Istirahat yang cukup sangat penting untuk kesehatan jangka panjang.', 'medium', 'high', 90.0),
(3, 'Peregangan Pagi (Stretching)', 'Lakukan peregangan selama 10 menit setiap pagi untuk fleksibilitas tubuh.', 'easy', 'medium', 85.0),
(3, 'Lari Pagi 30 Menit', 'Meningkatkan stamina dan kesehatan jantung.', 'hard', 'medium', 80.5),
(2, 'Fokus Kerja Tanpa Distraksi', 'Kerja fokus selama 2 jam tanpa membuka media sosial.', 'medium', 'high', 88.0),
(2, 'Membuat To-Do List Harian', 'Tuliskan 3-5 target utama yang ingin dicapai setiap hari.', 'easy', 'high', 92.0),
(4, 'Membaca Buku 15 Halaman', 'Tingkatkan literasi dengan membaca minimal 15 halaman buku non-fiksi.', 'medium', 'medium', 75.5),
(4, 'Belajar Skill Baru (30 Menit)', 'Luangkan waktu untuk kursus online atau belajar skill baru.', 'hard', 'high', 70.0),
(5, 'Menghubungi Keluarga/Teman', 'Jaga silaturahmi dengan menelepon atau mengirim pesan.', 'easy', 'low', 65.0),
(7, 'Mencatat Pengeluaran Harian', 'Catat setiap pemasukan dan pengeluaran agar keuangan terkontrol.', 'easy', 'high', 82.0),
(8, 'Meditasi / Ibadah Pagi', 'Tenangkan pikiran sebelum memulai aktivitas harian.', 'medium', 'high', 88.5);
