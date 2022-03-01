/**
 * Copyright reelyActive 2014-2022
 * We believe in an open Internet of Things
 */


const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


const DEFAULT_IMAGES_FOLDER = 'data/images';
const DEFAULT_IMAGE_WIDTH_PIXELS = 480;
const DEFAULT_IMAGE_HEIGHT_PIXELS = 480;
const DEFAULT_IDENTIFIER_LENGTH = 4;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE = 415;


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

    self.identifierLength = options.identifierLength ||
                            DEFAULT_IDENTIFIER_LENGTH;

    fs.mkdir(DEFAULT_IMAGES_FOLDER, { recursive: true }, (err) => {
      if(err) {
        throw new Error('json-silo could not create images directory:',
                        DEFAULT_IMAGES_FOLDER);
      }
    });
  }

  /**
   * Create a new image
   * @param {Object} req The HTTP request.
   * @param {Object} res The HTTP result.
   * @param {callback} callback Function to call on completion.
   */
  create(req, res, callback) {
    let self = this;

    if(req.file === undefined) {
      return callback(HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE);
    }
    else {
      let fileName = crypto.randomBytes(self.identifierLength).toString('hex')
                     + path.extname(req.file.originalname);
      let filePath = path.resolve(DEFAULT_IMAGES_FOLDER + '/' + fileName);

      sharp(req.file.buffer)
        .resize(DEFAULT_IMAGE_WIDTH_PIXELS, DEFAULT_IMAGE_HEIGHT_PIXELS)
        .toFile(filePath, (err, info) => {
          if(err) {
            return callback(HTTP_STATUS_BAD_REQUEST);
          }

          let images = {};
          images[fileName] = info;

          return callback(HTTP_STATUS_CREATED, { images: images });
        });
    }
  }

  /**
   * Retrieve an existing image
   * @param {String} fileName The filename of the image.
   * @param {callback} callback Function to call on completion.
   */
  retrieve(fileName, callback) {
    let filePath = path.resolve(DEFAULT_IMAGES_FOLDER + '/' + fileName);

    fs.access(filePath, fs.F_OK, (err) => {
      if(err) {
        return callback(HTTP_STATUS_NOT_FOUND);
      }
      return callback(HTTP_STATUS_OK, filePath);
    });
  }

}


module.exports = ImagesManager;
