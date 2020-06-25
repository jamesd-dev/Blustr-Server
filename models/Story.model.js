const mongoose = require('mongoose');

let StorySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: [String],
        required: true
    },
    coverImg : {
        type: String
    },
    title: {
        type: String
    },
    dateCreated: {
        type: Date,
        required: true
    },
    likes: {
        type: Number
    },
    dislikes: {
        type: Number
    },
    views: {
        type: Number
    }
})

let StoryModel = mongoose.model('Story', StorySchema)

module.exports = StoryModel;