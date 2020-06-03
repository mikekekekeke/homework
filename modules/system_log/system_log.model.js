const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const SystemLogSchema = new Schema({
    type: {
        type: String,
        required: true,
        index: true
    },
    sub_type: {
        type: String,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    details: { //Text describing the log in detail or error stack.
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('SystemLog', SystemLogSchema);