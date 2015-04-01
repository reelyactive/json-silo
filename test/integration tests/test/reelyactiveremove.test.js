var reelyActiveToken;


describe("reelyActive REMOVE", function() {

  before(function(done) {

    async.series([

      // Login a user
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

      // Register for reelyActive
      function(callback) {
        request(url)
          .put('reelyActive')
          .set('Authorization', 'Bearer ' + testUser.token)
          .send()

          .end(function(err, res) {
            if (err) {
              throw err;
            }
            
            callback();
            done();
          });
      }]);
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

        expect(res.body.data).to.equal('Unregistration successfull');
        done();
      });
  });

});