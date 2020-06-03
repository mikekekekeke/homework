const { ObjectId } = require('mongodb');

module.exports = {

    PLACEHOLDER_ID: ObjectId('000000000000000000000000'), //Place holder object Id

    SYSTEM_LOG: {
        TYPE: {
            ERROR: 'error'
        },

        SUB_TYPES: {
            ERROR: {
                INTERNAL: 'internal',
            }
        }
    },

    USER: {
        ROLE: {
            ROOT: 'root',
            USER: 'user'
        }
    },

    COMMON: {
        CITY: {
            VILNIUS: 'Vilnius',
            KAUNAS: 'Kaunas',
            KLAIPEDA: 'Klaipeda'
        }
    }

};