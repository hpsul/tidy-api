/*
 * COPYRIGHT
 */

import findUp from 'find-up';

/* eslint-disable import/no-dynamic-require */
const PACKAGE_JSON = require(findUp.sync('package.json'));
/* eslint-enable import/no-dynamic-require */
const ATTRIBUTE_NAMES = [
  'name', 'version', 'description', 'author', 'service'];

function readDefaultMetadata() {
  return new Map(Object.entries(PACKAGE_JSON)
    .filter(entry => ATTRIBUTE_NAMES.includes(entry[0])));
}

const DEFAULT_METADATA = readDefaultMetadata();

function setAttribute(source, target, name) {
  let value;
  if (source) {
    value = source instanceof Map ? source.get(name) : source[name];
  }
  if (!value) {
    value = DEFAULT_METADATA.get(name);
  }
  if (value) {
    target.set(name, value);
  }
}

class PackageMetadata {

  constructor(source = undefined) {
    this.attributes = new Map();
    ATTRIBUTE_NAMES.forEach((name) => {
      setAttribute(source, this.attributes, name);
    });
  }

  get name() {
    return this.attributes.get('name');
  }

  get version() {
    return this.attributes.get('version');
  }

  get description() {
    return this.attributes.get('description');
  }

  get author() {
    return this.attributes.get('author');
  }

  get service() {
    return this.attributes.get('service') || this.attributes.get('name');
  }

}

class Runtime {

}

export {
  PackageMetadata,
  Runtime,
};
