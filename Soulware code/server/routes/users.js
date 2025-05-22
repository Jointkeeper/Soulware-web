const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Получить профиль пользователя
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить профиль пользователя
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseId: req.user.uid },
      { 
        $set: { 
          name,
          'preferences.language': preferences?.language,
          'preferences.notifications': preferences?.notifications
        }
      },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить достижения пользователя
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.uid })
      .select('progress.achievements');
    res.json(user.progress.achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить архетипический профиль
router.get('/archetypes', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.uid })
      .select('archetypes');
    res.json(user.archetypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить премиум статус
router.post('/premium', authMiddleware, async (req, res) => {
  try {
    const { isPremium } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseId: req.user.uid },
      { $set: { isPremium } },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 