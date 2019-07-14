/**
 * Copyright reelyActive 2019-2019
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const responseHandler = require('./responsehandler');


let router = express.Router();
 
router.route('/:id').get(function(req, res){
  getImage(req, res);
});

router.route('/').post(function(req, res) {
  uploadImage(req, res);
});


/**
 * Create the given image.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function uploadImage(req, res){
  let images = req.jsonsilo.images;
  images.upload(req, res, function(err){
    if(err){ 
      res.status(204).end(); 
    }
    else if(req.file == undefined){
      res.status(422).end();
    }
    else{
      images.resize(path.resolve(__dirname + '../../../' + `/images/${req.file.originalname}`));
      let data = {"imageName": req.file.originalname}
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
function getImage(req, res){
  res.sendFile(path.resolve(__dirname + '../../../' + `/images/${req.params.id}`));
}


module.exports = router;
 
