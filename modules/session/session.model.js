const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const CONFIG = require('../../config/config');

const SessionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    expires_at: {
        type: Date,
        required: true,
        default: function() {
            return Date.now() + CONFIG.SESSION.USER_EXPIRATION;
        },
        index: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false });


module.exports = mongoose.model('Session', SessionSchema);