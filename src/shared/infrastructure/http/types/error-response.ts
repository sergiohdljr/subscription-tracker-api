export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: Array<{
    field: string;
    message: string;
  }>;
}
