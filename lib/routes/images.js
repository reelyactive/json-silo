/**
 * Copyright reelyActive 2019
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
  images.upload(req, res, function(err) {
    if(err) { 
      res.status(204).end(); 
    }
    else if(req.file === undefined) {
      res.status(422).end();
    }
    else {
      images.resize(path.resolve(__dirname + '../../../' + `/images/${req.file.originalname}`));
      let data = { imageName: req.file.originalname };
      let response = responseHandler.prepareResponse(req, 200, data);
      res.status(200).json(response);
    }
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

  images.retrieve(imageFileName, function(imagePath) {
    res.sendFile(imagePath);
  });
}


module.exports = router;
