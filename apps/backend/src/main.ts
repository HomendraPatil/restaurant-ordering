import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.CUSTOMER_APP_URL || 'http://localhost:3001',
      process.env.ADMIN_APP_URL || 'http://localhost:3002',
    ],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('x-powered-by');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Restaurant Ordering API')
    .setDescription(`
## Overview
API for the Restaurant Ordering System - a full-stack food delivery platform.

## Authentication
Most endpoints require JWT authentication. Use the login endpoint to get an access token.

## Roles
- **CUSTOMER**: Can browse menu, manage cart, place orders
- **ADMIN**: All customer permissions + manage menu and orders

## Features
- JWT Authentication with role-based access
- Real-time order tracking via WebSockets
- Stock management with race condition protection
- Payment integration with Razorpay
    `)
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Menu', 'Menu and category endpoints')
    .addTag('Cart', 'Shopping cart endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addTag('Payment', 'Payment processing endpoints')
    .addTag('User', 'User profile and addresses')
    .addTag('Admin', 'Admin management endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api/v1`);
  console.log(`📚 API docs available at http://localhost:${port}/docs`);
}

bootstrap();
