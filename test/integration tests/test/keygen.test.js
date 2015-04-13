/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */
 
describe("KEYGEN", function() {

  before(function(done) {

    // Login a user
    request(url)
      .put('login')
      .send(testUser)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        testUser.token = res.body.data.token;
        done();
      });
  });

  it("should not create the keys because of an invalid token", function(done) {

    request(url)
      .put('keygen')
      .set('Authorization', 'Bearer invalid')
      .send( { "password" : testUser.password } )

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should not create the keys because of an invalid password", function(done) {

    request(url)
      .put('keygen')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send( { "password" : "invalid" } )

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.UNAUTHORIZED);
        done();
      });
  });

  it("should create a new public / private key pair", function(done) {

    this.timeout(20000);

    request(url)
      .put('keygen')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send( { "password" : testUser.password } )

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(fs.existsSync("private_key.asc")).to.equal(true);
        expect(fs.existsSync("public_key.asc")).to.equal(true);
        done();
      });
  });
});