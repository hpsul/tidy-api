/*
 * COPYRIGHT
 */

import chaiAsPromised from 'chai-as-promised';
import { expect, use } from 'chai';
import { DNS } from '../src/discovery';

use(chaiAsPromised);

describe('discovery', () => {

  describe('DNS', () => {

    const subject = new DNS();

    it('should resolve A record without port', () =>
      expect(subject.lookup('localhost')).to.eventually.be.deep.equal([
        { name: '127.0.0.1', port: undefined },
      ]));

    it('should resolve A record with the specified port', () =>
      expect(subject.lookup('localhost', 80)).to.eventually.be.deep.equal([
        { name: '127.0.0.1', port: 80 },
      ]));

    it('should resolve SRV record', () =>
      expect(subject.lookup('_http._tcp.mxtoolbox.com')).to.eventually.be.deep.equal([
        { name: 'mxtoolbox.com', port: 80 },
      ]));

    /* eslint-disable func-names */
    it('should throw error when no record found', function () {
      this.timeout(10000);
      return expect(subject.lookup('unresolved')).to.eventually.be.rejectedWith(/Service not found/);
    });
    /* eslint-enable func-names */

  });

});
