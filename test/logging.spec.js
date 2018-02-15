/*
 * COPYRIGHT
 */

import bunyan from 'bunyan';
import safeColors from 'colors/safe';
import { expect } from 'chai';
import { WritableStream } from 'memory-streams';
import { RuntimeContext } from '../src/runtime';
import { Log, LogStream, LoggerFactory } from '../src/logging';

describe('logger', () => {

  describe('LogStream', () => {

    const baseEntry = {
      v: '1',
      level: 20,
      name: 'test',
      hostname: 'localhost',
      pid: 1,
      time: new Date(),
      msg: 'this is a test',
    };

    const fullEntry = Object.assign({
      src: {
        file: 'test.js',
        line: 1,
        func: 'foo',
      },
      err: new Error(),
    }, baseEntry);

    const nonDefaultFormat = '%{date}:%{process}:%{host}:%{name}:%{level}:%{message}:%{source}';
    const baseEntryDefaultOutput = `${baseEntry.time.toISOString()} ${baseEntry.name} [${baseEntry.pid}@${baseEntry.hostname}]  - DEBUG ${baseEntry.msg}`;
    const fullEntryDefaultOutput = `${fullEntry.time.toISOString()} ${fullEntry.name} [${fullEntry.pid}@${fullEntry.hostname}] ${fullEntry.src.func}(${fullEntry.src.file}:${fullEntry.src.line}) - DEBUG ${fullEntry.msg}\n${fullEntry.err.stack}`;
    const baseEntryDefaultColoredOutput = safeColors.cyan(baseEntryDefaultOutput);
    const fullEntryDefaultColoredOutput = safeColors.cyan(fullEntryDefaultOutput);
    const baseEntryNonDefaultOutput = `${baseEntry.time.toISOString()}:${baseEntry.pid}:${baseEntry.hostname}:${baseEntry.name}:DEBUG:${baseEntry.msg}:`;
    const fullEntryNonDefaultOutput = `${fullEntry.time.toISOString()}:${fullEntry.pid}:${fullEntry.hostname}:${fullEntry.name}:DEBUG:${fullEntry.msg}:${fullEntry.src.func}(${fullEntry.src.file}:${fullEntry.src.line})\n${fullEntry.err.stack}`;

    describe('#write(baseEntry)', () => {

      describe('.options = {}', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory });

        it('should write the colorized entry in debug mode with default format', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.be.equal(`${baseEntryDefaultColoredOutput}\n`);
        });

      });

      describe('.options = { useColor: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.be.equal(`${baseEntryDefaultOutput}\n`);
        });
      });

      describe('.options = { debug: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.be.equal(`${JSON.stringify(baseEntry)}\n`);
        });

      });

      describe('.options = { format: nonDefaultFormat }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: nonDefaultFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.be.equal(`${baseEntryNonDefaultOutput}\n`);
        });

      });

    });

    describe('#write(fullEntry)', () => {

      describe('.options = {}', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory });

        it('should write the colorized entry in debug mode with default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.be.equal(`${fullEntryDefaultColoredOutput}\n`);
        });

      });

      describe('.options = { useColor: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.be.equal(`${fullEntryDefaultOutput}\n`);
        });

      });

      describe('.options = { debug: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.be.equal(`${JSON.stringify(fullEntry)}\n`);
        });

      });

      describe('.options = { format: nonDefaultFormat }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: nonDefaultFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.be.equal(`${fullEntryNonDefaultOutput}\n`);
        });

      });

    });

  });

  describe('LoggerFactory', () => {

    it('should have a default singleton', () => {
      expect(LoggerFactory.default()).to.be.equal(LoggerFactory.default());
      expect(LoggerFactory.default()).to.be.not.equal(new LoggerFactory());
    });

    describe('#constructor()', () => {

      const subject = new LoggerFactory();

      it('should use the default runtime context', () => {
        expect(subject.context).to.be.equal(RuntimeContext.default());
      });

    });

    describe('#newLogger()', () => {

      it('should use the default runtime context', () => {
        const subject = LoggerFactory.default().newLogger();
        expect(subject.fields.name).to.be.equal(RuntimeContext.default().name);
        expect(subject.level()).to.be.equal(bunyan
          .levelFromName[RuntimeContext.default().options.log]);
      });

      it('should use the debug LogStream output', () => {
        const subject = LoggerFactory.default().newLogger();
        expect(subject.streams).to.have.lengthOf(1);
        expect(subject.streams[0].type).to.be.equal('raw');
        expect(subject.streams[0].stream).to.be.instanceof(LogStream);
      });

      it('should use standard error in production mode', () => {
        const subject = new LoggerFactory(new RuntimeContext(undefined, undefined, ['-e', 'production']))
          .newLogger();
        expect(subject.streams).to.have.lengthOf(1);
        expect(subject.streams[0].type).to.be.equal('stream');
        expect(subject.streams[0].stream).to.be.equal(process.stderr);
      });

    });

    describe('#newLogger(name, level, options)', () => {

      const name = 'test';
      const level = 'trace';
      const format = 'test format';
      const subject = LoggerFactory.default().newLogger(name, level, { format });

      it('should use the specified name and level', () => {
        expect(subject.fields.name).to.be.equal(name);
        expect(subject.level()).to.be.equal(bunyan.levelFromName[level]);
      });

      it('should use the debug LogStream output with specified options', () => {
        expect(subject.streams).to.have.lengthOf(1);
        expect(subject.streams[0].type).to.be.equal('raw');
        expect(subject.streams[0].stream).to.be.instanceof(LogStream);
        expect(subject.streams[0].stream.format).to.be.equal(format);
      });

    });

  });

  describe('Log', () => {

    const name = 'test';
    const level = 'trace';
    const memory = new WritableStream();
    const logStream = new LogStream({
      debug: true,
      useColor: false,
      out: memory,
    });

    class CustomLoggerFactory extends LoggerFactory {
      /* eslint-disable class-methods-use-this */
      newLogger() {
        return bunyan.createLogger({
          name,
          level,
          streams: [{
            stream: logStream,
            type: 'raw',
          }],
        });
      }
      /* eslint-enable class-methods-use-this */
    }

    const newFactory = new CustomLoggerFactory();

    it('should have `trace` method', () => {
      expect(Log.trace).to.be.instanceof(Function);
    });

    it('should have `debug` method', () => {
      expect(Log.debug).to.be.instanceof(Function);
    });

    it('should have `info` method', () => {
      expect(Log.info).to.be.instanceof(Function);
    });

    it('should have `warn` method', () => {
      expect(Log.warn).to.be.instanceof(Function);
    });

    it('should have `error` method', () => {
      expect(Log.error).to.be.instanceof(Function);
    });

    it('should have `fatal` method', () => {
      expect(Log.fatal).to.be.instanceof(Function);
    });

    it('should have `logger` property', () => {
      expect(Log).to.have.property('logger');
      /* eslint-disable no-unused-expressions */
      expect(Log.logger).to.be.not.null;
      /* eslint-enable no-unused-expressions */
    });

    it('should have `factory` property', () => {
      expect(Log).to.have.property('factory');
      /* eslint-disable no-unused-expressions */
      expect(Log.factory).to.be.not.null;
      /* eslint-enable no-unused-expressions */
    });

    it('should replace the default factory with the custom one', () => {
      const oldFactory = Log.factory;
      Log.factory = newFactory;
      try {
        expect(Log.factory).to.be.equal(newFactory);
        expect(Log.logger.streams).to.have.lengthOf(1);
        expect(Log.logger.streams[0].stream).to.be.equal(logStream);
      } finally {
        Log.factory = oldFactory;
      }
    });

    it('should use the logger created by the custom factory', () => {
      const oldFactory = Log.factory;
      Log.factory = newFactory;
      try {
        /* eslint-disable no-unused-expressions */
        expect(memory.toString()).to.be.empty;
        /* eslint-enable no-unused-expressions */
        Log.trace('Hello, Trace!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(1);
        expect(memory.toString()).to.match(/TRACE Hello, Trace!/);
        Log.debug('Hello, Debug!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(2);
        expect(memory.toString()).to.match(/DEBUG Hello, Debug!/);
        Log.info('Hello, Info!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(3);
        expect(memory.toString()).to.match(/ INFO Hello, Info!/);
        Log.warn('Hello, Warn!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(4);
        expect(memory.toString()).to.match(/ WARN Hello, Warn!/);
        Log.error('Hello, Error!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(5);
        expect(memory.toString()).to.match(/ERROR Hello, Error!/);
        Log.fatal('Hello, Fatal!');
        expect(memory.toString().trim().split('\n')).to.have.lengthOf(6);
        expect(memory.toString()).to.match(/FATAL Hello, Fatal!/);
      } finally {
        Log.factory = oldFactory;
      }
    });

  });

});
