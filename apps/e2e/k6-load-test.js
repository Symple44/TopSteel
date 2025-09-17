import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'
import { check, group, sleep } from 'k6'
import http from 'k6/http'
import { Counter, Gauge, Rate, Trend } from 'k6/metrics'

// Global K6 environment variables declaration
/* global __ENV */

// Configuration
// biome-ignore lint/correctness/noUndeclaredVariables: __ENV is a global K6 variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'
// biome-ignore lint/correctness/noUndeclaredVariables: __ENV is a global K6 variable
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant'

// Custom metrics
const errorRate = new Rate('errors')
const apiTrend = new Trend('api_duration')
const searchTrend = new Trend('search_duration')
const checkoutTrend = new Trend('checkout_duration')
const cartOperations = new Counter('cart_operations')
const activeUsers = new Gauge('active_users')

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test - Gradual ramp up
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 }, // Ramp up to 100 users
        { duration: '10m', target: 100 }, // Stay at 100 users
        { duration: '5m', target: 200 }, // Ramp up to 200 users
        { duration: '10m', target: 200 }, // Stay at 200 users
        { duration: '5m', target: 0 }, // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'load' },
    },

    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1000 }, // Spike to 1000 users
        { duration: '3m', target: 1000 },
        { duration: '10s', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },

    // Soak test (endurance)
    soak: {
      executor: 'constant-vus',
      vus: 200,
      duration: '2h',
      tags: { test_type: 'soak' },
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'], // Custom error rate under 10%
    api_duration: ['p(95)<300'], // API calls 95% under 300ms
    search_duration: ['p(95)<500'], // Search 95% under 500ms
    checkout_duration: ['p(95)<2000'], // Checkout 95% under 2s
  },
}

// Test data
const testProducts = [
  { id: 'prod-1', name: 'Steel Beam 10m', price: 299.99 },
  { id: 'prod-2', name: 'Metal Sheet 2mm', price: 89.99 },
  { id: 'prod-3', name: 'Welding Machine Pro', price: 1899.0 },
  { id: 'prod-4', name: 'Steel Pipe 6m', price: 149.99 },
  { id: 'prod-5', name: 'Aluminum Plate', price: 199.99 },
]

const searchQueries = [
  'steel beam',
  'metal sheet',
  'welding',
  'aluminum',
  'pipe',
  'construction',
  'industrial',
]

// Helper functions
function getHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function handleResponse(response, name) {
  const success = check(response, {
    [`${name} - status 200`]: (r) => r.status === 200,
    [`${name} - response time < 500ms`]: (r) => r.timings.duration < 500,
  })

  errorRate.add(!success)

  if (!success) {
  }

  return success
}

// User journey functions
export function setup() {
  // Create test users and get tokens
  const users = []

  for (let i = 0; i < 10; i++) {
    const email = `loadtest_${randomString(8)}@topsteel.com`
    const password = 'LoadTest123!'

    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email,
        password,
        firstName: 'Load',
        lastName: 'Test',
        company: 'K6 Testing',
      }),
      { headers: getHeaders() }
    )

    if (registerRes.status === 201) {
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email, password }),
        { headers: getHeaders() }
      )

      if (loginRes.status === 200) {
        const data = JSON.parse(loginRes.body)
        users.push({
          email,
          password,
          token: data.token,
          userId: data.user.id,
        })
      }
    }
  }

  return { users }
}

export default function (data) {
  const user = data.users[randomIntBetween(0, data.users.length - 1)]
  activeUsers.add(1)

  group('Browse Products', () => {
    const start = Date.now()

    // Get product list
    const productsRes = http.get(`${BASE_URL}/api/marketplace/products?page=1&limit=20`, {
      headers: getHeaders(user.token),
    })

    if (handleResponse(productsRes, 'Get Products')) {
      apiTrend.add(Date.now() - start)

      // View random product details
      const product = testProducts[randomIntBetween(0, testProducts.length - 1)]
      const productRes = http.get(`${BASE_URL}/api/marketplace/products/${product.id}`, {
        headers: getHeaders(user.token),
      })

      handleResponse(productRes, 'Get Product Details')
    }

    sleep(randomIntBetween(1, 3))
  })

  group('Search Products', () => {
    const start = Date.now()
    const query = searchQueries[randomIntBetween(0, searchQueries.length - 1)]

    const searchRes = http.get(
      `${BASE_URL}/api/marketplace/search?q=${encodeURIComponent(query)}`,
      { headers: getHeaders(user.token) }
    )

    if (handleResponse(searchRes, 'Search Products')) {
      searchTrend.add(Date.now() - start)
    }

    sleep(randomIntBetween(1, 2))
  })

  group('Shopping Cart Operations', () => {
    // Add to cart
    const product = testProducts[randomIntBetween(0, testProducts.length - 1)]
    const quantity = randomIntBetween(1, 5)

    const addToCartRes = http.post(
      `${BASE_URL}/api/marketplace/cart/add`,
      JSON.stringify({
        productId: product.id,
        quantity,
      }),
      { headers: getHeaders(user.token) }
    )

    if (handleResponse(addToCartRes, 'Add to Cart')) {
      cartOperations.add(1)

      // Get cart
      const cartRes = http.get(`${BASE_URL}/api/marketplace/cart`, {
        headers: getHeaders(user.token),
      })

      handleResponse(cartRes, 'Get Cart')

      // Update quantity (50% chance)
      if (Math.random() > 0.5) {
        const updateRes = http.put(
          `${BASE_URL}/api/marketplace/cart/update`,
          JSON.stringify({
            productId: product.id,
            quantity: randomIntBetween(1, 10),
          }),
          { headers: getHeaders(user.token) }
        )

        handleResponse(updateRes, 'Update Cart')
        cartOperations.add(1)
      }

      // Remove from cart (20% chance)
      if (Math.random() > 0.8) {
        const removeRes = http.delete(`${BASE_URL}/api/marketplace/cart/remove/${product.id}`, {
          headers: getHeaders(user.token),
        })

        handleResponse(removeRes, 'Remove from Cart')
        cartOperations.add(1)
      }
    }

    sleep(randomIntBetween(2, 5))
  })

  group('Checkout Process', () => {
    const start = Date.now()

    // Only 30% of users complete checkout
    if (Math.random() > 0.7) {
      const checkoutData = {
        items: [
          {
            productId: testProducts[0].id,
            quantity: 2,
            price: testProducts[0].price,
          },
        ],
        shipping: {
          firstName: 'Load',
          lastName: 'Test',
          email: user.email,
          phone: '+33123456789',
          address: '123 Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
        billing: {
          sameAsShipping: true,
        },
        payment: {
          method: 'card',
          token: 'tok_visa_test',
        },
      }

      // Validate checkout
      const validateRes = http.post(
        `${BASE_URL}/api/marketplace/checkout/validate`,
        JSON.stringify(checkoutData),
        { headers: getHeaders(user.token) }
      )

      if (handleResponse(validateRes, 'Validate Checkout')) {
        // Create order
        const orderRes = http.post(
          `${BASE_URL}/api/marketplace/orders`,
          JSON.stringify(checkoutData),
          { headers: getHeaders(user.token) }
        )

        if (handleResponse(orderRes, 'Create Order')) {
          checkoutTrend.add(Date.now() - start)

          // Process payment (mock)
          const orderData = JSON.parse(orderRes.body)
          const paymentRes = http.post(
            `${BASE_URL}/api/marketplace/payments/process`,
            JSON.stringify({
              orderId: orderData.id,
              amount: orderData.totalAmount,
              currency: 'EUR',
              paymentMethod: {
                type: 'card',
                token: 'tok_visa_test',
              },
            }),
            { headers: getHeaders(user.token) }
          )

          handleResponse(paymentRes, 'Process Payment')
        }
      }
    }

    sleep(randomIntBetween(1, 3))
  })

  group('User Account', () => {
    // Get user orders
    const ordersRes = http.get(`${BASE_URL}/api/marketplace/orders/my-orders`, {
      headers: getHeaders(user.token),
    })

    handleResponse(ordersRes, 'Get My Orders')

    // Get addresses
    const addressesRes = http.get(`${BASE_URL}/api/marketplace/addresses`, {
      headers: getHeaders(user.token),
    })

    handleResponse(addressesRes, 'Get Addresses')

    // Get wishlist
    const wishlistRes = http.get(`${BASE_URL}/api/marketplace/wishlist`, {
      headers: getHeaders(user.token),
    })

    handleResponse(wishlistRes, 'Get Wishlist')

    sleep(randomIntBetween(2, 4))
  })

  group('API Performance', () => {
    // Test various API endpoints for performance
    const endpoints = [
      '/api/marketplace/categories',
      '/api/marketplace/brands',
      '/api/marketplace/products/featured',
      '/api/marketplace/products/bestsellers',
      '/api/marketplace/promotions/active',
    ]

    endpoints.forEach((endpoint) => {
      const res = http.get(`${BASE_URL}${endpoint}`, { headers: getHeaders(user.token) })

      handleResponse(res, `API: ${endpoint}`)
      sleep(0.5)
    })
  })

  activeUsers.add(-1)
}

export function teardown(_data) {}

// Custom checks for different scenarios
export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  }
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Results - TopSteel Marketplace</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 8px; }
        .metric h3 { margin-top: 0; color: #666; }
        .value { font-size: 24px; font-weight: bold; color: #333; }
        .pass { color: green; }
        .fail { color: red; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Load Test Results - TopSteel Marketplace</h1>
    <div class="metrics">
        <div class="metric">
            <h3>Total Requests</h3>
            <div class="value">${data.metrics.http_reqs.values.count}</div>
        </div>
        <div class="metric">
            <h3>Request Rate</h3>
            <div class="value">${data.metrics.http_reqs.values.rate.toFixed(2)}/s</div>
        </div>
        <div class="metric">
            <h3>Error Rate</h3>
            <div class="value ${data.metrics.http_req_failed.values.rate < 0.1 ? 'pass' : 'fail'}">
                ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
            </div>
        </div>
        <div class="metric">
            <h3>Avg Response Time</h3>
            <div class="value">${data.metrics.http_req_duration.values.avg.toFixed(2)}ms</div>
        </div>
        <div class="metric">
            <h3>P95 Response Time</h3>
            <div class="value ${data.metrics.http_req_duration.values['p(95)'] < 500 ? 'pass' : 'fail'}">
                ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
            </div>
        </div>
        <div class="metric">
            <h3>P99 Response Time</h3>
            <div class="value ${data.metrics.http_req_duration.values['p(99)'] < 1000 ? 'pass' : 'fail'}">
                ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
            </div>
        </div>
    </div>
    
    <h2>Threshold Results</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Threshold</th>
            <th>Result</th>
            <th>Status</th>
        </tr>
        ${Object.entries(data.metrics)
          .map(([key, metric]) => {
            if (metric.thresholds) {
              return Object.entries(metric.thresholds)
                .map(
                  ([threshold, passed]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${threshold}</td>
                        <td>${metric.values[threshold.match(/p\((\d+)\)/)?.[1] || 'rate'] || 'N/A'}</td>
                        <td class="${passed ? 'pass' : 'fail'}">${passed ? 'PASS' : 'FAIL'}</td>
                    </tr>
                `
                )
                .join('')
            }
            return ''
          })
          .join('')}
    </table>
    
    <p>Test completed at: ${new Date().toISOString()}</p>
</body>
</html>
  `
}
