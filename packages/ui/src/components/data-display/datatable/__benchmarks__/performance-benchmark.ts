import { performance } from 'perf_hooks'

interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  operations: number
  opsPerSecond: number
}

interface DataRow {
  id: number
  name: string
  email: string
  age: number
  department: string
  salary: number
  status: string
  [key: string]: any
}

class DataTableBenchmark {
  private generateData(count: number): DataRow[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: 20 + (i % 50),
      department: ['Engineering', 'Sales', 'Marketing', 'HR'][i % 4],
      salary: 30000 + (i * 1000) % 100000,
      status: ['active', 'inactive', 'pending'][i % 3]
    }))
  }

  private measureOperation(
    name: string,
    operation: () => void,
    iterations: number = 100
  ): BenchmarkResult {
    const times: number[] = []
    let totalTime = 0

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      operation()
      const end = performance.now()
      const elapsed = end - start
      times.push(elapsed)
      totalTime += elapsed
    }

    return {
      name,
      iterations,
      totalTime,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      operations: iterations,
      opsPerSecond: (iterations / totalTime) * 1000
    }
  }

  benchmarkSorting(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Sorting ${dataSize} rows`,
      () => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
        sorted.length
      },
      100
    )
  }

  benchmarkFiltering(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    const searchTerm = 'Engineering'
    
    return this.measureOperation(
      `Filtering ${dataSize} rows`,
      () => {
        const filtered = data.filter(row => 
          Object.values(row).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        filtered.length
      },
      100
    )
  }

  benchmarkPagination(dataSize: number, pageSize: number = 50): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Paginating ${dataSize} rows (page size: ${pageSize})`,
      () => {
        const pages = Math.ceil(data.length / pageSize)
        for (let page = 0; page < Math.min(pages, 10); page++) {
          const start = page * pageSize
          const end = start + pageSize
          const pageData = data.slice(start, end)
          pageData.length
        }
      },
      100
    )
  }

  benchmarkSelection(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Selecting all ${dataSize} rows`,
      () => {
        const selectedIds = new Set<number>()
        data.forEach(row => selectedIds.add(row.id))
        selectedIds.clear()
      },
      100
    )
  }

  benchmarkComplexFilter(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Complex filter on ${dataSize} rows`,
      () => {
        const filtered = data.filter(row => 
          row.age > 30 && 
          row.salary > 50000 && 
          row.department === 'Engineering' &&
          row.status === 'active'
        )
        filtered.length
      },
      100
    )
  }

  benchmarkMultiSort(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Multi-column sort on ${dataSize} rows`,
      () => {
        const sorted = [...data].sort((a, b) => {
          const deptCompare = a.department.localeCompare(b.department)
          if (deptCompare !== 0) return deptCompare
          return b.salary - a.salary
        })
        sorted.length
      },
      100
    )
  }

  benchmarkGrouping(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Grouping ${dataSize} rows by department`,
      () => {
        const grouped = data.reduce((acc, row) => {
          if (!acc[row.department]) {
            acc[row.department] = []
          }
          acc[row.department].push(row)
          return acc
        }, {} as Record<string, DataRow[]>)
        Object.keys(grouped).length
      },
      100
    )
  }

  benchmarkAggregation(dataSize: number): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Aggregating ${dataSize} rows`,
      () => {
        const stats = {
          totalSalary: data.reduce((sum, row) => sum + row.salary, 0),
          avgAge: data.reduce((sum, row) => sum + row.age, 0) / data.length,
          maxSalary: Math.max(...data.map(row => row.salary)),
          minSalary: Math.min(...data.map(row => row.salary))
        }
        stats.totalSalary
      },
      100
    )
  }

  benchmarkVirtualScrolling(dataSize: number, viewportSize: number = 20): BenchmarkResult {
    const data = this.generateData(dataSize)
    
    return this.measureOperation(
      `Virtual scrolling ${dataSize} rows (viewport: ${viewportSize})`,
      () => {
        const scrollPositions = [0, 100, 500, 1000, 2000, 5000]
        scrollPositions.forEach(position => {
          const startIndex = Math.floor(position / 40)
          const endIndex = startIndex + viewportSize
          const visibleData = data.slice(startIndex, endIndex)
          visibleData.length
        })
      },
      100
    )
  }

  runFullBenchmark(): void {
    console.log('='.repeat(80))
    console.log('DataTable Performance Benchmark')
    console.log('='.repeat(80))

    const dataSizes = [100, 500, 1000, 5000, 10000]
    const results: Record<string, BenchmarkResult[]> = {}

    dataSizes.forEach(size => {
      console.log(`\nBenchmarking with ${size} rows...`)
      console.log('-'.repeat(60))

      const benchmarks = [
        this.benchmarkSorting(size),
        this.benchmarkFiltering(size),
        this.benchmarkPagination(size),
        this.benchmarkSelection(size),
        this.benchmarkComplexFilter(size),
        this.benchmarkMultiSort(size),
        this.benchmarkGrouping(size),
        this.benchmarkAggregation(size),
        this.benchmarkVirtualScrolling(size)
      ]

      benchmarks.forEach(result => {
        if (!results[result.name]) {
          results[result.name] = []
        }
        results[result.name].push(result)
        
        console.log(`${result.name}:`)
        console.log(`  Average: ${result.averageTime.toFixed(3)}ms`)
        console.log(`  Min: ${result.minTime.toFixed(3)}ms`)
        console.log(`  Max: ${result.maxTime.toFixed(3)}ms`)
        console.log(`  Ops/sec: ${result.opsPerSecond.toFixed(0)}`)
      })
    })

    console.log('\n' + '='.repeat(80))
    console.log('Performance Summary')
    console.log('='.repeat(80))
    
    this.printPerformanceTable(results, dataSizes)
    this.checkPerformanceThresholds(results, dataSizes)
  }

  private printPerformanceTable(
    results: Record<string, BenchmarkResult[]>,
    dataSizes: number[]
  ): void {
    console.log('\nAverage Time (ms) by Operation and Data Size:')
    console.log('-'.repeat(80))
    
    const operations = Object.keys(results)
    
    console.log('Operation'.padEnd(40) + dataSizes.map(s => s.toString().padStart(10)).join(''))
    console.log('-'.repeat(80))
    
    operations.forEach(op => {
      const row = op.substring(0, 39).padEnd(40)
      const times = results[op].map(r => r.averageTime.toFixed(2).padStart(10)).join('')
      console.log(row + times)
    })
  }

  private checkPerformanceThresholds(
    results: Record<string, BenchmarkResult[]>,
    dataSizes: number[]
  ): void {
    console.log('\n' + '='.repeat(80))
    console.log('Performance Threshold Check')
    console.log('='.repeat(80))

    const thresholds = {
      'Sorting': { 1000: 10, 5000: 50, 10000: 100 },
      'Filtering': { 1000: 15, 5000: 75, 10000: 150 },
      'Paginating': { 1000: 5, 5000: 10, 10000: 15 },
      'Complex filter': { 1000: 20, 5000: 100, 10000: 200 }
    }

    let allPassed = true

    Object.entries(thresholds).forEach(([operation, limits]) => {
      Object.entries(limits).forEach(([size, maxTime]) => {
        const result = results[`${operation} ${size} rows`]?.[0]
        if (result) {
          const passed = result.averageTime <= maxTime
          const status = passed ? '✅ PASS' : '❌ FAIL'
          
          console.log(
            `${status} ${operation} ${size} rows: ` +
            `${result.averageTime.toFixed(2)}ms ` +
            `(threshold: ${maxTime}ms)`
          )
          
          if (!passed) allPassed = false
        }
      })
    })

    console.log('\n' + '='.repeat(80))
    console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    console.log('='.repeat(80))
  }
}

if (require.main === module) {
  const benchmark = new DataTableBenchmark()
  benchmark.runFullBenchmark()
}

export { DataTableBenchmark, BenchmarkResult }