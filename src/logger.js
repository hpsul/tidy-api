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
  if (color) {
    const operator = safeColors[color];
    if (operator) {
      return operator(message);
    }
  }
  return message;
}

function compile(pattern) {
  let result = pattern;
  pattern.match(/(%{(-[\d])?[\w:]+})/g).forEach((element) => {
    const parts = element.match(/%{(\d:)?(\w+)(:\w+)?}/);
    const padding = parts[1] ? Number.parseInt(parts[1], 10) : '';
    const index = FORMAT_ELEMENTS.indexOf(parts[2]);
    /*
     * field formatting is not supported.
     */
    // const format = parts[3];
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

function sourceString(source) {
  if (!source) {
    return '';
  }
  let result = pathTail(source.file, 2)
    + (source.line ? `:${source.line}` : '');
  if (source.func) {
    result = `${source.func}(${result})`;
  }
  return result;
}

function errorString(error) {
  if (!error) {
    return '';
  }
  return error.stack ? error.stack : error.toString();
}

function asArguments(entry) {
  return [
    entry.time instanceof Date ? entry.time.toISOString() : entry.time.toString(), // date
    entry.name, // name
    entry.pid, // process
    entry.hostname, // host
    sourceString(entry.src), // source
    bunyan.nameFromLevel[entry.level].toUpperCase(), // level
    entry.msg, // message
  ];
}

class LogStream extends Writable {

  constructor({
    format = DEFAULT_FORMAT,
    debug = true,
    out = process.stderr,
    forceColor = true,
    colors = DEFAULT_COLORS,
  }) {
    super({ objectMode: true });
    this.format = compile(format);
    this.debug = debug;
    this.out = out;
    this.forceColor = forceColor;
    this.colors = colors;
    safeColors.enabled = this.forceColor;
  }

  stringify(entry) {
    let result = vsprintf(this.format, asArguments(entry));
    if (entry.err) {
      result = `${result}\n${errorString(entry.err)}`;
    }
    return colorize(result, this.forceColor ? this.colors[entry.level] : undefined);
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
