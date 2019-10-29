const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const imageSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    image: {
        type: String,
        required:true
    },
    likes: {
        type: Number,
        default: 0
    }
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;