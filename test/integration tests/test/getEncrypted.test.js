var pubKey;
var reelyActiveToken;
var encryptedData;

describe("GET ENCRYPTED INFO", function() {

  before(function(done) {

    this.timeout(30000);

    async.series([

      // Login the User
      function(callback) {

        request(url)
          .put('login')
          .send(testUser)

          .end(function(err, res) {
            if (err) {
              throw err;
            }

            testUser.token = res.body.data.token;
            callback();
          });
      },

      // Register reelyActive
      function(callback) {

        request(url)
          .put('reelyActive')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send()

          .end(function(err, res) {
            if (err) {
              throw err;
            }

            reelyActiveToken = res.body.data.token;
            callback();
          });
      },

      // Save some dummy data
      function(callback) {
        request(url)
          .put('me')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send(testData)

          .end(function(err, res) {
            if (err) {
              throw err;
            }
            callback();
          });
      },

      // Generate a private / public pair
      function(callback) {
        request(url)
          .put('keygen')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send( { "password" : testUser.password } )

          .end(function(err, res) {
            if (err) {
              throw err;
            }
            callback();
          });
      },

      // Read the public Key
      function(callback) {
        fs.readFile('public_key.asc', 'ascii', function (err, key) {
          if (err)
            console.log(err);
          else {
           pubKey = key;
           done();
          }
        });
      },
    ]);
  });

  it("should return a BADREQUEST because no key was provided", function(done) {

    var requestData = {
      "fields" : ['@type']
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should return a BADREQUEST because no fields were provided", function(done) {

    var requestData = {
      "pubkey" : pubKey
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should return a BADREQUEST because the key was malformed", function(done) {

    var requestData = {
      "pubkey" : "malformedKey"
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should return a BADREQUEST because the key was malformed", function(done) {

    var requestData = {
      "pubkey" : "malformedKey"
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should encrypt the data (user request)", function(done) {

    var requestData = {
      "pubkey" : pubKey,
      "fields" : ['@type', '@id']
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.OK);
        expect(res.body.data).not.equal(null);
        expect(res.body.data).not.equal(undefined);
        encryptedData = res.body.data;
        done();
      });
  });

  it("should encrypt the data (reelyActive request)", function(done) {

    var requestData = {
      "pubkey" : pubKey,
      "fields" : ['@type', '@id']
    };

    request(url)
      .get('encrypted')
      .set('Authorization', 'Bearer ' + reelyActiveToken)
      .send(requestData)

      .end(function(err, res) {
        if (err) {
          throw err;
        }
        
        expect(res.status).to.equal(response.STATUS.OK);
        expect(res.body.data).not.equal(null);
        expect(res.body.data).not.equal(undefined);
        done();
      });
  });
});