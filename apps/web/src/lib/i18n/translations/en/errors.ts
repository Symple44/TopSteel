export const errors = {
  general: 'An error occurred',
  networkError: 'Network connection error',
  validationError: 'Validation error',
  unauthorized: 'Unauthorized access',
  forbidden: 'Access forbidden',
  serverError: 'Server error',
  timeout: 'Request timeout',
  tryAgain: 'Try again',
  contactSupport: 'Contact support',
  websocket: 'Unable to create WebSocket connection',
  title: 'Error',
  unexpectedDetailed: 'An unexpected error occurred. Please try again.',
  dashboardError: 'Dashboard issue',
  dashboardMessage: 'An error occurred while loading the dashboard.',
  passwords: {
    mismatch: 'Passwords do not match',
    updateFailed: 'Failed to update password',
  },
  reset: {
    confirmText: 'Are you sure you want to reset? This action cannot be undone.',
    success: 'Reset completed successfully',
  },
  network: {
    title: 'Network Error',
    message: 'Unable to connect to server. Check your internet connection.',
    action: 'Retry',
  },
  validation: {
    title: 'Validation Error',
    action: 'Fix errors',
  },
  auth: {
    title: 'Authentication Error',
    message: 'Your session has expired or your credentials are invalid.',
    action: 'Log in again',
  },
  authorization: {
    title: 'Access Denied',
    message: 'You do not have the required permissions for this action.',
    action: 'Go back',
  },
  notFound: {
    title: 'Not Found',
    message: 'The requested resource does not exist or has been deleted.',
    action: 'Go to homepage',
  },
  conflict: {
    title: 'Data Conflict',
    message: 'Data has been modified by another user.',
    action: 'Refresh',
  },
  rateLimit: {
    title: 'Rate Limit Reached',
    message: 'Too many requests. Please wait {{seconds}} seconds.',
    action: 'Wait',
  },
  server: {
    title: 'Server Error',
    message: 'An internal error occurred. Our team has been notified.',
    action: 'Try again later',
  },
  unexpected: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    action: 'Retry',
  },
  backend: {
    unavailable: 'Server unavailable',
    connected: 'Connection restored!',
    checking: 'Checking...',
    connectionInfo: 'Connection information:',
    lastCheck: 'Last check:',
    responseTime: 'Response time:',
    notConfigured: 'Not configured',
    accessDashboard: 'Access dashboard',
    verifying: 'Verifying...',
    autoCheck: 'Automatic check every 30 seconds',
    troubleshooting: 'Troubleshooting tips',
    checkServer: 'Check that the API server is running',
    checkPort: 'Confirm that port {port} is accessible',
    checkNetwork: 'Check your network connection',
    checkLogs: 'Check server logs for more details',
  },
}

export const errorsEnhanced = {
  boundary: {
    title: 'An error occurred',
    description: 'Please refresh the page',
    refresh: 'Refresh',
    retry: 'Retry',
    details: 'Technical details',
    reportIssue: 'Report issue',
  },
  monitoring: {
    title: 'Oops! An error occurred',
    description: 'An unexpected error occurred in the application. Our teams have been notified.',
    reloadPage: 'Reload page',
  },
  connection: {
    lost: 'Connection lost',
    restored: 'Connection restored',
    offline: 'Offline mode',
    reconnecting: 'Reconnecting...',
  },
}

export const success = {
  saved: 'Saved successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  created: 'Created successfully',
  sent: 'Sent successfully',
  imported: 'Imported successfully',
  exported: 'Exported successfully',
  passwordChanged: 'Password changed successfully',
  photoUpdated: 'Profile photo updated',
}
