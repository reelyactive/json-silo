/**
 * Copyright reelyActive 2015-2016
 * We believe in an open Internet of Things
 */

var express = require('express');


var router = express.Router();


router.route('/:id')
  .get(function(req, res) {
    res.redirect('../../stories/' + req.params.id);
  });


module.exports = router;
