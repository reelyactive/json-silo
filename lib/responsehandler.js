var STATUS = {

  OK : "ok",
  NOTFOUND : "notFound",
  BADREQUEST : "badRequest",
  UNAUTHORIZED : "unauthorized",
  FORBIDDEN : "forbidden",
  INTERNALSERVERERROR : "internalServerError",
  CODE_OK : 200,
  CODE_NOTFOUND : 404,
  CODE_BADREQUEST : 400,
  CODE_UNAUTHORIZED : 401,
  CODE_INTERNALSERVERERROR : "500"
}


/**
 * Prepares the JSON for an API query response which is successful
 * @param {Object} devices List of devices
 * @param {Object} params The parameters of the query
 */
function prepareResponse(devices, params) {
  var response = {};
  prepareMeta(response, STATUS.OK);
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
    case STATUS.OK:
      response._meta = { "message": STATUS.OK,
                         "statusCode": STATUS.CODE_OK };
      break;
    case STATUS.NOTFOUND:
      response._meta = { "message": STATUS.NOTFOUND,
                         "statusCode": STATUS.CODE_NOTFOUND };
      break;  
    case STATUS.UNAUTHORIZED:
      response._meta = { "message": STATUS.UNAUTHORIZED,
                         "statusCode": STATUS.CODE_UNAUTHORIZED };
      break;
    case STATUS.INTERNALSERVERERROR:
      response._meta = { "message": STATUS.INTERNALSERVERERROR,
                         "statusCode": STATUS.CODE_INTERNALSERVERERROR };
      break;   
    default:
      response._meta = { "message": STATUS.BADREQUEST,
                         "statusCode": STATUS.CODE_BADREQUEST }; 
  }
};


module.exports.prepareResponse = prepareResponse;
module.exports.prepareFailureResponse = prepareFailureResponse;

module.exports.STATUS = STATUS;
