/**
 * Created by tingtzechuen on 9/09/2016.
 */

// Models
const models = require('../models');
const User = models.User;

const responseHelper = require('../helpers/response-helper');

exports.getUserWithAccessToken = function (accessToken, callback) {
    getUserWithAccessTokenIncludeModels(accessToken, null, callback);
};

exports.getUserWithAccessTokenIncludeModels = function (accessToken, includeModels, callback) {
    getUserWithAccessTokenIncludeModels(accessToken, includeModels, callback);
};

function getUserWithAccessTokenIncludeModels(accessToken, includeModels, callback) {
    let findConditions = {
        where: {
            accessToken: accessToken
        }
    };

    if (includeModels) {
        findConditions.include = includeModels;
    }

    User
        .find(findConditions)
        .then(function (user) {
            callback(user);
        });
}

// Callback returns user
exports.validateSession = function (req, res, callback) {
    let accessToken = req.query.accessToken ? req.query.accessToken : req.body.accessToken;

    if (!accessToken) {
        responseHelper.throwUnauthorizedAccess(res);
        return;
    }

    this.getUserWithAccessToken(accessToken, function (user) {
        if (!user) {
            responseHelper.throwUnauthorizedAccess(res);
            return;
        }

        callback(user);
    });
};

const uuid = require('node-uuid');

exports.createAccessTokenAndReturnUser = function (user, callback) {
    let newToken = uuid.v4();

    user
        .updateAttributes({
            accessToken: newToken
        })
        .then(function (user) {
            callback(user);
        });
};

exports.getAllAttributesToInclude = function() {
    return ['id', 'firstName', 'lastName', 'email', 'mobile', 'gender', 'accessToken', 'braintreeCustomerId', 'adminAccess', 'createdAt', 'updatedAt'];
};