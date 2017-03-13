/**
 * Created by tingtzechuen on 21/09/2016.
 */

var express = require('express');
var router = express.Router();

let moment = require('moment');

let responseHelper = require('../helpers/response-helper');
let pushHelper = require('../helpers/push-helper');

router.get('/timezone', function(req,res) {

    let date = req.query.date;

    let dateMoment = moment(date);

    responseHelper.returnObjectAsJSON({
        sydney: dateMoment.tz('Australia/Sydney').format('dddd, MMM D h:mma')
    }, res);

});

router.post('/push', function(req,res) {

    let token = req.body.token;
    let alert = req.body.alert;
    let payload = req.body.payload;

    pushHelper.sendPush(token, alert, payload);

    responseHelper.returnOkWithoutBody(res);

});

module.exports = router;