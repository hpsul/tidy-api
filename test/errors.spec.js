/*
 * COPYRIGHT
 */

import { expect } from 'chai';
import { SystemError, ApplicationError } from '../src/errors';

describe('errors', () => {

  describe('SystemError', () => {

    describe('#constructor()', () => {

      const subject = new SystemError();

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(Error);
      });

      it('should have an empty message', () => {
        expect(subject.message).to.be.empty;
      });

      it('should have a non-zero exit code', () => {
        expect(subject.exitCode).to.be.not.equal(0);
      });

      it('should not have another error as its cause', () => {
        expect(subject.cause).to.be.undefined;
      });

    });

    describe('#constructor(String)', () => {

      const subject = new SystemError('Oops!');

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Oops!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Oops!');
      });

      it('should have a non-zero exit code', () => {
        expect(subject.exitCode).to.be.not.equal(0);
      });

      it('should not have another error as its cause', () => {
        expect(subject.cause).to.be.undefined;
      });

    });

    describe('#constructor(Error)', () => {

      const cause = new Error('Oops!');
      const subject = new SystemError(cause);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Oops!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Oops!');
      });

      it('should have a non-zero exit code', () => {
        expect(subject.exitCode).to.be.not.equal(0);
      });

      it('should have the other error as its cause', () => {
        expect(subject.cause).to.be.equal(cause);
      });

    });

    describe('#constructor(String, int, Error)', () => {

      const cause = new TypeError('Oops!');
      const subject = new SystemError('Uh-oh!', 1, cause);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Uh-oh!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Uh-oh!');
      });

      it('should have the specified exit code', () => {
        expect(subject.exitCode).to.be.equal(1);
      });

      it('should have the specified error as its cause', () => {
        expect(subject.cause).to.be.equal(cause);
        expect(subject.cause).to.be.instanceof(TypeError);
        expect(subject.cause.message).to.be.equal('Oops!');
      });

    });

  });

  describe('ApplicationError', () => {

    describe('#constructor()', () => {

      const subject = new ApplicationError();

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(Error);
      });

      it('should have an empty message', () => {
        expect(subject.message).to.be.empty;
      });

      it('should have the default error status (500)', () => {
        expect(subject.statusCode).to.be.equal(500);
      });

      it('should not have another error as its cause', () => {
        expect(subject.cause).to.be.undefined;
      });

      it('should have an empty list of details', () => {
        expect(subject.details).to.be.empty;
      });

    });

    describe('#constructor(Error)', () => {

      const cause = new Error('Oops!');
      const subject = new ApplicationError(cause);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Oops!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Oops!');
      });

      it('should have the default error status (500)', () => {
        expect(subject.statusCode).to.be.equal(500);
      });

      it('should have the other error as its cause', () => {
        expect(subject.cause).to.be.equal(cause);
      });

      it('should have an empty list of details', () => {
        expect(subject.details).to.be.empty;
      });

    });

    describe('#constructor(String, int)', () => {

      const subject = new ApplicationError('Oops!', 404);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Oops!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Oops!');
      });

      it('should have the specified error status', () => {
        expect(subject.statusCode).to.be.equal(404);
      });

      it('should not have another error as its cause', () => {
        expect(subject.cause).to.be.undefined;
      });

      it('should have an empty list of details', () => {
        expect(subject.details).to.be.empty;
      });

    });

    describe('#constructor(String, int, Error)', () => {

      const cause = new TypeError('Oops!');
      const subject = new ApplicationError('Uh-oh!', 404, cause);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Uh-oh!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Uh-oh!');
      });

      it('should have the specified error status', () => {
        expect(subject.statusCode).to.be.equal(404);
      });

      it('should have the specified error as its cause', () => {
        expect(subject.cause).to.be.equal(cause);
        expect(subject.cause).to.be.instanceof(TypeError);
        expect(subject.cause.message).to.be.equal('Oops!');
      });

      it('should have an empty list of details', () => {
        expect(subject.details).to.be.empty;
      });

    });

    describe('#constructor(String, int, Error, String)', () => {

      const cause = new TypeError('Oops!');
      const subject = new ApplicationError('Uh-oh!', 404, cause, 'Ouch!');

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Uh-oh!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Uh-oh!');
      });

      it('should have the specified error status', () => {
        expect(subject.statusCode).to.be.equal(404);
      });

      it('should have the specified error as its cause', () => {
        expect(subject.cause).to.be.equal(cause);
        expect(subject.cause).to.be.instanceof(TypeError);
        expect(subject.cause.message).to.be.equal('Oops!');
      });

      it('should have the list of specified details', () => {
        expect(subject.details).to.be.deep.equal(['Ouch!']);
      });

    });

    describe('#constructor(String, int, String, Error)', () => {

      const cause = new TypeError('Oops!');
      const subject = new ApplicationError('Uh-oh!', 404, 'Ouch!', cause);

      it('should be a throwable error', () => {
        expect(() => {
          throw subject;
        }).to.throw(/Uh-oh!/);
      });

      it('should have the specified message', () => {
        expect(subject.message).to.be.equal('Uh-oh!');
      });

      it('should have the specified error status', () => {
        expect(subject.statusCode).to.be.equal(404);
      });

      it('should not have another error as its cause', () => {
        expect(subject.cause).to.be.undefined;
      });

      it('should have the list of specified details, including errors', () => {
        expect(subject.details).to.be.deep.equal(['Ouch!', cause]);
      });

    });

  });

});
