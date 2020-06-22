const mongoose = require('mongoose');

let configOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true 
}

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Blustr'

mongoose.connect(MONGODB_URI, configOptions)
    .then(() => {
        console.log('Connected to Blustr Database');
    })
    .catch(() => {
        console.log('Failed to connect to Blustr Database');
    })