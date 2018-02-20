/*
 * COPYRIGHT
 */

import { expect } from 'chai';
import findUp from 'find-up';
import { PackageMetadata, RuntimeContext } from '../src/runtime';

/* eslint-disable import/no-dynamic-require */
const PACKAGE_JSON = require(findUp.sync('package.json'));
/* eslint-enable import/no-dynamic-require */

describe('runtime', () => {

  describe('PackageMetadata', () => {

    describe('#constructor()', () => {

      const subject = new PackageMetadata();

      it('should read the default values from `package.json`', () => {
        expect(subject.name).to.be.equal(PACKAGE_JSON.name);
        expect(subject.version).to.be.equal(PACKAGE_JSON.version);
        expect(subject.description).to.be.equal(PACKAGE_JSON.description);
        expect(subject.author).to.be.equal(PACKAGE_JSON.author);
      });

      it('should fall back to `name` when `service` is undefined', () => {
        expect(subject.service).to.be.equal(PACKAGE_JSON.name);
      });

    });

    describe('#constructor(Object)', () => {

      const source = { name: 'test-api', service: 'test' };
      const subject = new PackageMetadata(source);

      it('should read the specified values from source Object', () => {
        expect(subject.name).to.be.equal(source.name);
        expect(subject.service).to.be.equal(source.service);
      });

      it('should read the missing values from `package.json`', () => {
        expect(subject.version).to.be.equal(PACKAGE_JSON.version);
        expect(subject.description).to.be.equal(PACKAGE_JSON.description);
        expect(subject.author).to.be.equal(PACKAGE_JSON.author);
      });

    });

    describe('#constructor(Map)', () => {

      const source = new Map([['name', 'test-api'], ['service', 'test']]);
      const subject = new PackageMetadata(source);

      it('should read the specified values from source Map', () => {
        expect(subject.name).to.be.equal(source.get('name'));
        expect(subject.service).to.be.equal(source.get('service'));
      });

      it('should read the missing values from `package.json`', () => {
        expect(subject.version).to.be.equal(PACKAGE_JSON.version);
        expect(subject.description).to.be.equal(PACKAGE_JSON.description);
        expect(subject.author).to.be.equal(PACKAGE_JSON.author);
      });

    });

    it('should have a default singleton', () => {
      expect(PackageMetadata.default()).to.be.equal(PackageMetadata.default());
      expect(PackageMetadata.default()).to.be.not.equal(new PackageMetadata());
    });

  });
  describe('RuntimeContext', () => {

    describe('#constructor()', () => {

      const subject = new RuntimeContext();

      // Remove unknown command arguments to
      // avoid intermittent failures!
      /* eslint-disable no-underscore-dangle */
      delete subject.options.unknown;
      delete subject.options._unknown;
      /* eslint-enable no-underscore-dangle */

      it('should use the default PackageMetadata', () => {
        expect(subject.metadata).to.be.deep.equal(new PackageMetadata());
      });

      it('should have valid options with values from the default definition', () => {
        expect(subject.hasValidOptions).to.be.true;
        expect(subject.printVersion).to.be.false;
        expect(subject.printUsage).to.be.false;
        expect(subject.options).to.be.deep.equal({
          environment: 'development',
          log: 'info',
          address: '0.0.0.0',
          port: 8080,
          discovery: 'auto',
        });
      });

      it('should use the default values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal(subject.metadata.service);
        expect(subject.environment).to.be.equal(process.env.NODE_ENV || 'development');
      });

      it('should make title and usage from the default metadata', () => {
        expect(subject.title).to.be.equal(`${PACKAGE_JSON.name} - v${PACKAGE_JSON.version}`);
        expect(subject.usage).to.be.not.empty;
      });

    });

    describe('#constructor(PackageMetadata)', () => {

      const source = {
        name: 'test',
        version: '1.0',
        description: 'This is a test!',
      };
      const metadata = new PackageMetadata(source);
      const subject = new RuntimeContext(metadata);

      // Remove unknown command arguments to
      // avoid intermittent failures!
      if (subject.options.unknown) {
        delete subject.options.unknown;
      }

      it('should use the specified PackageMetadata', () => {
        expect(subject.metadata).to.be.equal(metadata);
      });

      it('should make title and usage from the provided metadata', () => {
        expect(subject.title).to.be.equal(`${source.name} - v${source.version}`);
        expect(subject.usage).to.contain('This is a test!');
      });

    });

    describe('#constructor(undefined, undefined, shortArgs)', () => {

      const shortArgs = [
        '-h', '-v', '-n', 'test', '-e', 'test', '-l', 'debug', '-a', '127.0.0.1',
        '-p', '8000', '--discovery', 'consul', '--discovery-url', 'http://consul:8500',
      ];
      const subject = new RuntimeContext(undefined, undefined, shortArgs);

      it('should have valid options with values from the specified command line', () => {
        expect(subject.hasValidOptions).to.be.true;
        expect(subject.printVersion).to.be.true;
        expect(subject.printUsage).to.be.true;
        expect(subject.options).to.be.deep.equal({
          help: true,
          version: true,
          name: 'test',
          environment: 'test',
          log: 'debug',
          address: '127.0.0.1',
          port: 8000,
          discovery: 'consul',
          discoveryUrl: 'http://consul:8500',
        });
      });

      it('should use the specified values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal('test');
        expect(subject.environment).to.be.equal('test');
      });

    });

    describe('#constructor(undefined, undefined, longArgs)', () => {

      const longArgs = [
        '--help', '--version', '--name', 'test', '--environment', 'test',
        '--log', 'debug', '--address', '127.0.0.1', '--port', '8000',
        '--discovery', 'consul', '--discovery-url', 'http://consul:8500',
      ];
      const subject = new RuntimeContext(undefined, undefined, longArgs);

      it('should have valid options with values from the specified command line', () => {
        expect(subject.hasValidOptions).to.be.true;
        expect(subject.printVersion).to.be.true;
        expect(subject.printUsage).to.be.true;
        expect(subject.options).to.be.deep.equal({
          help: true,
          version: true,
          name: 'test',
          environment: 'test',
          log: 'debug',
          address: '127.0.0.1',
          port: 8000,
          discovery: 'consul',
          discoveryUrl: 'http://consul:8500',
        });
      });

      it('should use the specified values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal('test');
        expect(subject.environment).to.be.equal('test');
      });

    });

    describe('#constructor(undefined, undefined, invalidArgs)', () => {

      const invalidArgs = ['-p', '8000', '-p', 'foo'];
      const subject = new RuntimeContext(undefined, undefined, invalidArgs);

      it('should indicate that the options are not valid', () => {
        expect(subject.hasValidOptions).to.be.false;
      });

      it('should use the default values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal(subject.metadata.service);
        expect(subject.environment).to.be.equal(process.env.NODE_ENV || 'development');
      });

    });

    describe('#constructor(undefined, invalidDefinitions)', () => {

      const invalidDefinitions = [{}];
      const subject = new RuntimeContext(undefined, invalidDefinitions);

      it('should indicate that the options are not valid', () => {
        expect(subject.hasValidOptions).to.be.false;
      });

      it('should use the default values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal(subject.metadata.service);
        expect(subject.environment).to.be.equal(process.env.NODE_ENV || 'development');
      });

    });

    describe('#constructor(undefined, customDefinitions, customArgs)', () => {

      const customDefinitions = [
        { name: 'foo', alias: 'f' },
        { name: 'bar', alias: 'b' },
      ];
      const customArgs = ['-f', 'FOO', '-b', 'BAR'];
      const subject = new RuntimeContext(undefined, customDefinitions, customArgs);

      it('should hav valid options', () => {
        expect(subject.hasValidOptions).to.be.true;
        expect(subject.printVersion).to.be.false;
        expect(subject.printUsage).to.be.false;
      });

      it('should have the specified options', () => {
        expect(subject.options.foo).to.be.equal('FOO');
        expect(subject.options.bar).to.be.equal('BAR');
      });


      it('should use the default values for `name` and `environment`', () => {
        expect(subject.name).to.be.equal(subject.metadata.service);
        expect(subject.environment).to.be.equal(process.env.NODE_ENV || 'development');
      });

      it('should make title and usage from the available options', () => {
        expect(subject.title).to.be.equal(`${PACKAGE_JSON.name} - v${PACKAGE_JSON.version}`);
        expect(subject.usage).to.be.not.empty;
      });

    });

    it('should have a default singleton', () => {
      expect(RuntimeContext.default()).to.be.equal(RuntimeContext.default());
      expect(RuntimeContext.default()).to.be.not.equal(new RuntimeContext());
    });

  });

});
