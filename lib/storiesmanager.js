/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

const express = require('express');
var router = express.Router();

router.route('/').get( (req, res) => res.render('index'));
