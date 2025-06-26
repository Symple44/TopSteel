// Jest setup for TopSteel ERP tests
import '@testing-library/jest-dom';

// Mock console methods
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
