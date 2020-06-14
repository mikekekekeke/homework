const { ObjectId } = require('mongodb');

module.exports = {
    // Object freeze to avoid reassigning during program runtime

    PLACEHOLDER_ID: ObjectId('000000000000000000000000'), //Place holder object Id

    SYSTEM_LOG: Object.freeze({
        TYPE: {
            ERROR: 'error'
        },

        SUB_TYPES: {
            ERROR: {
                INTERNAL: 'internal',
            }
        }
    }),

    USER: Object.freeze({
        ROLE: {
            ROOT: 'root',
            USER: 'user'
        }
    }),

    COMMON: Object.freeze({
        CITY: {
            VILNIUS: 'Vilnius',
            KAUNAS: 'Kaunas',
            KLAIPEDA: 'Klaipeda'
        }
    }),

    SCANNER: Object.freeze({
        STATUSES: {
            asObject: {
                ACTIVE: 'active',
                INACTIVE: 'inactive',
                OUT_OF_ORDER: 'out_of_order',
            },
            asArray: [
                'active', 'inactive', 'out_of_order'
            ]
        },
        UNKNOWN_COORDINATES: 'Unknown',
        DEFAULT_STATUS: 'active',
        DIRECTIONS: {
            asObject: {
                IN: 'in',
                OUT: 'out',
            },
            asArray: [ 'in', 'out' ],
        }
    }),

};
