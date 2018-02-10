/*
 * COPYRIGHT
 */

import bunyan from 'bunyan';
import safeColors from 'colors/safe';
import path from 'path';
import { vsprintf } from 'sprintf';
import { Writable } from 'stream';

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

const Log = {};

export {
  Log,
  LogStream,
};
