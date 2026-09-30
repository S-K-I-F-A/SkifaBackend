import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().trim().default('api'),
  API_VERSION: Joi.string().trim().default('1'),
  CORS_ORIGIN: Joi.string().trim().default('http://localhost:3001'),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
})
  .unknown(true)
  .prefs({ abortEarly: false });
