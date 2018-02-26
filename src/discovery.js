/*
 * COPYRIGHT
 */

import Promise from 'bluebird';
import request from 'request-promise';
import { Resolver } from 'dns';
import { format } from 'util';
import { SystemError } from './errors';
import { Log } from './logging';
import ErrorMessages from './errors.messages.json';

class Discovery {

  ready() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  lookup() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  register() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  /* eslint-disable no-use-before-define */
  static find(type, url = '') {
    switch (type) {
      case Consul:
        return new Consul(url);
      default:
        return new DNS(url.split(','));
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

  ready() {
    return Promise.resolve(true);
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
  }

}

class Consul extends Discovery {

  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
  }

  ready() {
    return request(`${this.endpoint}/v1/status/leader`)
      .then(() => true).catch(() => false);
  }

  lookup(name, port) {
    if (port) {
      Log.warn('The specified port for the service will be ignored.', {
        name, port,
      });
    }
    return request({
      method: 'GET',
      uri: `${this.endpoint}/v1/catalog/service/${name}`,
      json: true,
    }).then((nodes) => {
      if (nodes.length === 0) {
        throw new SystemError(format(ErrorMessages.Discovery.notFound, name));
      }
      return nodes.map(node => ({
        address: node.ServiceAddress, port: node.ServicePort,
      }));
    });
  }

  register(name, address, port, { id, tags, check } = {}) {
    return request({
      method: 'POST',
      uri: `${this.endpoint}/v1/agent/service/register`,
      body: {
        ID: id || name,
        Name: name,
        Address: address,
        Port: port,
        Tags: tags,
        EnableTagOverride: false,
        Check: check,
      },
      json: true,
    }).then(() => true);
  }

}

export {
  Discovery,
  DNS,
  Consul,
};
