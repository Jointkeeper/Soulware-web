const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const authMiddleware = require('../middleware/auth');

// Получить список всех тестов с фильтрацией
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, duration, search, page = 1, limit = 9 } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (duration && duration !== 'all') query.duration = duration;
    if (search) {
      query.$or = [
        { 'title.ru': { $regex: search, $options: 'i' } },
        { 'title.en': { $regex: search, $options: 'i' } }
      ];
    }

    const tests = await Test.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-questions');

    const total = await Test.countDocuments(query);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить конкретный тест
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const test = await Test.findById(req.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Проверка на премиум доступ
    if (test.premium && !req.user.isPremium) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить тест дня
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const test = await Test.findOne({
      premium: false,
      createdAt: { $lte: today }
    })
    .sort({ createdAt: -1 })
    .select('-questions');

    if (!test) {
      return res.status(404).json({ error: 'No daily test available' });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 