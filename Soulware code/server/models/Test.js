const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    ru: { type: String, required: true },
    en: { type: String, required: true }
  },
  description: {
    ru: { type: String, required: true },
    en: { type: String, required: true }
  },
  category: {
    type: String,
    enum: ['personality', 'career', 'relationships', 'emotional', 'cognitive', 'mental_health', 'development', 'social', 'leadership', 'stress', 'creativity', 'motivation', 'values', 'humor', 'mythology', 'scenario', 'lifestyle', 'finance', 'self_esteem', 'communication', 'culture', 'ethics', 'creative_thinking'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  duration: {
    type: String,
    enum: ['short', 'medium', 'long'],
    required: true
  },
  premium: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  questions: [{
    text: {
      ru: { type: String, required: true },
      en: { type: String, required: true }
    },
    options: [{
      text: {
        ru: { type: String, required: true },
        en: { type: String, required: true }
      },
      value: { type: Number, required: true }
    }],
    archetype: { type: String }
  }],
  resultScales: [{
    name: {
      ru: String,
      en: String
    },
    description: {
      ru: String,
      en: String
    },
    minValue: Number,
    maxValue: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Test', testSchema); 