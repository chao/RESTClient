var assert = require('assert');
var expect = require('chai').expect;
var fs = require('fs');
var Base64 = require('js-base64').Base64;
var schema = require('../src/scripts/cores/schema');
var _ = require('lodash');

const restclient = {
  "v1": "test/fixtures/1.json",
  "v2": "test/fixtures/2.json",
  "v31": "test/fixtures/31.json",
};

describe('Request migration', function () {
  describe('From RESTClient v1 favorite requests', function () {
    var request = fs.readFileSync(restclient['v1'], 'utf-8');
    request = JSON.parse(request);
    it('should detected as version 1', function () {
      var version = schema._version(request);
      expect(version).to.be.equal("v1001");
    });

    it('update to latest version', function(){
      var result = schema._v1001(request);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at');
      expect(result['method']).to.be.equal(request['requestMethod']);
      expect(result['url']).to.be.equal(request['requestUrl']);
      expect(result['body']).to.be.equal(request['requestBody']);
    });
  });

  describe('From RESTClient v2 favorite requests', function () {
    var requests = fs.readFileSync(restclient['v2'], 'utf-8');
    requests = JSON.parse(requests);
    it('should detected as version 2', function () {
      var version = schema._version(requests);
      expect(version).to.be.equal("v2001");
    });

    it('upgrade a basic authentication request', function () {
      var request = requests['basic'];
      var result = schema._v2001(request);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at', 'authentication');
      expect(result['method']).to.be.equal(request['method']);
      expect(result['url']).to.be.equal(request['url']);
      expect(result['body']).to.be.equal(request['body']);
      expect(result).to.nested.include({'authentication.mode': 'basic'});
      expect(result).to.have.nested.property('authentication.data.username', 'user');
      expect(result).to.have.nested.property('authentication.data.password', '');
    });

    it('upgrade a oauth 1.0 authentication request', function () {
      var request = requests['oauth'];
      var result = schema._v2001(request, ['v2001']);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at', 'authentication');
      expect(result['method']).to.be.equal(request['method']);
      expect(result['url']).to.be.equal(request['url']);
      expect(result['body']).to.be.equal(request['body']);
      expect(result).to.nested.include({ 'authentication.mode': 'oauth10' });
      expect(result).to.nested.include({'authentication.data.parameter_transmission': 'header'});
      expect(result).to.have.nested.property('authentication.data.consumer_key');
      expect(result['tags']).to.be.an('array').that.includes("v2001");
      expect(result['headers']).to.be.an('array').that.is.empty;
    });

    it('upgrade a oauth 2.0 authentication request', function () {
      var request = requests['oauth2'];
      var result = schema._v2001(request, ['v2001']);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at', 'authentication');
      expect(result['method']).to.be.equal(request['method']);
      expect(result['url']).to.be.equal(request['url']);
      expect(result['body']).to.be.equal(request['body']);
      expect(result).to.nested.include({ 'authentication.mode': 'oauth20' });
      expect(result).to.nested.include({ 'authentication.data.result.token_type': 'Bearer' });
      expect(result['headers']).to.be.an('array').that.is.empty;
    });

  });

  describe('From RESTClient v3 favorite requests', function () {
    var payload = fs.readFileSync(restclient['v31'], 'utf-8');
    payload = JSON.parse(payload);
    it('should detected as version 3', function () {
      var version = schema._version(payload);
      expect(version).to.be.equal("v3001");
    });
    var requests = payload.data;
    it('upgrade a oauth 1.0 authentication request', function () {
      var request = requests['3oauth'];
      var result = schema._v3001(request, ['v3001']);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at', 'authentication');
      expect(result['method']).to.be.equal(request['method']);
      expect(result['url']).to.be.equal(request['url']);
      expect(result['body']).to.be.equal(request['body']);
      expect(result).to.nested.include({ 'authentication.mode': 'oauth10' });
      expect(result).to.nested.include({ 'authentication.data.parameter_transmission': 'header' });
      expect(result).to.have.nested.property('authentication.data.consumer_key');
      expect(result['tags']).to.be.an('array').that.includes("Twitter");
    });

    it('upgrade a oauth 2.0 authentication request', function () {
      var request = requests['3oauth2'];
      var result = schema._v3001(request, ['v3001']);
      expect(result).to.include.keys('method', 'url', 'body', 'tags', 'created_at', 'updated_at', 'authentication');
      expect(result['method']).to.be.equal(request['method']);
      expect(result['url']).to.be.equal(request['url']);
      expect(result['body']).to.be.equal(request['body']);
      expect(result).to.nested.include({ 'authentication.mode': 'oauth20' });
      expect(result).to.nested.include({ 'authentication.data.result.token_type': 'Bearer' });
      expect(result['tags']).to.be.an('array').that.includes("Github");
      expect(result['tags']).to.be.an('array').that.includes("v3001");
    });


  });
});