var EncryptionManager = require('../lib/encryptionmanager');
var response    		  = require("../lib/responsehandler");
var fs                = require('fs');
var async             = require('async');

var encryptionmanager = new EncryptionManager(); 

describe("EncryptionManager", function() {

  describe("encryptPass", function() {

    var password = 'pass';
    var encrypted = '';

    it("should encrypt the password", function(done){

      encryptionmanager.encryptPass(password, function(err, hash) {

        if (err)
          return console.log(err);

        encrypted = hash;
        expect(hash).not.equal(null);
        done();
      });
    });

    it("should compare an encrypted to an unencrypted password & make sure they are the same", function(done){

      encryptionmanager.validPass(password, encrypted, function(err, isMatch) {

        if (err)
          return console.log(err);

        expect(isMatch).to.equal(true);
        done();
      });
    });

    it("should compare an encrypted to an unencrypted password & make sure they are NOT the same", function(done){

      encryptionmanager.validPass('reandom pass', encrypted, function(err, isMatch) {

        if (err)
          return console.log(err);

        expect(isMatch).to.equal(false);
        done();
      });
    });
  });

  describe("keyGen", function() {

    this.timeout(20000);
    var email = "george@ra.com";
    var pass = "pass";

    it("should create a public / private key pair", function(done){

     encryptionmanager.keygen(email, pass, function(err) {

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
          
          encryptionmanager.encryptData(pubkey, data, function(err, encodedMsg) {
            encodedData = encodedMsg;
            expect(err).not.equal(null);
            expect(encodedMsg).not.equal(undefined);
            console.log(encodedMsg);
          });
        }
      });
    });

    it("should decrypt the data", function(done){
      encryptionmanager.decryptData(pass, encodedData, function(err, decryptedData) {
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

      encryptionmanager.decryptData(passNOK, encodedData, function(err, decryptedData) {
        
          expect(err.name).to.equal('Illegal Argument');
          expect(decryptedData).to.equal(null);
          done();
      });
    });
  });

  after(function() {
    fs.unlinkSync('private_key.asc');
    fs.unlinkSync('public_key.asc');
  });
});

