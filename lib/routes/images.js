/**
 * Copyright reelyActive 2019-2022
 * We believe in an open Internet of Things
 */


const express = require('express');
const multer = require('multer');
const path = require('path');
const responseHandler = require('./responsehandler');


const SUPPORTED_IMAGE_FILE_TYPES = /jpeg|jpg|png|gif/;
const IMAGE_FILE_NAME = 'image';
const HTTP_STATUS_OK = 200;


let router = express.Router();
let upload = multer({ fileFilter: fileFilter });


router.route('/')
  .post(upload.single(IMAGE_FILE_NAME), function(req, res) {
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
    if(status === HTTP_STATUS_OK) {
      res.sendFile(data);
    }
    else {
      res.status(status).send();
    }
  });
}


/**
 * Reject image files with incompatible mimetype and/or extname.
 * @param {Object} req The HTTP request.
 * @param {Object} file The multipart file.
 * @param {function} callback Function to call on completion.
 */
function fileFilter(req, file, callback) {
  let isValidExtname = SUPPORTED_IMAGE_FILE_TYPES
                        .test(path.extname(file.originalname)
                        .toLowerCase());
  let isValidMimetype = SUPPORTED_IMAGE_FILE_TYPES.test(file.mimetype); 
    
  if(isValidMimetype && isValidExtname) {
    return callback(null, true);
  }
  else {
    return callback(null, false);
  } 
}


module.exports = router;
