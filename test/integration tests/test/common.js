/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

global.should = require('should'); 
global.request = require('supertest');
global.async = require('async'); 
global.expect = require("chai").expect;
global.url = 'http://localhost:3002/';
global.responseHandler = require('json-silo/lib/responsehandler');
global.fs = require('fs');
global.testUser = {
  "email" : "email@test.com",
  "password": "pass"
};
global.testData = {
  "jsonLD" : {
    "@id": "index.html",
    "@type": "schema:Person",
    "schema:name": "Joseph Stalin",
    "schema:image": "http://communits/stalin.jpg",
    "schema:owns": [
      {
        "@id": "productdb:iphone5.html",
        "@type": "schema:Product",
        "schema:productID": "mac:01:23:45:67:89:ab"
      }
    ]
  }
};
global.publicFields = { "public" : ['@type','schema:image'] };