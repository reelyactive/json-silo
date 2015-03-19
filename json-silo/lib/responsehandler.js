var STATUS_OK = "ok";
var STATUS_NOTFOUND = "notFound";
var STATUS_BADREQUEST = "badRequest";
var STATUS_UNAUTHORIZED = "unauthorized";
var STATUS_FORBIDDEN = "forbidden";
var STATUS_INTERNALSERVERERROR = "internalServerError";
var CODE_OK = 200;
var CODE_NOTFOUND = 404;
var CODE_BADREQUEST = 400;
var CODE_UNAUTHORIZED = 401;
var CODE_INTERNALSERVERERROR = "500";


/**
 * Prepares the JSON for an API query response which is successful
 * @param {Object} devices List of devices
 * @param {Object} params The parameters of the query
 */
function prepareResponse(devices, params) {
  var response = {};
  prepareMeta(response, STATUS_OK);
  return response;
};


/**
 * Prepares the JSON for an API query response which is unsuccessful
 * @param {String} status String representing the status message
 */
function prepareFailureResponse(status) {
  var response = {};
  prepareMeta(response, status);
  return response;
};


/**
 * Prepares and adds the _meta to the given API query response
 * @param {Object} response JSON representation of the response
 * @param {String} status String representing the status message
 */
function prepareMeta(response, status) {
  switch(status) {
    case STATUS_OK:
      response._meta = { "message": STATUS_OK,
                         "statusCode": CODE_OK };
      break;
    case STATUS_NOTFOUND:
      response._meta = { "message": STATUS_NOTFOUND,
                         "statusCode": CODE_NOTFOUND };
      break;  
    case STATUS_UNAUTHORIZED:
      response._meta = { "message": STATUS_UNAUTHORIZED,
                         "statusCode": CODE_UNAUTHORIZED };
      break;
    case STATUS_INTERNALSERVERERROR:
      response._meta = { "message": STATUS_INTERNALSERVERERROR,
                         "statusCode": CODE_INTERNALSERVERERROR };
      break;   
    default:
      response._meta = { "message": STATUS_BADREQUEST,
                         "statusCode": CODE_BADREQUEST }; 
  }
};


module.exports.prepareResponse = prepareResponse;#
module.exports.prepareFailureResponse = prepareFailureResponse;
