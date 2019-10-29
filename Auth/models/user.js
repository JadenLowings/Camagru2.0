const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    Token: {
        type: String
    },
    active: {
        type: Boolean,
        default: false
    },
    img: {
        type: Buffer,
        contentType: String
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;