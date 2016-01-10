/**
 * Copyright reelyActive 2015-2016
 * We believe in an open Internet of Things
 */

var express = require('express');


var router = express.Router();


router.route('/:place')
  .get(function(req, res) {
    res.redirect('../../contextat/directory/' + req.params.place);
  });


module.exports = router;
