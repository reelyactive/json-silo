describe("GET UNENCRYPTED DATA", function() {

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
          .post('me')
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

  it("should get the unencrypted data", function(done) {

    // Login a user
    request(url)
      .get('me')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        var savedData = res.body.data;
        expect(savedData["@type"]).to.equal(testData.jsonLD["@type"]);
        expect(savedData["@id"]).to.equal(testData.jsonLD["@id"]);
        expect(savedData["schema:name"]).to.equal(testData.jsonLD["schema:name"]);
        expect(savedData["schema:image"]).to.equal(testData.jsonLD["schema:image"]);
        expect(savedData["schema:owns"]["@id"]).to.equal(testData.jsonLD["schema:owns"][0]["@id"]);
        expect(savedData["schema:owns"]["@type"]).to.equal(testData.jsonLD["schema:owns"][0]["@type"]);
        expect(savedData["schema:owns"]["schema:productID"]).to.equal(testData.jsonLD["schema:owns"][0]["schema:productID"]);
        done();
      });
  })
});