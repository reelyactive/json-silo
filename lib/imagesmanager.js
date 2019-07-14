/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');


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
    self.storage = multer.diskStorage({ //multer image storage
      destination: "./images",
      filename: function(req, file, callback) {
        callback(null, file.originalname);
      }
    });
  
    self.upload = multer({
      storage: self.storage, //multer image upload
      fileFilter: function(req, file, callback) {
        const filetypes = /jpeg|jpg|png|gif|tiff|psd/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype); 
    
        if(mimetype && extname){
          return callback(null, true);
        }
        else {
          callback('Error: wrong file format');
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
      .resize(300, 300).toBuffer(function(err, buffer) {
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
