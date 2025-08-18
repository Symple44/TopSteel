import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('TopSteel Marketplace API')
    .setDescription(`
      ## Overview
      The TopSteel Marketplace API provides comprehensive e-commerce functionality for B2B steel and construction materials trading.
      
      ## Features
      - 🛒 **Product Catalog**: Browse and search products with advanced filtering
      - 🛍️ **Shopping Cart**: Persistent cart management with session support
      - 💳 **Payments**: Secure payment processing with Stripe integration
      - 📦 **Orders**: Complete order lifecycle management
      - 👤 **Customer Accounts**: User registration, authentication, and profile management
      - 🏷️ **Promotions**: Discount codes and promotional campaigns
      - 📊 **Analytics**: Sales reporting and business metrics
      - 🔐 **Security**: JWT authentication with role-based access control
      
      ## Authentication
      Most endpoints require authentication via JWT bearer token.
      Include the token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your-jwt-token>
      \`\`\`
      
      ## Multi-tenancy
      All requests must include the X-Tenant-Id header:
      \`\`\`
      X-Tenant-Id: <tenant-identifier>
      \`\`\`
      
      ## Rate Limiting
      - Anonymous: 100 requests per minute
      - Authenticated: 1000 requests per minute
      - Burst: 50 requests per second
      
      ## Pagination
      List endpoints support pagination with query parameters:
      - \`page\`: Page number (default: 1)
      - \`limit\`: Items per page (default: 20, max: 100)
      
      ## Error Responses
      Errors follow RFC 7807 Problem Details format:
      \`\`\`json
      {
        "type": "/errors/validation",
        "title": "Validation Error",
        "status": 400,
        "detail": "The request contains invalid data",
        "instance": "/api/marketplace/products",
        "errors": [...]
      }
      \`\`\`
    `)
    .setVersion('1.0.0')
    .setContact('TopSteel Support', 'https://topsteel.com/support', 'api@topsteel.com')
    .setLicense('Proprietary', 'https://topsteel.com/license')
    .addServer('https://api.topsteel.com', 'Production')
    .addServer('https://staging-api.topsteel.com', 'Staging')
    .addServer('http://localhost:3001', 'Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token',
      },
      'JWT'
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication',
      },
      'ApiKey'
    )
    .addGlobalParameters({
      name: 'X-Tenant-Id',
      in: 'header',
      required: true,
      description: 'Tenant identifier for multi-tenancy',
      schema: {
        type: 'string',
        example: 'topsteel-corp',
      },
    })
    .addGlobalParameters({
      name: 'X-Request-Id',
      in: 'header',
      required: false,
      description: 'Unique request identifier for tracing',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    })
    .addTag('Products', 'Product catalog management')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order management')
    .addTag('Payments', 'Payment processing')
    .addTag('Customers', 'Customer account management')
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Promotions', 'Promotional campaigns and discounts')
    .addTag('Shipping', 'Shipping and delivery management')
    .addTag('Analytics', 'Business analytics and reporting')
    .addTag('Admin', 'Administrative operations')
    .addTag('Webhooks', 'Webhook endpoints for external integrations')
    .addTag('Health', 'System health and monitoring')
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace('Controller', '')}_${methodKey}`,
    deepScanRoutes: true,
    extraModels: [],
  })

  // Add custom CSS for better UI
  const customCss = `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 50px }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; border-radius: 5px; }
    .swagger-ui .btn.authorize { background-color: #4CAF50; }
    .swagger-ui .btn.authorize:hover { background-color: #45a049; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #49cc90; }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #61affe; }
    .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #fca130; }
    .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #f93e3e; }
  `

  // Add custom JavaScript for enhanced functionality
  const customJs = `
    // Auto-expand first tag
    setTimeout(() => {
      const firstTag = document.querySelector('.opblock-tag');
      if (firstTag && !firstTag.classList.contains('is-open')) {
        firstTag.click();
      }
    }, 500);

    // Add copy buttons to code blocks
    document.addEventListener('DOMContentLoaded', () => {
      const codeBlocks = document.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        const button = document.createElement('button');
        button.textContent = 'Copy';
        button.className = 'copy-button';
        button.onclick = () => {
          navigator.clipboard.writeText(block.textContent);
          button.textContent = 'Copied!';
          setTimeout(() => button.textContent = 'Copy', 2000);
        };
        block.parentElement.appendChild(button);
      });
    });
  `

  SwaggerModule.setup('api/docs', app, document, {
    customCss,
    customJs,
    customSiteTitle: 'TopSteel Marketplace API',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        theme: 'monokai',
      },
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      requestSnippets: {
        generators: {
          curl_bash: {
            title: 'cURL (bash)',
            syntax: 'bash',
          },
          curl_powershell: {
            title: 'cURL (PowerShell)',
            syntax: 'powershell',
          },
          node_native: {
            title: 'Node.js (Native)',
            syntax: 'javascript',
          },
          node_axios: {
            title: 'Node.js (Axios)',
            syntax: 'javascript',
          },
          javascript_fetch: {
            title: 'JavaScript (Fetch)',
            syntax: 'javascript',
          },
          python_requests: {
            title: 'Python (Requests)',
            syntax: 'python',
          },
          php_curl: {
            title: 'PHP (cURL)',
            syntax: 'php',
          },
          java_okhttp: {
            title: 'Java (OkHttp)',
            syntax: 'java',
          },
        },
      },
    },
  })

  // Also generate OpenAPI JSON for external tools
  const fs = require('node:fs')
  const path = require('node:path')
  const outputPath = path.resolve(process.cwd(), 'openapi.json')
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2))
}

export const swaggerSchemas = {
  PaginationResponse: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { type: 'object' } },
      total: { type: 'number', example: 100 },
      page: { type: 'number', example: 1 },
      pages: { type: 'number', example: 5 },
      limit: { type: 'number', example: 20 },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      type: { type: 'string', example: '/errors/validation' },
      title: { type: 'string', example: 'Validation Error' },
      status: { type: 'number', example: 400 },
      detail: { type: 'string', example: 'The request contains invalid data' },
      instance: { type: 'string', example: '/api/marketplace/products' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { type: 'object' },
    },
  },
}
