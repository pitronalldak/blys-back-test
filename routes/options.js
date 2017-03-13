/**
 * Created by tingtzechuen on 9/09/2016.
 */
var express = require('express');
var router = express.Router();


let models = require('../models');
let User = models.User;
let Address = models.Address;

let responseHelper = require('../helpers/response-helper');

//TODO: Deprecate this? Keep it simple and just hard code Enums
router.get('/addresstypes', function (req, res) {

    let result = {
        home: 'Home',
        hotel: 'Hotel',
        office: 'Office',
        other: 'Other'
    };

    responseHelper.returnObjectAsJSON(result, res);

});

module.exports = router;