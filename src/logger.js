/*
 * COPYRIGHT
 */

import bunyan from 'bunyan';
import safeColors from 'colors/safe';
import path from 'path';
import { vsprintf } from 'sprintf';
import { Writable } from 'stream';
import { RuntimeContext } from './runtime';

const FORMAT_ELEMENTS = ['date', 'name', 'process', 'host', 'source', 'level', 'message'];
const DEFAULT_FORMAT = '%{date} %{name} [%{process}@%{host}] - %{8:level} %{source} %{message}';
const DEFAULT_COLORS = {
  10: 'grey', // trace
  20: 'cyan', // debug
  30: 'green', // info
  40: 'yellow', // warn
  50: 'red', // error
  60: 'magenta', // fatal
};
const DEFAULT_LOG_LEVEL = 'info';

function colorize(message, color) {
  const operator = safeColors[color];
  if (operator) {
    return operator(message);
  }
  return message;
}

function compile(pattern) {
  let result = pattern;
  pattern.match(/(%{(-[\d])?[\w:]+})/g).forEach((element) => {
    const parts = element.match(/%{(\d:)?(\w+)(:\w+)?}/);
    const padding = parts[1] ? Number.parseInt(parts[1], 10) : '';
    const index = FORMAT_ELEMENTS.indexOf(parts[2]);
    if (index > -1) {
      result = result.replace(element, `%${index + 1}$${padding}s`);
    }
  });
  return result;
}

function pathTail(filePath, tail) {
  if (!filePath) {
    return '';
  }
  let elements = filePath.trim().split(path.sep);
  if (elements.length > tail) {
    elements = elements.slice(elements.length - tail);
  }
  return elements.join('/');
}

const DEFAULT_STRINGIFIER = {
  src: (src) => {
    if (!src) {
      return '';
    }
    let result = pathTail(src.file, 2)
      + (src.line ? `:${src.line}` : '');
    if (src.func) {
      result = `${src.func}(${result})`;
    }
    return result;
  },
  err: (err) => {
    if (!err) {
      return '';
    }
    return err.stack ? err.stack : err.toString();
  },
};

safeColors.enabled = true;

class LogStream extends Writable {

  constructor({
    format = DEFAULT_FORMAT,
    debug = true,
    out = process.stderr,
    useColor = true,
    colors = DEFAULT_COLORS,
    stringifiers = DEFAULT_STRINGIFIER,
  }) {
    super({ objectMode: true });
    this.format = compile(format);
    this.debug = debug;
    this.out = out;
    this.useColor = useColor;
    this.colors = colors;
    this.stringifiers = stringifiers;
  }

  stringify(entry) {
    let result = vsprintf(this.format, [
      entry.time instanceof Date ? entry.time.toISOString() : entry.time.toString(), // date
      entry.name, // name
      entry.pid, // process
      entry.hostname, // host
      this.stringifiers.src ? this.stringifiers.src(entry.src) : '', // source
      bunyan.nameFromLevel[entry.level].toUpperCase(), // level
      entry.msg, // message
    ]);
    if (entry.err) {
      result = `${result}\n${this.stringifiers.err ? this.stringifiers.err(entry.err) : entry.err.toString()}`;
    }
    return this.useColor ? colorize(result, this.colors[entry.level]) : result;
  }

  _write(entry, encoding, done) {
    let buffer;
    if (this.debug) {
      buffer = this.stringify(entry);
    } else {
      buffer = JSON.stringify(entry);
    }
    if (typeof buffer !== 'undefined') {
      this.out.write(buffer);
      this.out.write('\n');
    }
    return done();
  }

}

let defaultFactory;
let defaultLogger;

class LoggerFactory {

  constructor(runtimeContext) {
    this.context = runtimeContext || new RuntimeContext();
  }

  newLogger(name, level, options = {}) {
    const stream = this.context.debugMode ? {
      stream: new LogStream(Object.assign({
        debug: this.context.debugMode,
        useColor: this.context.debugMode,
      }, options)),
      type: 'raw',
    } : {
      stream: process.stderr,
      type: 'stream',
    };
    return bunyan.createLogger({ name, level, streams: [stream] });
  }

  rootLogger(name, level, options = {}) {
    if (!this.root) {
      const nameToUse = name || this.context.name;
      const levelToUse = level || this.context.options.log || DEFAULT_LOG_LEVEL;
      this.root = this.newLogger(nameToUse, bunyan.levelFromName[levelToUse], options);
    }
    return this.root;
  }

}

defaultFactory = new LoggerFactory();
defaultLogger = defaultFactory.rootLogger();

class Log {

  static get logger() {
    return defaultLogger;
  }

  static set logger(logger) {
    defaultLogger = logger;
    if (!defaultLogger) {
      defaultLogger = defaultFactory.rootLogger();
    }
  }

  static get factory() {
    return defaultFactory;
  }

  static set factory(factory) {
    defaultFactory = factory;
    if (!defaultFactory) {
      defaultFactory = new LoggerFactory();
    }
    defaultLogger = defaultFactory.rootLogger();
  }

  static trace() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.trace(arguments);
    /* eslint-enable prefer-rest-params */
  }

  static debug() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.debug(arguments);
    /* eslint-enable prefer-rest-params */
  }

  static info() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.info(arguments);
    /* eslint-enable prefer-rest-params */
  }

  static warn() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.warn(arguments);
    /* eslint-enable prefer-rest-params */
  }

  static error() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.warn(arguments);
    /* eslint-enable prefer-rest-params */
  }

  static fatal() {
    /* eslint-disable prefer-rest-params */
    defaultLogger.warn(arguments);
    /* eslint-enable prefer-rest-params */
  }

}

export {
  Log,
  LogStream,
  LoggerFactory,
};
