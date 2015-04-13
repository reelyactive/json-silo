describe("PUBLIC FIELDS", function() {

  before(function(done) {

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

      // Save the dummy data
      function(callback) {
        request(url)
          .put('data')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send(testData)

          .end(function(err, res) {
            if (err) {
              throw err;
            }
            done();
            callback();
          });
      }
    ]);
  });

  it("should not set public fields because no data was sent", function(done) {

    request(url)
      .put('')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should not set public fields because the data wasn't sent as an array", function(done) {

    request(url)
      .put('')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send({ "public" : "notAnArray"})

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.BADREQUEST);
        done();
      });
  });

  it("should set the public fields", function(done) {

    request(url)
      .put('')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(publicFields)

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        var publicArray = res.body.data.public;

        expect(publicArray).to.include('@type');
        expect(publicArray).to.include('schema:image');
        done();
      });
  });

  it("should get the public fields", function(done) {

    request(url)
      .get('')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        var publicInfo = res.body.data;

        expect(publicInfo.public["@type"]).to.equal(testData.jsonLD["@type"]);
        expect(publicInfo.public["schema:image"]).to.equal(testData.jsonLD["schema:image"]);
        expect(publicInfo.private).to.include('schema:owns');
        done();
      });
  });
});