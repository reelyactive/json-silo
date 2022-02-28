/**
 * Copyright reelyActive 2014-2022
 * We believe in an open Internet of Things
 */


const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');


const DEFAULT_IMAGE_FILE_TYPES = /jpeg|jpg|png|gif/;
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';
const DEFAULT_IMAGES_FOLDER = 'images';
const DEFAULT_IMAGE_WIDTH_PIXELS = 480;
const DEFAULT_IMAGE_HEIGHT_PIXELS = 480;
const DEFAULT_IDENTIFIER_LENGTH = 4;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;


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
    self.identifierLength = options.identifierLength ||
                            DEFAULT_IDENTIFIER_LENGTH;

    self.storage = multer.diskStorage({
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
        storage: self.storage,
        fileFilter: imageFileFilter
    }).single(DEFAULT_IMAGE_PROPERTY_NAME);

    upload(req, res, function(err) {
      if(err) { 
        return callback(HTTP_STATUS_NO_CONTENT);
      }
      else if(req.file === undefined) {
        return callback(HTTP_STATUS_UNPROCESSABLE_ENTITY);
      }
      else {
        let fileName = crypto.randomBytes(self.identifierLength).toString('hex')
                       + path.extname(req.file.originalname);
        let filePath = path.resolve(DEFAULT_IMAGES_FOLDER + '/' + fileName);
        let images = {};
        images[fileName] = {};

        resize(req.file.path, filePath);

        return callback(HTTP_STATUS_CREATED, { images: images });
      }
    });
  }

  /**
   * Retrieve an existing image
   * @param {String} imageFileName The filename of the image
   * @param {callback} callback Function to call on completion
   */
  retrieve(imageFileName, callback) {
    let imagePath = path.resolve(DEFAULT_IMAGES_FOLDER + '/' + imageFileName);

    fs.access(imagePath, fs.F_OK, (err) => {
      if(err) {
        return callback(HTTP_STATUS_NOT_FOUND);
      }
      return callback(HTTP_STATUS_OK, imagePath);
    });
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
function resize(sourcePath, targetPath) {
  sharp(sourcePath)
    .resize(DEFAULT_IMAGE_WIDTH_PIXELS, DEFAULT_IMAGE_HEIGHT_PIXELS)
    .toFile(targetPath, (err, info) => {
      if(err) {
        // TODO
      }
    });
}


module.exports = ImagesManager;
