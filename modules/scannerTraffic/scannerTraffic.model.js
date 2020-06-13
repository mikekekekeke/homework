const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const ScannerTrafficSchema = new Schema({
    imei: {
        type: String,
        required: true,
    },
    hourTimestamp: {
        type: Number,
        required: true,
    },
    traffic: {
        in: {
            type: Number,
            required: true,
        },
        out: {
            type: Number,
            required: true,
        },
    },
}, { timestamps: { updatedAt: 'updated_at' }, versionKey: false });

ScannerTrafficSchema.index({ hourTimestamp: 1, imei: 1 }, { unique: true });

ScannerTrafficSchema.methods.toWeb = () => this.toJSON();

module.exports = mongoose.model('ScannerTraffic', ScannerTrafficSchema);
