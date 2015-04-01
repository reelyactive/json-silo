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
  })
});