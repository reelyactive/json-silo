/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');
const imagesmanager = require('./../imagesmanager');

let router = express.Router();

router.route('/')
  .get(function(req, res) {
   // console.log(req.jsonsilo)
  });

module.exports = router;
