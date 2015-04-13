describe("LOGIN", function() {

  it("shouldn't create a user because of invalid email", function(done) {

    var wrongUser = {
      "email" : "randomEmail",
      "password"  : "pass"
    }

  	request(url)
      .put('login')
      .send(wrongUser)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });

  });

  it("should create a user", function(done) {

    request(url)
      .put('login')
      .send(testUser)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.OK);
        expect(res.body.data.token).not.equal(null);
        done();
      });
  });

  it("shouldn't login the user because one already exists", function(done) {

    var otherUser = {
      "email" : "other@email.com",
      "password"  : "pass"
    }

    request(url)
      .put('login')
      .send(otherUser)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.UNAUTHORIZED);
        done();
      });
  });

  it("shouldn't login the user because the password is wrong", function(done) {

    var wrongPass = {
      "email" : testUser.email,
      "password" : 'wrongPass'
    }

    request(url)
      .put('login')
      .send(wrongPass)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.UNAUTHORIZED);
        done();
      });
  });
});