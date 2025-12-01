/**
 * Test suite for DataTable Preset System
 */

import { describe, expect, it } from 'vitest'
import {
  applyPreset,
  comparePresets,
  createCustomPreset,
  DATATABLE_PRESETS,
  getEnabledFeatures,
  getRecommendedPreset,
  hasFeature,
  type DataTablePreset,
} from './index'

describe('DataTable Preset System', () => {
  describe('DATATABLE_PRESETS', () => {
    it('should have all required presets', () => {
      expect(DATATABLE_PRESETS).toBeDefined()
      expect(DATATABLE_PRESETS.minimal).toBeDefined()
      expect(DATATABLE_PRESETS.standard).toBeDefined()
      expect(DATATABLE_PRESETS.advanced).toBeDefined()
      expect(DATATABLE_PRESETS.full).toBeDefined()
    })

    it('minimal preset should disable all major features', () => {
      const minimal = DATATABLE_PRESETS.minimal
      expect(minimal.sortable).toBe(false)
      expect(minimal.searchable).toBe(false)
      expect(minimal.filterable).toBe(false)
      expect(minimal.selectable).toBe(false)
      expect(minimal.exportable).toBe(false)
      expect(minimal.pagination).toBe(false)
    })

    it('standard preset should enable basic features', () => {
      const standard = DATATABLE_PRESETS.standard
      expect(standard.sortable).toBe(true)
      expect(standard.searchable).toBe(true)
      expect(standard.pagination).toBe(true)
      expect(standard.filterable).toBe(false)
      expect(standard.exportable).toBe(false)
    })

    it('advanced preset should enable most features', () => {
      const advanced = DATATABLE_PRESETS.advanced
      expect(advanced.sortable).toBe(true)
      expect(advanced.searchable).toBe(true)
      expect(advanced.filterable).toBe(true)
      expect(advanced.selectable).toBe(true)
      expect(advanced.exportable).toBe(true)
      expect(advanced.pagination).toBe(true)
    })

    it('full preset should enable all features', () => {
      const full = DATATABLE_PRESETS.full
      expect(full.sortable).toBe(true)
      expect(full.searchable).toBe(true)
      expect(full.filterable).toBe(true)
      expect(full.selectable).toBe(true)
      expect(full.exportable).toBe(true)
      expect(full.editable).toBe(true)
      expect(full.pagination).toBe(true)
      expect(full.virtualize).toBe(true)
    })
  })

  describe('applyPreset', () => {
    it('should return preset configuration without overrides', () => {
      const config = applyPreset('standard')
      expect(config).toEqual(DATATABLE_PRESETS.standard)
    })

    it('should apply overrides to preset configuration', () => {
      const config = applyPreset('standard', {
        exportable: true,
        compact: true,
      })
      expect(config.exportable).toBe(true)
      expect(config.compact).toBe(true)
      expect(config.sortable).toBe(true) // From preset
      expect(config.searchable).toBe(true) // From preset
    })

    it('should throw error for invalid preset', () => {
      expect(() => {
        applyPreset('invalid' as DataTablePreset)
      }).toThrow('Invalid preset')
    })

    it('should merge all properties correctly', () => {
      const config = applyPreset('minimal', {
        sortable: true,
        pagination: true,
      })
      expect(config.sortable).toBe(true)
      expect(config.pagination).toBe(true)
      expect(config.searchable).toBe(false) // Original from minimal
    })
  })

  describe('getRecommendedPreset', () => {
    it('should recommend minimal for read-only use case', () => {
      expect(getRecommendedPreset('read-only')).toBe('minimal')
    })

    it('should recommend standard for crud use case', () => {
      expect(getRecommendedPreset('crud')).toBe('standard')
    })

    it('should recommend advanced for data-analysis use case', () => {
      expect(getRecommendedPreset('data-analysis')).toBe('advanced')
    })

    it('should recommend full for spreadsheet use case', () => {
      expect(getRecommendedPreset('spreadsheet')).toBe('full')
    })
  })

  describe('comparePresets', () => {
    it('should return differences between minimal and standard', () => {
      const diff = comparePresets('minimal', 'standard')
      expect(diff.sortable).toEqual({ preset1: false, preset2: true })
      expect(diff.searchable).toEqual({ preset1: false, preset2: true })
      expect(diff.pagination).toEqual({ preset1: false, preset2: true })
    })

    it('should return differences between standard and advanced', () => {
      const diff = comparePresets('standard', 'advanced')
      expect(diff.filterable).toEqual({ preset1: false, preset2: true })
      expect(diff.selectable).toEqual({ preset1: false, preset2: true })
      expect(diff.exportable).toEqual({ preset1: false, preset2: true })
    })

    it('should return empty object for identical presets', () => {
      const diff = comparePresets('standard', 'standard')
      expect(Object.keys(diff)).toHaveLength(0)
    })

    it('should include all differences between minimal and full', () => {
      const diff = comparePresets('minimal', 'full')
      expect(diff.sortable).toBeDefined()
      expect(diff.searchable).toBeDefined()
      expect(diff.filterable).toBeDefined()
      expect(diff.editable).toBeDefined()
      expect(diff.selectable).toBeDefined()
      expect(diff.exportable).toBeDefined()
      expect(diff.pagination).toBeDefined()
    })
  })

  describe('hasFeature', () => {
    it('should return true for enabled features', () => {
      expect(hasFeature('standard', 'sortable')).toBe(true)
      expect(hasFeature('standard', 'searchable')).toBe(true)
      expect(hasFeature('advanced', 'exportable')).toBe(true)
    })

    it('should return false for disabled features', () => {
      expect(hasFeature('minimal', 'sortable')).toBe(false)
      expect(hasFeature('minimal', 'searchable')).toBe(false)
      expect(hasFeature('standard', 'exportable')).toBe(false)
    })

    it('should handle all presets correctly', () => {
      expect(hasFeature('full', 'editable')).toBe(true)
      expect(hasFeature('advanced', 'editable')).toBe(false)
      expect(hasFeature('minimal', 'pagination')).toBe(false)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return minimal enabled features for minimal preset', () => {
      const features = getEnabledFeatures('minimal')
      expect(features).toContain('striped')
      expect(features).toContain('bordered')
      expect(features).not.toContain('sortable')
      expect(features).not.toContain('searchable')
    })

    it('should return all basic features for standard preset', () => {
      const features = getEnabledFeatures('standard')
      expect(features).toContain('sortable')
      expect(features).toContain('searchable')
      expect(features).toContain('pagination')
      expect(features).toContain('hoverable')
    })

    it('should return many features for advanced preset', () => {
      const features = getEnabledFeatures('advanced')
      expect(features).toContain('sortable')
      expect(features).toContain('searchable')
      expect(features).toContain('filterable')
      expect(features).toContain('selectable')
      expect(features).toContain('exportable')
    })

    it('should return maximum features for full preset', () => {
      const features = getEnabledFeatures('full')
      expect(features).toContain('sortable')
      expect(features).toContain('searchable')
      expect(features).toContain('filterable')
      expect(features).toContain('editable')
      expect(features).toContain('selectable')
      expect(features).toContain('exportable')
      expect(features).toContain('pagination')
    })
  })

  describe('createCustomPreset', () => {
    it('should create custom preset from base', () => {
      const custom = createCustomPreset('minimal', {
        searchable: true,
        exportable: true,
      })
      expect(custom.searchable).toBe(true)
      expect(custom.exportable).toBe(true)
      expect(custom.sortable).toBe(false) // From minimal
      expect(custom.pagination).toBe(false) // From minimal
    })

    it('should work with any base preset', () => {
      const custom1 = createCustomPreset('standard', { compact: true })
      expect(custom1.compact).toBe(true)
      expect(custom1.sortable).toBe(true) // From standard

      const custom2 = createCustomPreset('advanced', { editable: true })
      expect(custom2.editable).toBe(true)
      expect(custom2.filterable).toBe(true) // From advanced
    })

    it('should handle multiple overrides', () => {
      const custom = createCustomPreset('minimal', {
        sortable: true,
        searchable: true,
        filterable: true,
        exportable: true,
        pagination: true,
      })
      expect(custom.sortable).toBe(true)
      expect(custom.searchable).toBe(true)
      expect(custom.filterable).toBe(true)
      expect(custom.exportable).toBe(true)
      expect(custom.pagination).toBe(true)
    })
  })

  describe('Preset Configuration Integrity', () => {
    it('should have all required properties in each preset', () => {
      const requiredProps = [
        'sortable',
        'searchable',
        'filterable',
        'editable',
        'selectable',
        'exportable',
        'pagination',
        'striped',
        'bordered',
        'hoverable',
        'compact',
      ]

      Object.values(DATATABLE_PRESETS).forEach((preset) => {
        requiredProps.forEach((prop) => {
          expect(preset).toHaveProperty(prop)
        })
      })
    })

    it('should have progressive feature enablement', () => {
      // Minimal < Standard < Advanced < Full
      const minimal = DATATABLE_PRESETS.minimal
      const standard = DATATABLE_PRESETS.standard
      const advanced = DATATABLE_PRESETS.advanced
      const full = DATATABLE_PRESETS.full

      // Count enabled boolean features
      const countEnabled = (preset: typeof minimal) => {
        return Object.values(preset).filter((v) => v === true).length
      }

      expect(countEnabled(minimal)).toBeLessThan(countEnabled(standard))
      expect(countEnabled(standard)).toBeLessThan(countEnabled(advanced))
      expect(countEnabled(advanced)).toBeLessThanOrEqual(countEnabled(full))
    })

    it('should have consistent pagination options', () => {
      expect(DATATABLE_PRESETS.standard.pageSizeOptions).toEqual([10, 25, 50, 100])
      expect(DATATABLE_PRESETS.advanced.pageSizeOptions).toEqual([10, 25, 50, 100, 250])
      expect(DATATABLE_PRESETS.full.pageSizeOptions).toEqual([10, 25, 50, 100, 250, 500])
    })

    it('should have appropriate virtualization settings', () => {
      expect(DATATABLE_PRESETS.minimal.virtualizeThreshold).toBe(100)
      expect(DATATABLE_PRESETS.standard.virtualizeThreshold).toBe(100)
      expect(DATATABLE_PRESETS.advanced.virtualizeThreshold).toBe(100)
      expect(DATATABLE_PRESETS.full.virtualizeThreshold).toBe(50) // Lower for full
      expect(DATATABLE_PRESETS.full.virtualize).toBe(true) // Forced on for full
    })
  })
})
