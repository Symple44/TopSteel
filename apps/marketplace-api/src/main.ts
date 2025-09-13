import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as compression from 'compression'
import helmet from 'helmet'
import { AppModule } from './app/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security
  app.use(helmet())
  app.use(compression())

  // CORS - En développement, autoriser toutes les origines localhost et 127.0.0.1
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const corsOrigins = configService.get('MARKETPLACE_CORS_ORIGINS')?.split(',') ||
    configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3007']

  app.enableCors({
    origin: isDevelopment
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // En dev, autoriser localhost et 127.0.0.1 sur tous les ports
          if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true)
          } else if (corsOrigins.includes(origin)) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        }
      : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
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
}

bootstrap()
