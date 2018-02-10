/*
 * COPYRIGHT
 */

import safeColors from 'colors/safe';
import { expect } from 'chai';
import { WritableStream } from 'memory-streams';
import { LogStream } from '../src/logger';

describe('logger', () => {

  describe('LogStream', () => {

    const entryOne = {
      v: '1',
      level: 20,
      name: 'test',
      hostname: 'localhost',
      pid: 1,
      time: new Date(),
      msg: 'this is a test',
    };

    const entryTwo = Object.assign({
      src: {
        file: 'test.js',
        line: 1,
        func: 'foo',
      },
      err: new Error(),
    }, entryOne);

    const newLogFormat = '%{date}:%{process}:%{host}:%{name}:%{level}:%{message}:%{source}';
    const entryOneDefaultOutput = `${entryOne.time.toISOString()} ${entryOne.name} [${entryOne.pid}@${entryOne.hostname}] -    DEBUG  ${entryOne.msg}`;
    const entryTwoDefaultOutput = `${entryTwo.time.toISOString()} ${entryTwo.name} [${entryTwo.pid}@${entryTwo.hostname}] -    DEBUG ${entryTwo.src.func}(${entryTwo.src.file}:${entryTwo.src.line}) ${entryTwo.msg}\n${entryTwo.err.stack}`;
    const entryOneDefaultColoredOutput = safeColors.cyan(entryOneDefaultOutput);
    const entryTwoDefaultColoredOutput = safeColors.cyan(entryTwoDefaultOutput);
    const entryOneNonDefaultOutput = `${entryOne.time.toISOString()}:${entryOne.pid}:${entryOne.hostname}:${entryOne.name}:DEBUG:${entryOne.msg}:`;
    const entryTwoNonDefaultOutput = `${entryTwo.time.toISOString()}:${entryTwo.pid}:${entryTwo.hostname}:${entryTwo.name}:DEBUG:${entryTwo.msg}:${entryTwo.src.func}(${entryTwo.src.file}:${entryTwo.src.line})\n${entryTwo.err.stack}`;

    describe('#constructor()', () => {

      describe('#write(minEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory });

        it('should write the colorized entry in debug mode with default format', () => {
          subject.write(entryOne);
          expect(memory.toString()).to.eq(`${entryOneDefaultColoredOutput}\n`);
        });

      });

      describe('#write(fullEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory });

        it('should write the colorized entry in debug mode with default format', () => {
          subject.write(entryTwo);
          expect(memory.toString()).to.eq(`${entryTwoDefaultColoredOutput}\n`);
        });

      });

    });

    describe('#constructor({ forceColor: false })', () => {

      describe('#write(minEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(entryOne);
          expect(memory.toString()).to.eq(`${entryOneDefaultOutput}\n`);
        });

      });

      describe('#write(fullEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, useColor: false });

        it('should write a plain text entry in debug mode with default format', () => {
          subject.write(entryTwo);
          expect(memory.toString()).to.eq(`${entryTwoDefaultOutput}\n`);
        });

      });

    });

    describe('#constructor({ debug: false })', () => {

      describe('#write(minEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(entryOne);
          expect(memory.toString()).to.eq(`${JSON.stringify(entryOne)}\n`);
        });

      });

      describe('#write(fullEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, debug: false });

        it('should write a JSON entry', () => {
          subject.write(entryTwo);
          expect(memory.toString()).to.eq(`${JSON.stringify(entryTwo)}\n`);
        });

      });

    });

    describe('#constructor({ format: nonDefaultFormat, useColor: false })', () => {

      describe('#write(minEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: newLogFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(entryOne);
          expect(memory.toString()).to.eq(`${entryOneNonDefaultOutput}\n`);
        });

      });

      describe('#write(fullEntry)', () => {

        const memory = new WritableStream();
        const subject = new LogStream({ out: memory, format: newLogFormat, useColor: false });

        it('should write a plain text entry in debug mode with non-default format', () => {
          subject.write(entryTwo);
          expect(memory.toString()).to.eq(`${entryTwoNonDefaultOutput}\n`);
        });

      });

    });


  });

});
