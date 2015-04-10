var SiloManager = require('../lib/silomanager');
var response    = require("../lib/responsehandler");
var fs          = require('fs');
var async       = require('async');

var silomanager = new SiloManager(); 

var userData = {
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
};

var userToken;


describe("SiloManager", function() {

  describe("validEmail", function() {

    it("should fail because the emails provided are not valid", function(){

      var emails = [
        'aaaa',
        'sss@sdf',
        'sss@sdf@g.s'
      ]

      emails.forEach(function(email) {
        var isValidEmail = silomanager.validEmail(email);
        expect(isValidEmail).to.equal(false);
      })      

    });

    it("should pass because the email provided is valid", function(){

      var isValidEmail = silomanager.validEmail('geo@r.com');

      expect(isValidEmail).to.equal(true);
    });
  });

  describe("signUp", function() {

    var emailOK = "george@ra.com";
    var emailNOK = "george@ra";
    var pass = "pass";

    it("should not create a new user because of invalid email input", function(done){

      silomanager.login(emailNOK, pass, function(err, result) {
        expect(result).to.equal(null);
        expect(err.http_code).to.equal(response.STATUS.BADREQUEST);
        done();
      });

    });

    it("should create a new user", function(done){
      
      silomanager.login(emailOK, pass, function(err, token) {
        expect(token).not.equal(null);
         expect(err).to.equal(null);

         // Save the user token for use with other tests
         userToken = token;
         done();
      });

    });
  });

   describe("login", function() {

    var email = "george@ra.com";
    var passOK = "pass";
    var passNOK = "wrongPass";

    it("should not log in the user because of invalid password", function(done){

      silomanager.login(email, passNOK, function(err, token) {
        expect(token).to.equal(null);
        expect(err.http_code).to.equal(response.STATUS.UNAUTHORIZED);
        done();
      });

    });

     it("should log in the user", function(done){

      silomanager.login(email, passOK, function(err, token) {
        expect(token).not.equal(null);
        done();
      });

    });
  });

  describe("save", function() {

    it("should save a set of User data", function(done) {
      
      silomanager.save(userData, function(err, jsonld) {

        expect(jsonld["@type"]).to.equal(userData["@type"]);
        expect(jsonld["@id"]).to.equal(userData["@id"]);
        expect(jsonld["schema:name"]).to.equal(userData["schema:name"]);
        expect(jsonld["schema:image"]).to.equal(userData["schema:image"]);
        expect(jsonld["schema:owns"]["@id"]).to.equal(userData["schema:owns"][0]["@id"]);
        expect(jsonld["schema:owns"]["@type"]).to.equal(userData["schema:owns"][0]["@type"]);
        expect(jsonld["schema:owns"]["schema:productID"]).to.equal(userData["schema:owns"][0]["schema:productID"]);
        done();
      });
    });
  });

  describe("findAll", function() {

    it("should return all user data", function(done) {
      
      silomanager.findAll(function(err, jsonld) {

        expect(jsonld["@type"]).to.equal(userData["@type"]);
        expect(jsonld["@id"]).to.equal(userData["@id"]);
        expect(jsonld["schema:name"]).to.equal(userData["schema:name"]);
        expect(jsonld["schema:image"]).to.equal(userData["schema:image"]);
        expect(jsonld["schema:owns"]["@id"]).to.equal(userData["schema:owns"][0]["@id"]);
        expect(jsonld["schema:owns"]["@type"]).to.equal(userData["schema:owns"][0]["@type"]);
        expect(jsonld["schema:owns"]["schema:productID"]).to.equal(userData["schema:owns"][0]["schema:productID"]);
        done();
      });
    });
  });

  describe("find", function() {

    it("should return part of the user data", function(done) {

      var fields = ["schema:name", "schema:owns"];
      
      silomanager.find(fields, function(err, jsonld) {

        expect(jsonld["schema:name"]).to.equal(userData["schema:name"]);
        expect(jsonld["schema:owns"]["@id"]).to.equal(userData["schema:owns"][0]["@id"]);
        expect(jsonld["schema:owns"]["@type"]).to.equal(userData["schema:owns"][0]["@type"]);
        expect(jsonld["schema:owns"]["schema:productID"]).to.equal(userData["schema:owns"][0]["schema:productID"]);
        done();
      });
    });
  });

  describe("setPublic", function() {

    it("should return an illegal argument error", function(done) {

      var fields = ["random"];
      
      silomanager.setPublic(fields, function(err, publicData) {

        expect(publicData.public).to.include("@context");
        done();
      });
    });

    it("should make the schema:owns field public", function(done) {

      var fields = ["schema:owns", "random"];
      
      silomanager.setPublic(fields, function(err, publicData) {

        expect(publicData.public).to.include("schema:owns");
        expect(publicData.public).not.include(userData["random"]);
        done();
      });
    });
  });

  describe("getPublic", function() {

    it("should return the fields that are public & private", function(done) {
      
      silomanager.getPublic(function(err, fieldInfo) {

        expect(fieldInfo.public["schema:owns"]["@id"]).to.equal(userData["schema:owns"][0]["@id"]);
        expect(fieldInfo.public["schema:owns"]["@type"]).to.equal(userData["schema:owns"][0]["@type"]);
        expect(fieldInfo.public["schema:owns"]["schema:productID"]).to.equal(userData["schema:owns"][0]["schema:productID"]);
        expect(fieldInfo.private).to.include("schema:name");
        done();
      });
    });
  });

  describe("authenticate", function() {

    it("should not authenticate the User because of invalid token", function(done) {
      
      var tokenNOK = 'randomToken';

      silomanager.authenticate(tokenNOK, function(err, user) {
        expect(err).not.equal(null);
        expect(user).to.equal(null);
        done();
      });
    });

    it("should authenticate the User", function(done) {

      var bearerHeader = 'Bearer ' + userToken;

      silomanager.authenticate(bearerHeader, function(err, user) {
        expect(err).to.equal(null);
        expect(user.type).to.equal('user');
        done();
      });
    });
  });

  describe("reset", function() {

    it("should remove the files created", function(){

      fs.unlinkSync('silo.db');
    });
  });
})