import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('MVP workflow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('registers an intern, activates visibility and exposes the talent profile', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register/intern')
      .send({
        email: 'amara@example.test',
        password: 'correct-horse-battery-staple',
        fullName: 'Amara Okafor',
        headline: 'Frontend developer',
        bio: 'I build accessible frontend applications for growing teams.',
        state: 'Lagos',
        city: 'Ikeja',
        category: 'Tech',
        skills: [{ name: 'React', level: 'Professional' }],
        experience: '1-2 years',
        availability: 'Full-time',
        stipendMin: 300,
        stipendMax: 450,
      })
      .expect(201);

    const token = registration.body.accessToken as string;
    expect(token).toBeTypeOf('string');

    await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        purpose: 'profile_visibility',
        returnUrl: 'http://localhost:3000/intern/payment-return',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.mode).toBe('mock');
        expect(body.url).toContain('checkout=success');
      });

    await request(app.getHttpServer())
      .get('/api/v1/entitlements')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.profileVisible).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/api/v1/talent?skill=React')
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1);
        expect(body.items[0].name).toBe('Amara Okafor');
        expect(body.items[0].bio).toBeNull();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
