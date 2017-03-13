/**
 * Created by tingtzechuen on 12/09/2016.
 */
var express = require('express');
var router = express.Router();

let responseHelper = require('../helpers/response-helper');
let userHelper = require('../helpers/user-helper');
let braintreeHelper = require('../helpers/braintree-helper');
let getSwiftHelper = require('../helpers/getswift-helper');
let pushHelper = require('../helpers/push-helper');

let models = require('../models');
let User = models.User;
let GetSwiftDelivery = models.GetSwiftDelivery;
let Booking = models.Booking;
let BookingDetail = models.BookingDetail;

let db = models.db;

/*
 {
 "EventName": "job/accepted",
 "DateStamp": "2016-09-12T07:32:32.008Z",
 "Data": {
 "Job": {
 "JobIdentifier": "a445d2ed-4199-4b6c-8b93-64b18fe4f6c1",
 "Reference": "4568",
 "CustomerReference": null
 },
 "Driver": {
 "Identifier": "30846c18-6068-4b91-a605-d8346aef2330",
 "DriverName": "Ting Tze Chuen"
 },
 "Location": {
 "Longitude": 151.204039128638,
 "Latitude": -33.87529658622469
 }
 }
 }
 */
router.post('/accepted', function (req, res) {
    let body = req.body.Data;

    let jobIdentifier = body.Job.JobIdentifier;
    let driverIdentifier = body.Driver.Identifier;
    let driverName = body.Driver.DriverName;

    GetSwiftDelivery
        .find({
            where: {
                jobIdentifier: jobIdentifier
            },
            include: [
                {
                    model: BookingDetail,
                    include: [
                        {
                            model: Booking,
                            include: [User]
                        }
                    ]
                }
            ]
        })
        .then(function (getSwiftDelivery) {

            if (!getSwiftDelivery) {
                return;
            }

            getSwiftDelivery
                .updateAttributes({
                    driverIdentifier: driverIdentifier,
                    driverName: driverName,
                    status: 'accepted'
                })
                .then(function () {

                    let booking = getSwiftDelivery.bookingdetail.booking;

                    // Submit for Settlement
                    braintreeHelper.submitForSettlementIfNeededForBooking(booking, success => {
                        console.log('Submit for Settlement successful: ' + success);
                    });

                    // Send push
                    let driverFirstName = driverName.split(' ')[0];
                    let alert = "Your booking was accepted by " + driverFirstName;

                    let user = booking.user;

                    pushHelper.sendBookingUpdatedForUser(user, alert);

                });

        });

    responseHelper.returnOkWithoutBody(res);

});

router.post('/finished', function (req, res) {
    let body = req.body.Data;
    let jobIdentifier = body.Job.JobIdentifier;

    GetSwiftDelivery
        .find({
            where: {
                jobIdentifier: jobIdentifier
            }
        })
        .then(function (getSwiftDelivery) {

            if (!getSwiftDelivery) {
                return;
            }

            getSwiftDelivery
                .updateAttributes({
                    status: 'finished'
                }).then(function () {

                // Check if other jobs linked are also finished, then update Booking status if needed
                // BookingDetail hasOne GetSwiftDelivery
                BookingDetail
                    .find({
                        where: {
                            id: getSwiftDelivery.bookingdetailId
                        },
                        include: [Booking]
                    })
                    .then(function (detail) {

                        // Get all GetSwiftDeliveries for this booking

                        BookingDetail
                            .findAll({
                                where: {
                                    bookingId: detail.booking.id
                                },
                                include: [GetSwiftDelivery, Booking]
                            })
                            .then(function (details) {

                                var allDeliveriesCompleted = true;

                                details.forEach(function (detail) {

                                    if (detail.getswiftdelivery.status != 'finished' && detail.getswiftdelivery.status != 'cancelled') {
                                        allDeliveriesCompleted = false
                                    }

                                });

                                if (allDeliveriesCompleted) {
                                    detail.booking
                                        .updateAttributes({
                                            status: 'completed'
                                        });

                                    // Send push
                                    User
                                        .find({
                                            where: {
                                                id: detail.booking.userId
                                            },
                                            attributes: ['pushToken']
                                        })
                                        .then(function (user) {
                                            let alert = "Your booking was completed. Thank you for using Blys!";

                                            pushHelper.sendBookingUpdatedForUser(user, alert);
                                        });

                                }

                            });

                        /*
                         var allDeliveriesCompleted = true;

                         detail.getswiftdeliveries.forEach(function (delivery) {

                         if (delivery.status != 'finished') {
                         allDeliveriesCompleted = false
                         }

                         });

                         if (allDeliveriesCompleted) {
                         detail.booking
                         .updateAttributes({
                         status: 'completed'
                         });
                         }

                         */
                    });

            });


        });

    responseHelper.returnOkWithoutBody(res);

});

router.post('/abandoned', function (req, res) {

    let body = req.body.Data;
    let jobIdentifier = body.JobIdentifier;

    updateGetSwiftDeliveryStatus(jobIdentifier, 'new');

    responseHelper.returnOkWithoutBody(res);

});

router.post('/cancelled', function (req, res) {

    let body = req.body.Data;
    let jobIdentifier = body.JobIdentifier;

    GetSwiftDelivery
        .find({
            where: {
                jobIdentifier: jobIdentifier
            }
        })
        .then(function (getSwiftDelivery) {

            if (!getSwiftDelivery) {
                return;
            }

            getSwiftDelivery
                .updateAttributes({
                    status: 'cancelled'
                })
                .then(function () {
                    // Re-book with GetSwift -- Disabled for now
                    /*
                     BookingDetail
                     .find({
                     where: {
                     id: getSwiftDelivery.bookingdetailId
                     },
                     include: [Booking]
                     })
                     .then(function (bookingDetail) {


                     getSwiftHelper.createDelivery(bookingDetail.booking, bookingDetail, function (success, jobIdentifier) {

                     console.log('Rebooked: ' + jobIdentifier);

                     });


                     });
                     */
                });


        });

    responseHelper.returnOkWithoutBody(res);

});

function updateGetSwiftDeliveryStatus(jobIdentifier, status) {
    GetSwiftDelivery
        .find({
            where: {
                jobIdentifier: jobIdentifier
            }
        })
        .then(function (getSwiftDelivery) {

            if (!getSwiftDelivery) {
                return;
            }

            getSwiftDelivery
                .updateAttributes({
                    status: status
                }).then(function () {

            });


        });
}


module.exports = router;