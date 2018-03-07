/*
 * COPYRIGHT
 */

import Promise from 'bluebird';
import request from 'request-promise';
import { Resolver } from 'dns';
import { format } from 'util';
import { SystemError } from './errors';
import { Log } from './logging';
import { RuntimeContext } from './runtime';
import ErrorMessages from './errors.messages.json';

class Discovery {

  ready() {
    return Promise.resolve(true);
  }

  wait(timeout = 2000, attempt = 10) {
    let delay = 2;
    let attempted = 1;
    const self = this;
    const started = process.hrtime();

    function doWait(ready) {
      return ready.then((status) => {
        if (status) {
          return true;
        }
        /* eslint-disable no-plusplus */
        attempted++;
        /* eslint-enable no-plusplus */
        const diff = process.hrtime(started);
        /* eslint-disable no-mixed-operators */
        const elapsed = (diff[1] + diff[0] * 1e+9) / 1e+6;
        /* eslint-enable no-mixed-operators */
        if (!status) {
          delay *= 2;
        }
        Log.trace('Increasing the delay for the next readiness test', {
          elapsed, delay, attempted,
        });
        if (attempted > attempt || elapsed > timeout) {
          throw new SystemError(ErrorMessages.Discovery.notReady);
        } else {
          return doWait(self.ready().delay(delay));
        }
      });
    }

    Log.debug('Waiting for discovery service to be ready', {
      timeout,
    });
    return doWait(this.ready());
  }

  lookup() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  register() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  /* eslint-disable no-use-before-define */
  static find(context = RuntimeContext.default()) {
    const { discoveryType, discoveryUrl } = context.options;
    switch (discoveryType) {
      case 'consul':
        return new Consul(discoveryUrl);
      default:
        return new DNS(discoveryUrl ? discoveryUrl.split(',') : []);
    }
  }
  /* eslint-enable no-use-before-define */
}

class DNS extends Discovery {

  constructor(servers = []) {
    super();
    this.resolver = new Resolver();
    if (servers.length > 0) {
      this.resolver.setServers(servers.filter(s => s.trim().length > 0));
    }
  }

  lookup(name, port) {
    const resolverToUse = this.resolver;
    return new Promise((resolve, reject) => {
      const records = ['SRV', 'A', 'CNAME', 'AAAA'];
      function doResolve() {
        const record = records.shift();
        Log.trace('Resolving DNS record', {
          record, name,
        });
        resolverToUse.resolve(name, record, (error, result) => {
          if (error) {
            if (records.length === 0) {
              Log.debug('DNS record not found', {
                record, name,
              }, error);
              reject(new SystemError(format(ErrorMessages.Discovery.notFound, name)));
            } else {
              Log.trace('DNS record not found. Continue the search', {
                record, name, error,
              });
              doResolve();
            }
          } else {
            Log.debug('DNS record found', {
              record, name, result,
            });
            switch (record) {
              case 'SRV':
                resolve(result.map(entry => ({ address: entry.name, port: entry.port })));
                break;
              default:
                resolve(result.map(entry => ({ address: entry, port })));
            }
          }
        });
      }
      doResolve();
    });
  }

  register(name, address, options = {}) {
    Log.warn('Can not register service. Operation is not supported.', {
      name, address, options,
    });
    return Promise.resolve(true);
  }

}

class Consul extends Discovery {

  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
  }

  askConsul(resource, method = 'GET', body) {
    const uri = `${this.endpoint}/v1/${resource}`;
    Log.trace('Sending request to Consul', {
      method, uri, body,
    });
    return request({
      method, uri, body, json: true,
    });
  }

  ready() {
    Log.debug('Checking readiness of the Consul agent', {
      endpoint: this.endpoint,
    });
    return this.askConsul('status/leader').then(() => true).catch(() => false);
  }

  lookup(name, port) {
    if (port) {
      Log.warn('The specified port for the service will be ignored.', {
        name, port,
      });
    }
    Log.debug('Looking for the service in Consul catalog', {
      name,
    });
    return this.askConsul(`catalog/service/${name}`).then((nodes) => {
      Log.debug('List of service nodes is available', {
        length: nodes.length,
      });
      if (nodes.length === 0) {
        throw new SystemError(format(ErrorMessages.Discovery.notFound, name));
      }
      return nodes.map(node => ({
        address: node.ServiceAddress, port: node.ServicePort,
      }));
    });
  }

  register(name, address, port, { id, tags, check } = {}) {
    Log.debug('Registering service in Consul catalog', {
      name, address, port,
    });
    return this.askConsul('agent/service/register', 'POST', {
      ID: id || name,
      Name: name,
      Address: address,
      Port: port,
      Tags: tags,
      EnableTagOverride: false,
      Check: check,
    }).then(() => true);
  }

}

export {
  Discovery,
  DNS,
  Consul,
};
