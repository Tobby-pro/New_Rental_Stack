// schemas/propertySchema.js
const Joi = require('joi');

const propertySchema = Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    price: Joi.number().positive().required(),
    bedrooms: Joi.number().integer().min(1).required(),
    bathrooms: Joi.number().integer().min(1).required(),
   
});

module.exports = propertySchema;
