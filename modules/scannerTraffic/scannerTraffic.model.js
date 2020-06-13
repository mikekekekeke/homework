const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const ScannerSchema = new Schema({
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

ScannerSchema.index({ hourTimestamp: 1, imei: 1 }, { unique: true });

ScannerSchema.methods.toWeb = () => this.toJSON();

module.exports = mongoose.model('ScannerTraffic', ScannerSchema);
