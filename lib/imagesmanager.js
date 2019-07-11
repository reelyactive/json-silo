/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

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
      destination: './images',
      filename: function(req, file, callback){
        callback(null, file.originalname);
      }
    });
  
     self.upload = multer({storage: self.storage, //multer image upload
      fileFilter: function(req, file, cb){
        const filetypes = /jpeg|jpg|png|gif|tiff|psd/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype); 
    
        if(mimetype && extname){
          return cb(null,true);
        } else {
          cb('Error: wrong file format');
        } 
      }
    }).single('myFile');
  }
  

  /**
   * Resizing at the given path
   * @param {String} imagePath 
   */
  resize(imagePath){
    sharp(imagePath)
      .resize(300, 300).toBuffer(function(err, buffer) {
        if(err){
          res.send(err);
        }
        else{
          fs.writeFile(imagePath,
            buffer, function(e) {
          });
        }
      });
  }
}
module.exports = ImagesManager;