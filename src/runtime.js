/*
 * COPYRIGHT
 */

import { sync as findUp } from 'find-up';
import generateCommandLineUsage from 'command-line-usage';
import parseCommandLine from 'command-line-args';

const METADATA_ATTRIBUTE_NAMES = [
  'name', 'version', 'description', 'author', 'service'];

function readDefaultMetadata() {
  /* eslint-disable import/no-dynamic-require */
  /* eslint-disable global-require */
  return new Map(Object
    .entries(require(findUp('package.json')))
    .filter(entry => METADATA_ATTRIBUTE_NAMES.includes(entry[0])));
  /* eslint-enable import/no-dynamic-require */
  /* eslint-enable global-require */
}

function readDefaultOptionDefinitions() {
  /* eslint-disable global-require */
  const result = require('./runtime.options.json');
  /* eslint-enable global-require */
  result.forEach((item) => {
    /* eslint-disable no-eval */
    item.type = item.type ? eval(item.type) : String;
    /* eslint-enable no-eval */
  });
  return result;
}

const DEFAULT_METADATA = readDefaultMetadata();
const DEFAULT_DEFINITIONS = readDefaultOptionDefinitions();

const PRODUCTION_ENVIRONMENT = 'production';
const DEVELOPMENT_ENVIRONMENT = 'development';
const DEFAULT_ENVIRONMENT = DEVELOPMENT_ENVIRONMENT;

function setMetadataAttribute(source, target, name) {
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

let defaultMetadata;
let defaultContext;

class PackageMetadata {

  constructor(source = undefined) {
    this.attributes = new Map();
    METADATA_ATTRIBUTE_NAMES.forEach((name) => {
      setMetadataAttribute(source, this.attributes, name);
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

  static default() {
    if (!defaultMetadata) {
      defaultMetadata = new PackageMetadata();
    }
    return defaultMetadata;
  }

}

class RuntimeContext {

  constructor(
    metadata = PackageMetadata.default(),
    definitions = DEFAULT_DEFINITIONS,
    args = process.argv,
  ) {
    this.metadata = metadata;
    try {
      this.options = parseCommandLine(definitions, {
        argv: args,
        camelCase: true,
        partial: true,
      });
      this.hasValidOptions = true;
    } catch (e) {
      this.options = {};
      this.hasValidOptions = false;
    }
    this.name = this.options.name || process.env.SERVICE_NAME || this.metadata.service;
    this.environment = this.options.environment || process.env.NODE_ENV || DEFAULT_ENVIRONMENT;
  }

  get title() {
    if (!this.cachedTitle) {
      this.cachedTitle = `${this.metadata.name} - v${this.metadata.version}`;
    }
    return this.cachedTitle;
  }

  get usage() {
    if (!this.cachedUsage) {
      this.cachedUsage = generateCommandLineUsage([
        {
          header: this.title,
          content: this.metadata.description || '',
        }, {
          header: 'Options',
          optionList: this.options,
        },
      ]);
    }
    return this.cachedUsage;
  }

  get printVersion() {
    return this.options.version || false;
  }

  get printUsage() {
    return this.options.help || !this.hasValidOptions || false;
  }

  get debugMode() {
    return this.environment !== PRODUCTION_ENVIRONMENT;
  }

  static default() {
    if (!defaultContext) {
      defaultContext = new RuntimeContext();
    }
    return defaultContext;
  }

}

export {
  PackageMetadata,
  RuntimeContext,
};
