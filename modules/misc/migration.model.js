const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const MigrationSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('Migration', MigrationSchema);