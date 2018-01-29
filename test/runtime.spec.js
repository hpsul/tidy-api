/*
 * COPYRIGHT
 */

import { expect } from 'chai';
import findUp from 'find-up';
import { PackageMetadata } from '../src/runtime';

/* eslint-disable import/no-dynamic-require */
const PACKAGE_JSON = require(findUp.sync('package.json'));
/* eslint-enable import/no-dynamic-require */

describe('runtime', () => {

  describe('PackageMetadata', () => {

    describe('#constructor()', () => {

      const subject = new PackageMetadata();

      it('should read the default values from `package.json`', () => {
        expect(subject.name).to.equal(PACKAGE_JSON.name);
        expect(subject.version).to.equal(PACKAGE_JSON.version);
        expect(subject.description).to.equal(PACKAGE_JSON.description);
        expect(subject.author).to.equal(PACKAGE_JSON.author);
      });

      it('should fall back to `name` when `service` is undefined', () => {
        expect(subject.service).to.equal(PACKAGE_JSON.name);
      });

    });

    describe('#constructor(Object)', () => {

      const source = { name: 'test-api', service: 'test' };
      const subject = new PackageMetadata(source);

      it('should read the specified values from source Object', () => {
        expect(subject.name).to.equal(source.name);
        expect(subject.service).to.equal(source.service);
      });

      it('should read the missing values from `package.json`', () => {
        expect(subject.version).to.equal(PACKAGE_JSON.version);
        expect(subject.description).to.equal(PACKAGE_JSON.description);
        expect(subject.author).to.equal(PACKAGE_JSON.author);
      });

    });

    describe('#constructor(Map)', () => {

      const source = new Map([['name', 'test-api'], ['service', 'test']]);
      const subject = new PackageMetadata(source);

      it('should read the specified values from source Map', () => {
        expect(subject.name).to.equal(source.get('name'));
        expect(subject.service).to.equal(source.get('service'));
      });

      it('should read the missing values from `package.json`', () => {
        expect(subject.version).to.equal(PACKAGE_JSON.version);
        expect(subject.description).to.equal(PACKAGE_JSON.description);
        expect(subject.author).to.equal(PACKAGE_JSON.author);
      });

    });


  });

});
