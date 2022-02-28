/**
 * Copyright reelyActive 2019-2022
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const responseHandler = require('./responsehandler');


let router = express.Router();

router.route('/')
  .post(function(req, res) {
    createImage(req, res);
  });

router.route('/:id')
  .get(function(req, res) {
    retrieveImage(req, res);
  });


/**
 * Create the given image.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function createImage(req, res) {
  let images = req.jsonsilo.images;

  images.create(req, res, function(status, data) {
    let response = responseHandler.prepareResponse(req, status, data);
    res.status(status).json(response);
  });
}


/**
 * Retrieve the given image.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveImage(req, res) {
  let images = req.jsonsilo.images;
  let imageFileName = req.params.id;

  images.retrieve(imageFileName, function(status, data) {
    if(status === 200) {
      res.sendFile(data);
    }
    else {
      res.status(status).send();
    }
  });
}


module.exports = router;
