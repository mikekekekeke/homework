const { Schema } = require('mongoose');
const { mongoose } = require('../../core/database');

const bcrypt = require('bcryptjs');

const CONFIG = require('../../config/config');
const { USER } = require('../../config/model_constants');

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        required: true,
        default: USER.ROLE.USER
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false });

UserSchema.methods.checkPassword = function (password) {

    return bcrypt.compareSync(password, this.password || '');

};

UserSchema.pre('save', async function () {

    if (this.isModified('password')) this.password = await bcrypt.hash(this.password, CONFIG.USER.PASSWORD_SALT_ROUNDS);

});

module.exports = mongoose.model('User', UserSchema);