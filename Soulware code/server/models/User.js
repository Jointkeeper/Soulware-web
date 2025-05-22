const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  preferences: {
    language: {
      type: String,
      enum: ['ru', 'en'],
      default: 'ru'
    },
    notifications: {
      dailyTest: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      updates: { type: Boolean, default: true }
    }
  },
  progress: {
    level: { type: Number, default: 1 },
    testsCompleted: { type: Number, default: 0 },
    achievements: [{
      id: String,
      name: String,
      dateUnlocked: Date
    }]
  },
  archetypes: [{
    name: String,
    level: Number,
    lastUpdated: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 