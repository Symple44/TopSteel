/**
 * Tests pour les type guards centralisés
 */

import { describe, it, expect } from 'vitest'
import {
  isObject,
  hasProperty,
  safeGet,
  isValidUser,
  isValidCompany,
  isValidAuthTokens,
  isValidExtendedUser,
  hasSocieteRoles,
  hasIsActiveProperty,
  hasRoleProperty,
  isApiSuccess,
  isApiError,
  isNonEmptyString,
  isNonEmptyArray,
  isValidNumber,
  isValidDate,
  isValidISODateString,
  isValidUUID,
  isValidEmail,
  areTokensExpired,
} from '../type-guards'

describe('Generic Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ a: 1 })).toBe(true)
    })

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })

    it('should return true for arrays', () => {
      expect(isObject([])).toBe(true)
    })
  })

  describe('hasProperty', () => {
    it('should return true if object has the property', () => {
      expect(hasProperty({ name: 'test' }, 'name')).toBe(true)
    })

    it('should return false if object does not have the property', () => {
      expect(hasProperty({ name: 'test' }, 'age')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(hasProperty(null, 'prop')).toBe(false)
      expect(hasProperty(undefined, 'prop')).toBe(false)
    })
  })

  describe('safeGet', () => {
    it('should return property value if exists', () => {
      expect(safeGet({ name: 'test' }, 'name', 'default')).toBe('test')
    })

    it('should return default value if property does not exist', () => {
      expect(safeGet({ name: 'test' }, 'age', 25)).toBe(25)
    })

    it('should return default value for null/undefined objects', () => {
      expect(safeGet(null, 'prop', 'default')).toBe('default')
      expect(safeGet(undefined, 'prop', 'default')).toBe('default')
    })
  })
})

describe('User Type Guards', () => {
  describe('isValidUser', () => {
    const validUser = {
      id: '123',
      email: 'test@example.com',
      nom: 'Doe',
      prenom: 'John',
      role: 'USER',
      isActive: true,
    }

    it('should return true for valid user', () => {
      expect(isValidUser(validUser)).toBe(true)
    })

    it('should return false if missing required fields', () => {
      expect(isValidUser({ ...validUser, id: undefined })).toBe(false)
      expect(isValidUser({ ...validUser, email: undefined })).toBe(false)
      expect(isValidUser({ nom: 'Test' })).toBe(false)
    })

    it('should return false for invalid types', () => {
      expect(isValidUser({ ...validUser, id: 123 })).toBe(false)
      expect(isValidUser({ ...validUser, email: null })).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isValidUser(null)).toBe(false)
      expect(isValidUser(undefined)).toBe(false)
    })
  })

  describe('hasSocieteRoles', () => {
    it('should return true if societeRoles is an array', () => {
      expect(hasSocieteRoles({ societeRoles: [] })).toBe(true)
      expect(hasSocieteRoles({ societeRoles: [{ id: '1' }] })).toBe(true)
    })

    it('should return false if societeRoles is not an array', () => {
      expect(hasSocieteRoles({ societeRoles: 'not array' })).toBe(false)
      expect(hasSocieteRoles({})).toBe(false)
    })
  })

  describe('hasRoleProperty', () => {
    it('should return true if role is a string', () => {
      expect(hasRoleProperty({ role: 'ADMIN' })).toBe(true)
    })

    it('should return false if role is not a string', () => {
      expect(hasRoleProperty({ role: 123 })).toBe(false)
      expect(hasRoleProperty({})).toBe(false)
    })
  })

  describe('isValidExtendedUser', () => {
    const validExtendedUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      societeRoles: [],
    }

    it('should return true for valid extended user', () => {
      expect(isValidExtendedUser(validExtendedUser)).toBe(true)
    })

    it('should return false if missing societeRoles', () => {
      const { societeRoles, ...withoutRoles } = validExtendedUser
      expect(isValidExtendedUser(withoutRoles)).toBe(false)
    })
  })
})

describe('Company Type Guards', () => {
  describe('isValidCompany', () => {
    const validCompany = {
      id: '123',
      nom: 'Test Company',
      code: 'TC001',
    }

    it('should return true for valid company', () => {
      expect(isValidCompany(validCompany)).toBe(true)
    })

    it('should return false if missing required fields', () => {
      expect(isValidCompany({ id: '123', nom: 'Test' })).toBe(false)
      expect(isValidCompany({ id: '123', code: 'TC' })).toBe(false)
    })

    it('should return false for invalid types', () => {
      expect(isValidCompany({ ...validCompany, id: 123 })).toBe(false)
    })
  })

  describe('hasIsActiveProperty', () => {
    it('should return true if isActive is boolean', () => {
      expect(hasIsActiveProperty({ isActive: true })).toBe(true)
      expect(hasIsActiveProperty({ isActive: false })).toBe(true)
    })

    it('should return false if isActive is not boolean', () => {
      expect(hasIsActiveProperty({ isActive: 'yes' })).toBe(false)
      expect(hasIsActiveProperty({})).toBe(false)
    })
  })
})

describe('Auth Type Guards', () => {
  describe('isValidAuthTokens', () => {
    const validTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    }

    it('should return true for valid tokens', () => {
      expect(isValidAuthTokens(validTokens)).toBe(true)
    })

    it('should return false if missing tokens', () => {
      expect(isValidAuthTokens({ accessToken: 'token' })).toBe(false)
      expect(isValidAuthTokens({ refreshToken: 'token' })).toBe(false)
    })

    it('should return false for invalid types', () => {
      expect(isValidAuthTokens({ accessToken: 123, refreshToken: 'token' })).toBe(false)
    })
  })

  describe('areTokensExpired', () => {
    it('should return true if token is expired', () => {
      const expiredTokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000, // 1 second ago
      }
      expect(areTokensExpired(expiredTokens)).toBe(true)
    })

    it('should return false if token is not expired', () => {
      const validTokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      }
      expect(areTokensExpired(validTokens)).toBe(false)
    })

    it('should return false if no expiresAt', () => {
      const tokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
      }
      expect(areTokensExpired(tokens as any)).toBe(false)
    })
  })
})

describe('API Response Type Guards', () => {
  describe('isApiSuccess', () => {
    it('should return true for success response', () => {
      expect(isApiSuccess({ success: true, data: { id: 1 } })).toBe(true)
    })

    it('should return false for error response', () => {
      expect(isApiSuccess({ success: false, error: 'Error' })).toBe(false)
    })

    it('should return false for invalid structure', () => {
      expect(isApiSuccess({ data: { id: 1 } })).toBe(false)
    })
  })

  describe('isApiError', () => {
    it('should return true for error response', () => {
      expect(isApiError({ success: false, error: 'Error message' })).toBe(true)
    })

    it('should return false for success response', () => {
      expect(isApiError({ success: true, data: {} })).toBe(false)
    })
  })
})

describe('Utility Type Guards', () => {
  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('  hello  ')).toBe(true)
    })

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
    })

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
    })
  })

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true)
      expect(isNonEmptyArray(['a'])).toBe(true)
    })

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false)
    })

    it('should return false for non-arrays', () => {
      expect(isNonEmptyArray('not array')).toBe(false)
      expect(isNonEmptyArray(null)).toBe(false)
    })
  })

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(42)).toBe(true)
      expect(isValidNumber(0)).toBe(true)
      expect(isValidNumber(-10)).toBe(true)
      expect(isValidNumber(3.14)).toBe(true)
    })

    it('should return false for NaN', () => {
      expect(isValidNumber(NaN)).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(-Infinity)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(isValidNumber('42')).toBe(false)
      expect(isValidNumber(null)).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date('2024-01-01'))).toBe(true)
    })

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false)
    })

    it('should return false for non-dates', () => {
      expect(isValidDate('2024-01-01')).toBe(false)
      expect(isValidDate(null)).toBe(false)
    })
  })

  describe('isValidISODateString', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isValidISODateString('2024-01-15T10:30:00.000Z')).toBe(true)
      expect(isValidISODateString('2024-01-15')).toBe(true)
    })

    it('should return false for invalid date strings', () => {
      expect(isValidISODateString('not-a-date')).toBe(false)
      expect(isValidISODateString('32-13-2024')).toBe(false)
    })

    it('should return false for non-strings', () => {
      expect(isValidISODateString(123)).toBe(false)
      expect(isValidISODateString(null)).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
      expect(isValidUUID('')).toBe(false)
    })

    it('should return false for non-strings', () => {
      expect(isValidUUID(123)).toBe(false)
      expect(isValidUUID(null)).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.org')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should return false for invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })

    it('should return false for non-strings', () => {
      expect(isValidEmail(123)).toBe(false)
      expect(isValidEmail(null)).toBe(false)
    })
  })
})
