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

  describe("encryptPass", function() {

    var password = 'pass';
    var encrypted = '';

    it("should encrypt the password", function(done){

    	silomanager.encryptPass(password, function(err, hash) {

    		if (err)
    			return console.log(err);

        encrypted = hash;
    		expect(hash).not.equal(null);
        done();
    	});
    });

    it("should compare an encrypted to an unencrypted password & make sure they are the same", function(done){

      silomanager.validPass(password, encrypted, function(err, isMatch) {

        if (err)
          return console.log(err);

        expect(isMatch).to.equal(true);
        done();
      });
    });

    it("should compare an encrypted to an unencrypted password & make sure they are NOT the same", function(done){

      silomanager.validPass('reandom pass', encrypted, function(err, isMatch) {

        if (err)
          return console.log(err);

        expect(isMatch).to.equal(false);
        done();
      });
    });
  });

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

  describe("keyGen", function() {

    this.timeout(20000);
    var email = "george@ra.com";
    var pass = "pass";

    it("should create a public / private key pair", function(done){

     silomanager.keygen(email, pass, function(err) {

        expect(err).not.equal(null);
        done();
      });
    });
  });

  describe("encrypt / descrypt", function() {

    var data = {
      "@context": {
        "schema": "http://schema.org/",
        "dbpedia": "http://dbpedia.org/page/",
        "productdb": "http://productdb.org/"
      },
      "@graph": [
        {
          "@id": "me",
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
      ]
    }

    var encodedData = '';
    var pass = 'pass';

    it("should encrypt the data", function(){

      fs.readFile('public_key.asc', 'ascii', function (err, pubkey) {
        if (err)
          console.log(err);
        else {
          
          silomanager.encryptData(pubkey, data, function(err, encodedMsg) {
            encodedData = encodedMsg;
            expect(err).not.equal(null);
            expect(encodedMsg).not.equal(undefined);
          });
        }
      });
    });

    it("should decrypt the data", function(done){
      silomanager.decryptData(pass, encodedData, function(err, decryptedData) {
        if (err)
          console.log(err);
        else {
          var unencrypted = JSON.stringify(data);
          var decrypted = JSON.stringify(decryptedData);

          expect(unencrypted).to.equal(decrypted);
          done();
        }
      });
    });

    it("shouldn't decrypt the data because the passphrase is wrong", function(done){
      var passNOK = 'passNOK';

      silomanager.decryptData(passNOK, encodedData, function(err, decryptedData) {
        
          expect(err.name).to.equal('Illegal Argument');
          expect(decryptedData).to.equal(null);
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
      fs.unlinkSync('private_key.asc');
      fs.unlinkSync('public_key.asc');

    });
  });
})