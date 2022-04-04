const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  longUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortUrl: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  date: {
    type: String,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Url', UrlSchema);