describe("GET PUBLIC INFO", function() {

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

      // Set the @type & image as public
      function(callback) {
        request(url)
          .put('public')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send(publicFields)

          .end(function(err, res) {
            if (err) {
              throw err;
            }
            callback();
            done();
          });
      }
    ]);
  });

  it("should get the public fields", function(done) {

    request(url)
      .get('public')
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