/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');


const DEFAULT_IMAGE_FILE_TYPES = /jpeg|jpg|png|gif/;
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
      filename: function(req, file, callback) {
        callback(null, file.originalname);
      }
    });
  
    self.upload = multer({
      storage: self.storage, //multer image upload
      fileFilter: function(req, file, callback) {
        let extname = DEFAULT_IMAGE_FILE_TYPES
                        .test(path.extname(file.originalname)
                        .toLowerCase());
        let mimetype = DEFAULT_IMAGE_FILE_TYPES.test(file.mimetype); 
    
        if(mimetype && extname){
          return callback(null, true);
        }
        else {
          return callback('Error: wrong file format');
        } 
      }
    }).single('myFile');
  }


  /**
   * Resize the image at the given path
   * @param {String} imagePath The path to the image
   */
  resize(imagePath) {
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

}


module.exports = ImagesManager;
