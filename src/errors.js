/*
 * COPYRIGHT
 */

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

  isCaused(type = Error) {
    return this.cause && this.cause instanceof type;
  }

  static findMessage(error) {
    return error instanceof Error ? error.message : error.toString();
  }

  static findCause(error, cause) {
    return cause || (error instanceof Error ? error : undefined);
  }

}

class SystemError extends CustomError {

  constructor(error = '', exitCode = 255, cause = undefined) {
    super(CustomError.findMessage(error), CustomError.findCause(error, cause));
    this.exitCode = exitCode;
  }

  get exitCode() {
    return this.exitCode;
  }

}

class ApplicationError extends CustomError {

  constructor(error = '', statusCode = 500, ...details) {
    const cause = ApplicationError.findProbableCause(details);
    super(CustomError.findMessage(error), CustomError.findCause(error, cause));
    this.statusCode = statusCode;
    this.details = details || [];
  }

  get exitCode() {
    return this.exitCode;
  }

  get details() {
    return this.details;
  }

  static findProbableCause(details) {
    return details[0] instanceof Error ? details.shift() : undefined;
  }

}

export {
  SystemError,
  ApplicationError,
};
