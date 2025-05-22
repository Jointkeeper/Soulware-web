const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Сохранить результат теста
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { testId, answers, scores, archetypeChanges } = req.body;
    const user = await User.findOne({ firebaseId: req.user.uid });

    const result = await Result.create({
      userId: user._id,
      testId,
      answers,
      scores,
      archetypeChanges
    });

    // Обновляем статистику пользователя
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'progress.testsCompleted': 1 },
      $push: { 
        archetypes: {
          $each: archetypeChanges.map(change => ({
            name: change.name,
            level: change.change,
            lastUpdated: new Date()
          }))
        }
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить историю результатов пользователя
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findOne({ firebaseId: req.user.uid });

    const results = await Result.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('testId', 'title');

    const total = await Result.countDocuments({ userId: user._id });

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить конкретный результат
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.uid });
    const result = await Result.findOne({
      _id: req.params.id,
      userId: user._id
    }).populate('testId');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 