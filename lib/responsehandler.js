/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var STATUS = {
  OK : 200,
  NOTFOUND : 404,
  BADREQUEST : 400,
  FORBIDDEN : 403,
  UNAUTHORIZED : 401,
  INTERNALSERVERERROR : 500,
  TOOLARGE : 413,
  UNSUPPORTEDMEDIA : 415,
}

var error = function (err, res) {
  
  return res.status(err.http_code).end(err.message);
}

var data = function (data, res) {
  return res.json({
    "done": true,
    "data": data
  })
}

module.exports.STATUS = STATUS;
module.exports.data = data;
module.exports.error = error;