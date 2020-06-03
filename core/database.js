const mongoose = require('mongoose');

const CONFIG = require('../config/config');

module.exports = {

    async __setup() {

        this.mongoose = await mongoose.connect(CONFIG.DATABASE.URL, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useFindAndModify: true,
            useUnifiedTopology: true,
            autoIndex: true
        });
        
    },

    mongoose: mongoose

};