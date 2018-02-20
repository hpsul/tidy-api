/*
 * COPYRIGHT
 */

import Promise from 'bluebird';
import { Resolver } from 'dns';
import { format } from 'util';
import { SystemError } from './errors';
import { Log } from './logging';
import ErrorMessages from './errors.messages.json';

class Discovery {

  lookup() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

  register() {
    throw new SystemError(ErrorMessages.notImplemented);
  }

}

class DNS extends Discovery {

  constructor(servers = []) {
    super();
    this.resolver = new Resolver();
    if (servers.length > 0) {
      this.resolver.setServers(servers);
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
                resolve(result.map(entry => ({ name: entry.name, port: entry.port })));
                break;
              default:
                resolve(result.map(entry => ({ name: entry, port })));
            }
          }
        });
      }
      doResolve();
    });
  }

  register(names, address, options = {}) {
    Log.warn('Can not register service. Operation is not supported.', {
      names, address, options,
    });
  }

}

export {
  Discovery,
  DNS,
};
