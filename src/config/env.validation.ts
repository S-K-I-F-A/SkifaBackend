/* oxlint-disable unicorn/no-thenable -- Joi condition objects require a `then` key. */
import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  API_PREFIX: Joi.string().trim().default('api'),
  API_VERSION: Joi.string().trim().default('1'),
  CORS_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().default('http://localhost:3000'),
  }),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  FRONTEND_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().empty('').required(),
    otherwise: Joi.string().uri().empty('').default('http://localhost:3000'),
  }),
  JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).empty('').required(),
    otherwise: Joi.string()
      .min(32)
      .empty('')
      .default('local-only-change-this-jwt-secret-123456'),
  }),
  NIN_HASH_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).empty('').required(),
    otherwise: Joi.string()
      .min(32)
      .empty('')
      .default('local-only-change-this-nin-secret-123456'),
  }),
  COOKIE_SECURE: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().valid(true).default(true),
    otherwise: Joi.boolean().truthy('true').falsy('false').default(false),
  }),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  DATABASE_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().empty('').required(),
    otherwise: Joi.string().uri().empty('').optional(),
  }),
  DB_SSL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().truthy('true').falsy('false').default(true),
    otherwise: Joi.boolean().truthy('true').falsy('false').default(false),
  }),
  DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_MIGRATIONS_RUN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().truthy('true').falsy('false').default(true),
    otherwise: Joi.boolean().truthy('true').falsy('false').default(false),
  }),
  SQLITE_PATH: Joi.string().default('data/skifa.sqlite'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  PAYMENTS_MODE: Joi.string().valid('mock', 'disabled').default('disabled'),
  EMAIL_MODE: Joi.string().valid('log', 'smtp', 'disabled').default('disabled'),
  SMTP_HOST: Joi.string().empty('').optional(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  SMTP_USER: Joi.string().empty('').optional(),
  SMTP_PASS: Joi.string().empty('').optional(),
  SMTP_FROM: Joi.string().default('Skifa <no-reply@skifa.local>'),
  ADMIN_EMAIL: Joi.string().email().empty('').optional(),
  ADMIN_PASSWORD: Joi.string().min(12).empty('').optional(),
})
  .unknown(true)
  .prefs({ abortEarly: false });
