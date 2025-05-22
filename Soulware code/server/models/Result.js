const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    questionId: String,
    selectedOption: Number,
    value: Number
  }],
  scores: [{
    scale: String,
    value: Number
  }],
  archetypeChanges: [{
    name: String,
    change: Number
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска по пользователю и дате
resultSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('Result', resultSchema); 