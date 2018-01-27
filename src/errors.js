/*
 * COPYRIGHT
 */

function pickMessage(error) {
  return error instanceof Error ? error.message : error.toString();
}

function pickCause(error, cause) {
  return cause || (error instanceof Error ? error : undefined);
}

function pickProbableCause(details) {
  return details[0] instanceof Error ? details.shift() : undefined;
}

class CustomError extends Error {

  constructor(message, cause = undefined) {
    super(message);
    this.cause = cause;
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  get cause() {
    return this.cause;
  }

}

class SystemError extends CustomError {

  constructor(error = '', exitCode = 255, cause = undefined) {
    super(pickMessage(error), pickCause(error, cause));
    this.exitCode = exitCode;
  }

  get exitCode() {
    return this.exitCode;
  }

}

class ApplicationError extends CustomError {

  constructor(error = '', statusCode = 500, ...details) {
    super(pickMessage(error), pickCause(error, pickProbableCause(details)));
    this.statusCode = statusCode;
    this.details = details || [];
  }

  get exitCode() {
    return this.exitCode;
  }

  get details() {
    return this.details;
  }

}

export {
  SystemError,
  ApplicationError,
};
