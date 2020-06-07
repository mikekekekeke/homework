const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const { ObjectId } = require('mongodb');
const { COMMON, SCANNER } = require('../config/model_constants');

module.exports = {

    schemas: {
        objectId: Joi.objectId().required().error(new InputValidationError('Invalid objectId')),
        string: Joi.string().required().trim(),
        number: Joi.number(),

        limit: Joi.number().integer().min(1).max(1000).required().error(new InputValidationError('Limit must be a number between 1 and 1000')),
        offset: Joi.number().integer().min(0).required().error(new InputValidationError('offset must a be a positive integer')),

        city: Joi.string().trim().valid(Object.values(COMMON.CITY)).required().error(new InputValidationError('Invalid city')),

        user: {
            username: Joi.string().min(5).max(15).lowercase().trim().required().error(new InputValidationError('Username must be between 5 and 15 chars long')),
            password: Joi.string().min(8).trim().required().error(new InputValidationError('Password must be at at least 8 chars long')),
        },

        scanner: {
            road: Joi.string().uppercase().required().error(new InputValidationError('Road must be a non empty string')),
            coordinates: Joi.string().required().error(new InputValidationError('Coordinates has invalid format or not provided')),
            status: Joi.string().trim().valid(SCANNER.STATUSES.asArray).error(new InputValidationError('Invalid status')),
            filters: Joi.object().keys({
                city: Joi.string().valid(Object.values(COMMON.CITY)).optional(),
                road: Joi.string().uppercase().optional()
            }).optionalKeys([ 'city', 'road' ]).optional().error(new InputValidationError('Filter object must contain valid city and/or road name.'))
        }

    },

    validate(value, schema, error = null) {
        if (_.isString(error)) error = new Error(error);
        if (ObjectId.isValid(value)) value = String(value);

        const clone = Joi.concat(schema);

        const result = Joi.validate(value, error ? clone.error(error) : clone);

        if (result.error) throw result.error;

        return result.value;
    },

    validateInput(value, schema, error = null) {
        if (_.isString(error)) error = new InputValidationError(error);

        return module.exports.validate(value, schema, error); //Required if called from a destructed object.
    }

};
