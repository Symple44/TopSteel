import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import * as compression from 'compression'
import helmet from 'helmet'
import { AppModule } from './app/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security
  app.use(helmet())
  app.use(compression())

  // CORS
  app.enableCors({
    origin: configService.get('MARKETPLACE_CORS_ORIGINS')?.split(',') || configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3007'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  // API prefix
  app.setGlobalPrefix('api')

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TopSteel Marketplace API')
    .setDescription('API for multi-tenant marketplace integration with TopSteel ERP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('storefront', 'Public storefront APIs')
    .addTag('admin', 'Marketplace administration APIs')
    .addTag('products', 'Product management')
    .addTag('customers', 'Customer management')
    .addTag('orders', 'Order management')
    .addTag('themes', 'Theme customization')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = configService.get('MARKETPLACE_API_PORT') || configService.get('PORT') || 3004
  await app.listen(port)

  console.log(`🚀 Marketplace API running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()