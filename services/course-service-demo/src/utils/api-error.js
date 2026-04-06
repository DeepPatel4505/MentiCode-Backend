class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    data = null,
    error = {},
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.data = data;
    this.error = error;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
