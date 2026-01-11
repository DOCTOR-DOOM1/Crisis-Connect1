const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  urgentNeeds: {
    type: [String],
    enum: ['Water', 'Food', 'Medical', 'Shelter', 'Other'],
    required: true,
  },
  criticalDetails: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Open', 'Claimed', 'Resolved'],
    default: 'Open',
  },
  claimedBy: {
    type: String, // Volunteer ID or Session ID
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create geospatial index for location
RequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', RequestSchema);
