// Stub temporaire pour ExportUtils pendant correction @univerjs
import type { ColumnConfig, ExportOptions, ImportResult } from './types'

export class ExportUtils {
  static exportToExcel(data: any, columns: any, options: any): void {
    throw new Error('ExportUtils temporairement désactivé - @univerjs en cours de correction')
  }
  
  static exportToCSV(data: any, columns: any, options: any): void {
    throw new Error('ExportUtils temporairement désactivé - @univerjs en cours de correction')
  }
  
  static exportToPDF(data: any, columns: any, options: any): void {
    throw new Error('ExportUtils temporairement désactivé - @univerjs en cours de correction')
  }
  
  static importFromExcel(): ImportResult {
    throw new Error('ExportUtils temporairement désactivé - @univerjs en cours de correction')
  }
}