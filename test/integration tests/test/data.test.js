/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */
 
describe("SAVE & GET DATA", function() {

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

  it("should save the user data", function(done) {

    request(url)
      .put('data')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send(testData)

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
  });

  it("should get the unencrypted data", function(done) {

    // Login a user
    request(url)
      .get('data')
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
  });
  
});