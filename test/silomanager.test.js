var SiloManager = require('../lib/silomanager');
var silomanager = new SiloManager(); 
var fs          = require('fs');
var async       = require('async');


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
        expect(err._meta.statusCode).to.equal(400);
        done();
      });

    });

    it("should create a new user", function(done){
      
      silomanager.login(emailOK, pass, function(err, token) {
        expect(token).not.equal(null);
         expect(err).to.equal(null);
         done();
      });

    });
  });

   describe("login", function() {

    var email = "george@ra.com";
    var passOK = "pass";
    var passNOK = "wrongPass";

    it("it should not log in the user because of invalid password", function(done){

      silomanager.login(email, passNOK, function(err, token) {
        expect(token).to.equal(null);
        expect(err._meta.statusCode).to.equal(401);
        done();
      });

    });

     it("it should log in the user", function(done){

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

  describe("encrypt", function() {

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

      fs.readFile('security/public_key.asc', 'ascii', function (err, pubkey) {
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
        
          expect(err._meta.statusCode).to.equal(401);
          expect(decryptedData).to.equal(null);
          done();
      });
    });
  });

  describe("save", function() {

    it("should save a set of User data", function(done) {

      var data = {
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
      
      silomanager.save(data, function(err, jsonld) {

        expect(jsonld["@type"]).to.equal(data["@type"]);
        expect(jsonld["@id"]).to.equal(data["@id"]);
        expect(jsonld["schema:name"]).to.equal(data["schema:name"]);
        expect(jsonld["schema:image"]).to.equal(data["schema:image"]);
        expect(jsonld["schema:owns"]["@id"]).to.equal(data["schema:owns"][0]["@id"]);
        expect(jsonld["schema:owns"]["@type"]).to.equal(data["schema:owns"][0]["@type"]);
        expect(jsonld["schema:owns"]["schema:productID"]).to.equal(data["schema:owns"][0]["schema:productID"]);
        done();
      });
    });
  });

  describe("reset", function() {

    it("should remove the files created", function(){

      fs.unlinkSync('silo.db');
      fs.unlinkSync('security/private_key.asc');
      fs.unlinkSync('security/public_key.asc');

    });
  });
})