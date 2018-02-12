/*
 * COPYRIGHT
 */

import safeColors from 'colors/safe';
import { expect } from 'chai';
import { WritableStream } from 'memory-streams';
import { RuntimeContext } from '../src/runtime';
import { LogStream, LoggerFactory } from '../src/logger';

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
    const baseEntryDefaultOutput = `${baseEntry.time.toISOString()} ${baseEntry.name} [${baseEntry.pid}@${baseEntry.hostname}] -    DEBUG  ${baseEntry.msg}`;
    const fullEntryDefaultOutput = `${fullEntry.time.toISOString()} ${fullEntry.name} [${fullEntry.pid}@${fullEntry.hostname}] -    DEBUG ${fullEntry.src.func}(${fullEntry.src.file}:${fullEntry.src.line}) ${fullEntry.msg}\n${fullEntry.err.stack}`;
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
          expect(memory.toString()).to.eq(`${baseEntryDefaultColoredOutput}\n`);
        });

      });

      describe('.options = { useColor: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.eq(`${baseEntryDefaultOutput}\n`);
        });
      });

      describe('.options = { debug: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.eq(`${JSON.stringify(baseEntry)}\n`);
        });

      });

      describe('.options = { format: nonDefaultFormat }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: nonDefaultFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(baseEntry);
          expect(memory.toString()).to.eq(`${baseEntryNonDefaultOutput}\n`);
        });

      });

    });

    describe('#write(fullEntry)', () => {

      describe('.options = {}', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory });

        it('should write the colorized entry in debug mode with default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.eq(`${fullEntryDefaultColoredOutput}\n`);
        });

      });

      describe('.options = { useColor: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.eq(`${fullEntryDefaultOutput}\n`);
        });

      });

      describe('.options = { debug: false }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.eq(`${JSON.stringify(fullEntry)}\n`);
        });

      });

      describe('.options = { format: nonDefaultFormat }', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: nonDefaultFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(fullEntry);
          expect(memory.toString()).to.eq(`${fullEntryNonDefaultOutput}\n`);
        });

      });

    });

  });

  describe('LoggerFactory', () => {

    describe('#constructor()', () => {

      const subject = new LoggerFactory();

      it('should use the default runtime context', () => {
        expect(subject.context).to.eql(new RuntimeContext());
      });

    });

  });

});
