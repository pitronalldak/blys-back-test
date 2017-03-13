/**
 * Created by tingtzechuen on 08/12/2015.
 */

function setHeaderToJSON(res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

exports.setHeaderToJSON = function(res) {
    setHeaderToJSON(res);
};

exports.throwUnauthorizedAccess = function(res) {
    res.status(401);
    setHeaderToJSON(res);
    res.end(JSON.stringify({errorMessage: 'Unauthorized Access'}));
};

exports.throwInternalServerError = function(res) {
    res.status(500);
    setHeaderToJSON(res);
    res.end(JSON.stringify({errorMessage: 'An Unknown Error Has Occured'}));
};

exports.returnObjectAsJSON = function(object, res) {
    res.status(200);
    setHeaderToJSON(res);
    res.end(JSON.stringify(object));
};

exports.throwErrorWithStatusCode = function(error, statusCode, res) {
    res.status(statusCode);
    setHeaderToJSON(res);
    res.end(JSON.stringify({errorMessage: error}));
};

exports.throwError = function(error, res) {
    res.status(400);
    setHeaderToJSON(res);
    res.end(JSON.stringify({errorMessage: error}));
};

exports.returnOkWithoutBody = function(res) {
    res.status(200);
    setHeaderToJSON(res);
    res.end();
};
