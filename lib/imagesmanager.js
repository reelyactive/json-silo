/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');


const DEFAULT_IMAGE_FILE_TYPES = /jpeg|jpg|png|gif/;
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';
const DEFAULT_IMAGES_FOLDER = 'images';
const DEFAULT_IMAGE_WIDTH_PIXELS = 300;
const DEFAULT_IMAGE_HEIGHT_PIXELS = 300;


/**
 * ImagesManager Class
 * Manages the storage and retrieval of images.
 */
class ImagesManager {

  /**
   * ImagesManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    self.imageFileTypes = options.imageFileTypes || DEFAULT_IMAGE_FILE_TYPES;

    self.storage = multer.diskStorage({ //multer image storage
      destination: DEFAULT_IMAGES_FOLDER,
      filename: imageFileName
    });
  }


  /**
   * Create a new image
   * @param {Object} req The HTTP request.
   * @param {Object} res The HTTP result.
   * @param {callback} callback Function to call on completion
   */
  create(req, res, callback) {
    let self = this;

    let upload = multer({
      storage: self.storage, //multer image upload
      fileFilter: imageFileFilter
    }).single(DEFAULT_IMAGE_PROPERTY_NAME);

    upload(req, res, function(err) {
      if(err) { 
        return callback(204);
      }
      else if(req.file === undefined) {
        return callback(422);
      }
      else {
        let imageFileName = req.file.originalname;
        let imagePath = path.resolve(__dirname + '/../' + DEFAULT_IMAGES_FOLDER +
                        '/' + imageFileName);
        resize(imagePath);
        let data = { imageName: imageFileName };
        return callback(200, data);
      }
    });
  }


  /**
   * Retrieve an existing image
   * @param {String} imageFileName The filename of the image
   * @param {callback} callback Function to call on completion
   */
  retrieve(imageFileName, callback) {
    let imagePath = path.resolve(__dirname + '/../' + DEFAULT_IMAGES_FOLDER +
                    '/' + imageFileName);

    return callback(imagePath);
  }

}


/**
 * Return the original file name in the given callback.
 * @param {Object} req The HTTP request.
 * @param {Object} file The multipart file.
 * @param {function} callback Function to call on completion.
 */
function imageFileName(req, file, callback) {
  return callback(null, file.originalname);
}


/**
 * Reject image files with incompatible mimetype and/or extname.
 * @param {Object} req The HTTP request.
 * @param {Object} file The multipart file.
 * @param {function} callback Function to call on completion.
 */
function imageFileFilter(req, file, callback) {
  let isValidExtname = DEFAULT_IMAGE_FILE_TYPES
                      .test(path.extname(file.originalname)
                      .toLowerCase());
  let isValidMimetype = DEFAULT_IMAGE_FILE_TYPES.test(file.mimetype); 
    
  if(isValidMimetype && isValidExtname) {
    return callback(null, true);
  }
  else {
    return callback('Error: incompatible image file format');
  } 
}


/**
 * Resize the image at the given path
 * @param {String} imagePath The path to the image
 */
function resize(imagePath) {
  sharp(imagePath)
    .resize(DEFAULT_IMAGE_WIDTH_PIXELS, DEFAULT_IMAGE_HEIGHT_PIXELS)
    .toBuffer(function(err, buffer) {
      if(err){
        res.send(err);
      }
      else {
        fs.writeFile(imagePath, buffer, function(err) {
          // TODO: handle error
        });
      }
    });
}


module.exports = ImagesManager;
