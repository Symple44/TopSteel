import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

interface CSPViolationReport {
  'document-uri': string
  referrer?: string
  'violated-directive': string
  'effective-directive': string
  'original-policy': string
  disposition: 'enforce' | 'report'
  'blocked-uri': string
  'line-number'?: number
  'column-number'?: number
  'source-file'?: string
  'status-code': number
  'script-sample'?: string
}

interface CSPViolationBody {
  'csp-report': CSPViolationReport
}

interface ProcessedViolationInfo {
  timestamp: string
  clientIp: string
  userAgent: string | undefined
  documentUri: string
  referrer?: string
  violatedDirective: string
  effectiveDirective: string
  blockedUri: string
  disposition: string
  sourceFile?: string
  lineNumber?: number
  columnNumber?: number
  scriptSample?: string
  originalPolicy: string
}

@ApiTags('Security')
@Controller('security')
export class CSPViolationsController {
  private readonly logger = new Logger(CSPViolationsController.name)
  private readonly violationCounts = new Map<string, number>()
  private readonly MAX_VIOLATIONS_PER_HOUR = 100
  private readonly VIOLATION_WINDOW = 60 * 60 * 1000 // 1 hour

  @Post('csp-violations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiExcludeEndpoint() // Exclude from Swagger documentation
  async handleCSPViolation(
    @Body() violationData: CSPViolationBody,
    @Req() req: Request
  ): Promise<void> {
    try {
      const report = violationData['csp-report']

      if (!report) {
        this.logger.warn('Received CSP violation report without csp-report field')
        return
      }

      // Rate limiting to prevent log spam
      const clientIp = this.getClientIP(req)
      const violationKey = `${clientIp}-${report['violated-directive']}`

      if (this.isViolationRateLimited(violationKey)) {
        return
      }

      // Log the violation with structured data
      const violationInfo = {
        timestamp: new Date().toISOString(),
        clientIp,
        userAgent: req.headers['user-agent'],
        documentUri: report['document-uri'],
        referrer: report.referrer,
        violatedDirective: report['violated-directive'],
        effectiveDirective: report['effective-directive'],
        blockedUri: report['blocked-uri'],
        disposition: report.disposition,
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        scriptSample: report['script-sample'],
        originalPolicy: `${report['original-policy'].substring(0, 200)}...`, // Truncate for readability
      }

      // Determine log level based on violation type
      const isCritical = this.isCriticalViolation(report)

      if (isCritical) {
        this.logger.error(`🚨 Critical CSP Violation Detected`, violationInfo)

        // In production, you might want to send alerts here
        if (process.env.NODE_ENV === 'production') {
          await this.sendCriticalViolationAlert(violationInfo)
        }
      } else {
        this.logger.warn(`⚠️  CSP Violation Report`, violationInfo)
      }

      // Store for analytics (implement your storage solution here)
      await this.storeViolation(violationInfo)
    } catch (error) {
      this.logger.error('Error processing CSP violation report', error)
    }
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      'unknown'
    )
  }

  private isViolationRateLimited(violationKey: string): boolean {
    const count = this.violationCounts.get(violationKey) || 0

    if (count >= this.MAX_VIOLATIONS_PER_HOUR) {
      return true
    }

    this.violationCounts.set(violationKey, count + 1)

    // Clean up old entries periodically
    setTimeout(() => {
      this.violationCounts.delete(violationKey)
    }, this.VIOLATION_WINDOW)

    return false
  }

  private isCriticalViolation(report: CSPViolationReport): boolean {
    const criticalDirectives = ['script-src', 'object-src', 'base-uri', 'form-action']

    const criticalPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /eval\(/i,
      /Function\(/i,
      /setTimeout.*string/i,
      /setInterval.*string/i,
    ]

    // Check if it's a critical directive
    if (
      criticalDirectives.some((directive) => report['violated-directive'].startsWith(directive))
    ) {
      return true
    }

    // Check for suspicious patterns in blocked URI or script sample
    const textToCheck = [report['blocked-uri'], report['script-sample'], report['source-file']]
      .filter(Boolean)
      .join(' ')

    return criticalPatterns.some((pattern) => pattern.test(textToCheck))
  }

  private async sendCriticalViolationAlert(violationInfo: ProcessedViolationInfo): Promise<void> {
    // Implement your alerting mechanism here
    // Examples: Send to Slack, Discord, email, monitoring service, etc.
    this.logger.error('🚨 CRITICAL CSP VIOLATION - IMMEDIATE ATTENTION REQUIRED', {
      summary: `CSP violation on ${violationInfo.documentUri}`,
      details: violationInfo,
      action: 'Review and fix immediately',
    })
  }

  private async storeViolation(violationInfo: ProcessedViolationInfo): Promise<void> {
    // Implement your violation storage here
    // Examples: Database, time-series DB, monitoring service, etc.

    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('CSP violation stored for analysis', {
        timestamp: violationInfo.timestamp,
        directive: violationInfo.violatedDirective,
        uri: violationInfo.documentUri,
      })
    }
  }
}
