/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var reelyActiveToken;

describe("reelyActive", function() {

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

  it("should register for the reelyActive service", function(done) {

    request(url)
      .put('reelyActive')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.body.data.token).not.equal(null);
        expect(res.body.data.token).not.equal(undefined);
        reelyActiveToken = res.body.data.token;
        done();
      });
  });

  it("should get the reelyActive token", function(done) {

    request(url)
      .put('reelyActive')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.body.data.token).not.equal(null);
        expect(res.body.data.token).not.equal(undefined);
        expect(res.body.data.token).to.equal(reelyActiveToken);
        done();
      });
  });

  it("should remove the reelyActive service", function(done) {

    request(url)
      .delete('reelyActive')
      .set('Authorization', 'Bearer ' + testUser.token)
      .send()

      .end(function(err, res) {
        if (err) {
          throw err;
        }

        expect(res.status).to.equal(response.STATUS.OK);
        done();
      });
  });

});