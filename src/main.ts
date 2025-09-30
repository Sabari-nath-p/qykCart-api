import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware (disabled in development for Swagger compatibility)
  if (configService.get('nodeEnv') === 'production') {
    app.use(helmet());
  }
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('corsOrigin', '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix(configService.get('api.prefix', 'api/v1'));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('QYKCart API')
    .setDescription('Professional e-commerce backend API with multi-role user system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'JWT Authorization header using the Bearer scheme.',
        name: 'Authorization',
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .addTag('Application', 'Application information endpoints')
    .addTag('Health', 'Application health check endpoints')
    .addTag('Users', 'User management endpoints with role-based access')
    .addTag('Shops', 'Shop management endpoints with location and operational features')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(configService.get('api.swaggerPath', 'api/docs'), app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'QYKCart API Documentation',
  });

  const port = configService.get('port', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/${configService.get('api.swaggerPath', 'api/docs')}`);
  logger.log(`🏥 Health check: http://localhost:${port}/${configService.get('api.prefix', 'api/v1')}/health`);
}

bootstrap();
