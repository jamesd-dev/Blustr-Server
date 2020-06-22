const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
     username: {
       type: String,
       required: true,
       unique: true
     }, 
     email: {
      type: String,
      required: true,
      unique: true
    },
     passHash: {
      type: String,
      required: true
    },
    dateJoined: {
      type: Date,
      required: true
    },
    stories: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Story'
    }, 
    alteredStories: {
      type: [{
        story: {type: mongoose.Schema.Types.ObjectId, ref: 'Story'},
        liked : {type: Boolean},
        disliked : {type: Boolean}
      }]
    }
  }
);
userSchema.index({ 'email': 1}, {unique: true});
userSchema.index({ 'username': 1}, {unique: true});
 module.exports = model('User', userSchema);
