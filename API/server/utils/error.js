class AppError extends Error {
  isOperational = true;

  constructor(message, status, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', data = null) {
    super(message, 403, data);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

class ImATeapotError extends AppError {
  constructor(message = "I'm a tea pot") {
    super(message, 418);
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
    this.isOperational = false;
  }
}


class ValidationError extends BadRequestError {
  constructor(message = 'Validation Failed', details = []) {
    super(message);
    this.details = details;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ImATeapotError,
  ValidationError,
  ServerError
};
