const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');
const { SCANNER: scannerConfig } = require('../../config/model_constants');

const WeekSchema = new Schema({
    monday: {
        type: Number,
        required: true,
    },
    tuesday: {
        type: Number,
        required: true,
    },
    wednesday: {
        type: Number,
        required: true,
    },
    thursday: {
        type: Number,
        required: true,
    },
    friday: {
        type: Number,
        required: true,
    },
    saturday: {
        type: Number,
        required: true,
    },
    sunday: {
        type: Number,
        required: true,
    },
}, { _id : false, versionKey: false });
const TopFiveItemSchema = new Schema({
    timestamp: {
        type: Date,
        required: true,
    },
    direction: {
        type: String,
        enum: scannerConfig.DIRECTIONS.asArray,
        required: true,
    },
    carsAmount: {
        type: Number,
        required: true,
    },
}, { _id : false, versionKey: false });
const TrafficReportSchema = new Schema({
    city: {
        type: String,
        required: true,
    },
    road: {
        type: String,
        required: true,
    },
    scannerId: {
        type: Schema.ObjectId,
        required: true,
    },
    date: {
        type: Number,
        required: true,
    },
    totalPerWeek: {
        in: {
            type: Number,
            required: true,
        },
        out: {
            type: Number,
            required: true,
        },
    },
    totalDuringWeek: {
        in: WeekSchema,
        out: WeekSchema,
    },
    topFiveHotHours: [TopFiveItemSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }}, { versionKey: false });

TrafficReportSchema.methods.toWeb = function () {return this.toJSON()};

module.exports = mongoose.model('TrafficReport', TrafficReportSchema);
