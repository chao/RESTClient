var assert = require('assert');
var expect = require('chai').expect;
var fs = require('fs');
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
      expect(version).to.be.equal("v001");
    });
  });
});