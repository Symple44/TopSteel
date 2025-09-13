import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as compression from 'compression'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { AppModule } from './app/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  )
  app.use(compression())

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api', limiter)

  // CORS - Configuration sécurisée pour tous les environnements
  const corsOrigins = configService.get('MARKETPLACE_CORS_ORIGINS')?.split(',') ||
    configService.get('CORS_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3007',
      'http://localhost:3008',
    ]

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Toujours vérifier l'origine contre la liste blanche
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
    maxAge: 86400, // Cache preflight for 24 hours
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
