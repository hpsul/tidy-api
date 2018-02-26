/*
 * COPYRIGHT
 */

import Docker from 'dockerode';
import chaiAsPromised from 'chai-as-promised';
import request from 'request-promise';
import { expect, use } from 'chai';
import { Discovery, Consul, DNS } from '../src/discovery';

use(chaiAsPromised);

describe('discovery', () => {

  const docker = new Docker();

  describe('DNS', () => {

    const subject = new DNS();

    it('should be ready', () =>
      expect(subject.ready()).to.eventually.be.true);

    it('should resolve A record without port', () =>
      expect(subject.lookup('localhost')).to.eventually.be.deep.equal([
        { address: '127.0.0.1', port: undefined },
      ]));

    it('should resolve A record with the specified port', () =>
      expect(subject.lookup('localhost', 80)).to.eventually.be.deep.equal([
        { address: '127.0.0.1', port: 80 },
      ]));

    it('should resolve SRV record', () =>
      expect(subject.lookup('_http._tcp.mxtoolbox.com')).to.eventually.be.deep.equal([
        { address: 'mxtoolbox.com', port: 80 },
      ]));

    it('should throw error when no record found', () => {
      // expect(subject.lookup('_unresolved_').timeout(1000)).to.eventually.be.rejected;
    });

  });

  describe('Consul', () => {

    let fixture;
    let subject;

    before((done) => {
      docker
        .createContainer({
          Image: 'consul',
          HostConfig: {
            AutoRemove: true,
          },
        })
        .then((container) => {
          fixture = container;
          return fixture.start();
        })
        .then(() => fixture.inspect())
        .then((data) => {
          subject = new Consul(`http://${data.NetworkSettings.IPAddress}:8500`);
        })
        .then(() => subject.ready())
        .then(() => subject.register('test', '172.16.0.1', 8080))
        .then(() => done());
    });

    after((done) => {
      fixture.stop().then(() => done());
    });

    it('should not be ready when Consul is not available', () =>
      expect(new Consul('http://localhost:8500').ready()).to.eventually.be.false);

    it('should be ready when Consul is available', () =>
      expect(subject.ready()).to.eventually.be.true);

    it('should lookup the registered service', () =>
      expect(subject.ready().then(() => subject.lookup('test'))).to.eventually.be.deep.equal([
        { address: '172.16.0.1', port: 8080 },
      ]));

    it('should fail when looks up an unregistered service', () =>
      expect(subject.ready().then(() => subject.lookup('_none_'))).to.eventually.be
        .rejectedWith(/Service not found/));

    it('should register a service with the specified options', () => {
      let nodes;
      let isChecked;
      return expect(subject
        .ready()
        .then(() => subject.register('foo', '172.16.1.1', 8888, {
          id: 'foo-uuid',
          tags: ['test', 'example'],
          check: {
            DeregisterCriticalServiceAfter: '90m',
            HTTP: 'http://172.16.1.1:8888/ping',
            Interval: '10s',
            TTL: '15s',
          },
        }))
        .then(() => request({
          method: 'GET',
          uri: `${subject.endpoint}/v1/catalog/service/foo`,
          json: true,
        }))
        .then((result) => {
          nodes = result.map(node => ({
            id: node.ServiceID,
            name: node.ServiceName,
            address: node.ServiceAddress,
            port: node.ServicePort,
            tags: node.ServiceTags,
          }));
          return request({
            method: 'GET',
            uri: `${subject.endpoint}/v1/agent/checks`,
            json: true,
          });
        })
        .then((result) => {
          isChecked = !!result['service:foo-uuid'];
        })
        .then(() => ({ nodes, isChecked })))
        .to.eventually.be.deep.equal({
          nodes: [{
            id: 'foo-uuid',
            name: 'foo',
            address: '172.16.1.1',
            port: 8888,
            tags: ['test', 'example'],
          }],
          isChecked: true,
        });
    });

  });

  describe('Discovery#find', () => {

    it('should return an instance of the specified class', () => {
      expect(Discovery.find()).to.be.instanceof(DNS);
      expect(Discovery.find(Consul)).to.be.instanceof(Consul);
    });

    it('should use the specified options in the instance', () => {
      expect(Discovery.find(DNS, '4.2.2.4,8.8.8.8').resolver.getServers())
        .to.be.deep.equal(['4.2.2.4', '8.8.8.8']);
      expect(Discovery.find(Consul, 'http://localhost:8500').endpoint)
        .to.be.equal('http://localhost:8500');
    });

  });

});
