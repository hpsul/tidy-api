/*
 * COPYRIGHT
 */

import findUp from 'find-up';
import generateCommandLineUsage from 'command-line-usage';
import parseCommandLineArgs from 'command-line-args';

const ATTRIBUTE_NAMES = [
  'name', 'version', 'description', 'author', 'service'];

function readDefaultMetadata() {
  /* eslint-disable import/no-dynamic-require */
  /* eslint-disable global-require */
  return new Map(Object
    .entries(require(findUp.sync('package.json')))
    .filter(entry => ATTRIBUTE_NAMES.includes(entry[0])));
  /* eslint-enable import/no-dynamic-require */
  /* eslint-enable global-require */
}

function readDefaultRuntimeOptions() {
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
const DEFAULT_OPTIONS = readDefaultRuntimeOptions();
const DEFAULT_ENVIRONMENT = 'development';

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

  constructor({ packageMetadata, optionsDefinition, commandArgs }) {
    this.metadata = packageMetadata || new PackageMetadata();
    this.options = parseCommandLineArgs(optionsDefinition || DEFAULT_OPTIONS, {
      argv: commandArgs,
    });
    this.environment = process.env.NODE_ENV || this.options.environment || DEFAULT_ENVIRONMENT;
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

  printVersion() {
    if (this.title) {
      /* eslint-disable no-console */
      console.error(this.title);
      /* eslint-enable no-console */
    }
  }

  printUsage() {
    if (this.usage) {
      /* eslint-disable no-console */
      console.error(this.usage);
      /* eslint-enable no-console */
    }
  }

}

export {
  PackageMetadata,
  Runtime,
};
