const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Medical', 'Rescue', 'Food/Shelter', 'Logistics', 'Other'],
        required: true
    },
    contactEmail: {
        type: String,
        required: true,
        unique: true
    },
    contactPhone: {
        type: String,
        required: true
    },
    licenseId: {
        type: String,
        required: true,
        unique: true
    },
    verified: {
        type: Boolean,
        default: false // Pending approval
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NGO', NGOSchema);
