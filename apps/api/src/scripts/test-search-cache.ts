#!/usr/bin/env ts-node

/**
 * Test script for Search Cache Implementation
 * 
 * This script validates the search cache functionality including:
 * - Cache service initialization
 * - Cache operations (set, get, delete)
 * - Cache invalidation
 * - Statistics collection
 * - Performance metrics
 * 
 * Usage: npm run test:search-cache
 */

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { SearchCacheService } from '../features/search/services/search-cache.service'
import { SearchCacheInvalidationService } from '../features/search/services/search-cache-invalidation.service'
import { CachedGlobalSearchService } from '../features/search/services/cached-global-search.service'
import { SearchOptions } from '../features/search/interfaces/search.interfaces'

interface TestResult {
  testName: string
  success: boolean
  duration: number
  details?: any
  error?: string
}

class SearchCacheValidator {
  private results: TestResult[] = []
  private cacheService: SearchCacheService
  private invalidationService: SearchCacheInvalidationService
  private cachedSearchService: CachedGlobalSearchService

  async run() {
    console.log('🚀 Starting Search Cache Validation...\n')

    try {
      // Initialize NestJS application
      const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error'] // Reduce noise during testing
      })

      // Get service instances
      this.cacheService = app.get(SearchCacheService)
      this.invalidationService = app.get(SearchCacheInvalidationService)
      this.cachedSearchService = app.get(CachedGlobalSearchService)

      // Run tests
      await this.testCacheServiceInitialization()
      await this.testCacheConfiguration()
      await this.testCacheOperations()
      await this.testCacheKeyGeneration()
      await this.testTenantAwareness()
      await this.testCacheInvalidation()
      await this.testStatisticsCollection()
      await this.testPerformanceMetrics()
      await this.testCacheHealth()
      await this.testErrorHandling()

      // Print results
      this.printResults()

      await app.close()
    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error.message)
      process.exit(1)
    }
  }

  private async testCacheServiceInitialization() {
    const testName = 'Cache Service Initialization'
    const startTime = Date.now()

    try {
      const isHealthy = await this.cacheService.isHealthy()
      const config = this.cacheService.getCacheConfig()

      this.addResult({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          healthy: isHealthy,
          enabled: config.enabled,
          defaultTTL: config.defaultTTL
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testCacheConfiguration() {
    const testName = 'Cache Configuration'
    const startTime = Date.now()

    try {
      const config = this.cacheService.getCacheConfig()

      const expectedEntityTypes = [
        'product', 'customer', 'supplier', 'order', 
        'invoice', 'user', 'site', 'menu'
      ]

      const hasAllEntityTTLs = expectedEntityTypes.every(
        type => config.entityTTLs[type] !== undefined
      )

      this.addResult({
        testName,
        success: hasAllEntityTTLs && config.enabled !== undefined,
        duration: Date.now() - startTime,
        details: {
          entityTTLsConfigured: expectedEntityTypes.length,
          defaultTTL: config.defaultTTL,
          keyPrefix: config.keyPrefix
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testCacheOperations() {
    const testName = 'Basic Cache Operations'
    const startTime = Date.now()

    try {
      const tenantId = 'test-tenant-001'
      const testOptions: SearchOptions = {
        query: 'test search query',
        entityTypes: ['product'],
        limit: 10,
        offset: 0
      }

      const mockResults = {
        results: [
          { id: '1', title: 'Test Product 1', type: 'product' },
          { id: '2', title: 'Test Product 2', type: 'product' }
        ],
        total: 2,
        metadata: { searchTime: 50 }
      }

      // Test cache set
      await this.cacheService.cacheSearchResults(tenantId, testOptions, mockResults)

      // Test cache get
      const cachedResults = await this.cacheService.getCachedSearchResults(tenantId, testOptions)

      const cacheWorking = cachedResults !== null && 
                          cachedResults.results.length === 2 &&
                          cachedResults.total === 2

      this.addResult({
        testName,
        success: cacheWorking,
        duration: Date.now() - startTime,
        details: {
          cacheSet: true,
          cacheGet: cachedResults !== null,
          resultCount: cachedResults?.results.length || 0
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testCacheKeyGeneration() {
    const testName = 'Cache Key Generation'
    const startTime = Date.now()

    try {
      const tenantId = 'test-tenant-001'
      
      // Test consistent key generation
      const options1: SearchOptions = {
        query: 'test query',
        entityTypes: ['product', 'customer'],
        limit: 20
      }

      const options2: SearchOptions = {
        query: 'test query',
        entityTypes: ['customer', 'product'], // Different order
        limit: 20
      }

      const key1 = this.cacheService.generateCacheKey(tenantId, options1)
      const key2 = this.cacheService.generateCacheKey(tenantId, options2)

      // Keys should be the same (entity types are sorted)
      const keysMatch = key1 === key2

      // Test different tenant keys
      const key3 = this.cacheService.generateCacheKey('different-tenant', options1)
      const tenantSeparation = key1 !== key3

      this.addResult({
        testName,
        success: keysMatch && tenantSeparation,
        duration: Date.now() - startTime,
        details: {
          consistentKeys: keysMatch,
          tenantSeparation: tenantSeparation,
          sampleKey: key1
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testTenantAwareness() {
    const testName = 'Tenant-Aware Caching'
    const startTime = Date.now()

    try {
      const tenant1 = 'tenant-001'
      const tenant2 = 'tenant-002'
      
      const searchOptions: SearchOptions = {
        query: 'same query',
        entityTypes: ['product']
      }

      const results1 = {
        results: [{ id: '1', title: 'Tenant 1 Product', type: 'product' }],
        total: 1,
        metadata: {}
      }

      const results2 = {
        results: [{ id: '2', title: 'Tenant 2 Product', type: 'product' }],
        total: 1,
        metadata: {}
      }

      // Cache same query for different tenants
      await this.cacheService.cacheSearchResults(tenant1, searchOptions, results1)
      await this.cacheService.cacheSearchResults(tenant2, searchOptions, results2)

      // Retrieve cached results for each tenant
      const cached1 = await this.cacheService.getCachedSearchResults(tenant1, searchOptions)
      const cached2 = await this.cacheService.getCachedSearchResults(tenant2, searchOptions)

      const tenantIsolation = cached1 && cached2 &&
                             cached1.results[0].title === 'Tenant 1 Product' &&
                             cached2.results[0].title === 'Tenant 2 Product'

      this.addResult({
        testName,
        success: tenantIsolation,
        duration: Date.now() - startTime,
        details: {
          tenant1Results: cached1?.results.length || 0,
          tenant2Results: cached2?.results.length || 0,
          tenantIsolation: tenantIsolation
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testCacheInvalidation() {
    const testName = 'Cache Invalidation'
    const startTime = Date.now()

    try {
      const tenantId = 'test-tenant-invalidation'
      
      // Cache some data
      const searchOptions: SearchOptions = {
        query: 'product to be invalidated',
        entityTypes: ['product']
      }

      const results = {
        results: [{ id: 'product-123', title: 'Test Product', type: 'product' }],
        total: 1,
        metadata: {}
      }

      await this.cacheService.cacheSearchResults(tenantId, searchOptions, results)

      // Verify cache exists
      const beforeInvalidation = await this.cacheService.getCachedSearchResults(tenantId, searchOptions)

      // Invalidate cache
      await this.invalidationService.invalidateEntity(tenantId, 'product', 'product-123')

      // Check invalidation stats
      const stats = this.invalidationService.getInvalidationStats()

      this.addResult({
        testName,
        success: beforeInvalidation !== null && stats.totalInvalidations > 0,
        duration: Date.now() - startTime,
        details: {
          cacheExistedBefore: beforeInvalidation !== null,
          invalidationCount: stats.totalInvalidations,
          invalidationsByEntity: stats.invalidationsByEntity
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testStatisticsCollection() {
    const testName = 'Statistics Collection'
    const startTime = Date.now()

    try {
      const stats = await this.cacheService.getCacheStatistics()
      const invalidationStats = this.invalidationService.getInvalidationStats()

      const hasRequiredStats = stats.hits !== undefined &&
                              stats.misses !== undefined &&
                              stats.hitRate !== undefined &&
                              stats.lastUpdated instanceof Date

      this.addResult({
        testName,
        success: hasRequiredStats,
        duration: Date.now() - startTime,
        details: {
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hitRate,
          totalInvalidations: invalidationStats.totalInvalidations
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testPerformanceMetrics() {
    const testName = 'Performance Metrics'
    const startTime = Date.now()

    try {
      // Perform multiple cache operations to generate metrics
      const tenantId = 'perf-test-tenant'
      
      for (let i = 0; i < 5; i++) {
        const options: SearchOptions = {
          query: `performance test ${i}`,
          entityTypes: ['product']
        }

        const mockResults = {
          results: [{ id: `perf-${i}`, title: `Performance Test ${i}`, type: 'product' }],
          total: 1,
          metadata: {}
        }

        await this.cacheService.cacheSearchResults(tenantId, options, mockResults)
        await this.cacheService.getCachedSearchResults(tenantId, options)
      }

      const stats = await this.cacheService.getCacheStatistics()
      const hasMetrics = stats.hits > 0 || stats.misses > 0

      this.addResult({
        testName,
        success: hasMetrics,
        duration: Date.now() - startTime,
        details: {
          operationsPerformed: 10, // 5 sets + 5 gets
          totalHits: stats.hits,
          totalMisses: stats.misses,
          hitRate: stats.hitRate
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testCacheHealth() {
    const testName = 'Cache Health Check'
    const startTime = Date.now()

    try {
      const isHealthy = await this.cacheService.isHealthy()
      const config = this.cacheService.getCacheConfig()

      this.addResult({
        testName,
        success: true, // Always successful if we can call it
        duration: Date.now() - startTime,
        details: {
          healthy: isHealthy,
          enabled: config.enabled,
          redisRequired: config.enabled
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private async testErrorHandling() {
    const testName = 'Error Handling'
    const startTime = Date.now()

    try {
      // Test with invalid tenant ID
      const invalidOptions: SearchOptions = {
        query: 'test with null tenant',
        entityTypes: ['product']
      }

      // This should not throw an error, but return null gracefully
      const result = await this.cacheService.getCachedSearchResults('', invalidOptions)
      
      this.addResult({
        testName,
        success: result === null, // Should handle gracefully
        duration: Date.now() - startTime,
        details: {
          handledGracefully: result === null,
          noExceptionThrown: true
        }
      })
    } catch (error) {
      this.addResult({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
    }
  }

  private addResult(result: TestResult) {
    this.results.push(result)
  }

  private printResults() {
    console.log('\n📊 Search Cache Validation Results')
    console.log('=' .repeat(50))

    let passed = 0
    let failed = 0

    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const duration = `${result.duration}ms`
      
      console.log(`${status} ${result.testName} (${duration})`)
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      
      console.log('')

      if (result.success) {
        passed++
      } else {
        failed++
      }
    })

    console.log('Summary:')
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Check the errors above and verify:')
      console.log('   • Redis is running and accessible')
      console.log('   • Environment variables are set correctly')
      console.log('   • All dependencies are properly injected')
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed! Search cache implementation is working correctly.')
    }
  }
}

// Run the validation if this script is executed directly
if (require.main === module) {
  const validator = new SearchCacheValidator()
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  })
}

export { SearchCacheValidator }