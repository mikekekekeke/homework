const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const ScannerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    imei: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    road: {
        type: String,
        required: true,
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false });

ScannerSchema.index({ created_at: -1 });
ScannerSchema.index({ city: 1, road: 1 }, { unique: true });

ScannerSchema.methods.toWeb = function() {

    const json = this.toJSON();

    json.created_at = json.created_at.getTime();
    json.updated_at = json.updated_at.getTime();

    return json;

};

module.exports = mongoose.model('Scanner', ScannerSchema);