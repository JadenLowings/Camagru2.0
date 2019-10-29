const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema ({
    userID : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageID : {
        type: Schema.Types.ObjectId,
        ref: 'Images',
        required: true
    },
    comment : {
        type: String,
        required: true
    }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;