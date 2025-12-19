interface LogErrorOptions {
  errorType: 'api' | 'frontend' | 'enhancement' | 'payment' | 'auth';
  message: string;
  stack?: string;
  code?: string;
  endpoint?: string;
  requestData?: any;
  responseData?: any;
  severity?: 'warning' | 'error' | 'critical';
  userId?: string;
}

export const logError = async (options: LogErrorOptions) => {
  try {
    await fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_type: options.errorType,
        error_message: options.message,
        error_stack: options.stack,
        error_code: options.code,
        endpoint: options.endpoint,
        request_data: options.requestData,
        response_data: options.responseData,
        severity: options.severity || 'error',
        user_id: options.userId,
      }),
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

