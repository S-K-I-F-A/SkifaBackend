import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { port } = configureApp(app);

  await app.listen(port, '0.0.0.0');
}
await bootstrap();
