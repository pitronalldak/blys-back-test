/**
 * Created by tingtzechuen on 11/09/2016.
 */
var express = require('express');
var router = express.Router();

let responseHelper = require('../helpers/response-helper');
let userHelper = require('../helpers/user-helper');
let braintreeHelper = require('../helpers/braintree-helper');
let optionsHelper = require('../helpers/options-helper');
let swiftHelper = require('../helpers/getswift-helper');
let priceHelper = require('../helpers/price-helper');
let emailHelper = require('../helpers/email-helper');
let bookingHelper = require('../helpers/booking-helper');

let models = require('../models');
let User = models.User;
let PaymentMethod = models.PaymentMethod;
let Booking = models.Booking;
let BookingDetail = models.BookingDetail;
let Address = models.Address;
let GetSwiftDelivery = models.GetSwiftDelivery;
let Recipient = models.Recipient;

let db = models.db;

let async = require('async');
let moment = require('moment');

router.post('/', function (req, res) {

    userHelper.validateSession(req, res, function (user) {


        console.log('Body: ' + JSON.stringify(req.body));

        let paymentmethodId = req.body.paymentmethodId;

        if (!paymentmethodId) {
            responseHelper.throwError('Please provide payment method', res);
            return;
        }

        let massageDuration = req.body.massageDuration;

        if (!massageDuration) {
            responseHelper.throwError('Please specify massage length', res);
            return;
        }

        let specialInstructions = req.body.specialInstructions;

        let earliestTime = req.body.earliestTime;

        if (!earliestTime) {
            responseHelper.throwError('Please specify earliest time', res);
            return;
        }


        let latestTime = req.body.latestTime;

        if (!latestTime) {
            responseHelper.throwError('Please specify latest time', res);
            return;
        }

        let addressId = req.body.addressId;

        if (!addressId) {
            responseHelper.throwError('Please provide address', res);
            return;
        }

        let sessionType = req.body.sessionType;

        if (!sessionType) {
            responseHelper.throwError('Please specify session type', res);
            return;
        }

        let massageFor = req.body.massageFor;

        if (!massageFor) {
            responseHelper.throwError('Please specify who is this massage for', res);
            return;
        }

        let recipientId = req.body.recipientId;

        if (massageFor == 'someone_else' && !recipientId) {
            responseHelper.throwError('Please provide recipient id', res);
            return;
        }

        let bookingDetails = req.body.bookingDetails;

        if (!bookingDetails) {
            responseHelper.throwError('Please provide booking details', res);
            return;
        }

        if (sessionType == 'couples' && bookingDetails.length < 2) {
            responseHelper.throwError('There has to be 2 booking detail for Couple bookings', res);
            return;
        }

        if (sessionType != 'couples' && bookingDetails.length > 1) {
            responseHelper.throwError('You can only have 1 booking detail for this Session Type', res);
            return;
        }

        let timezone = req.body.timezone;

        if (!timezone) {
            responseHelper.throwError('You must specify your time zone', res);
            return;
        }


        let now = moment().tz(timezone);
        let earliestTimeMoment = moment(earliestTime).tz(timezone);
        let latestTimeMoment = moment(latestTime).tz(timezone);

        let isCurrentDateOrBefore = earliestTimeMoment.isSameOrBefore(now, "day");

        console.log('Is Current Date or before: ' + isCurrentDateOrBefore);

        if (latestTimeMoment.isBefore(earliestTimeMoment)) {
            responseHelper.throwError('Latest time cannot be before Earliest time', res);
            return;

        } else if (earliestTimeMoment.hour() < 6) {
            responseHelper.throwError('Earliest time cannot be before 6am', res);
            return;

        } else if (earliestTimeMoment.hour() >= 22) {
            responseHelper.throwError('Earliest time cannot be past 10pm', res);
            return;

        } else if (isCurrentDateOrBefore && earliestTimeMoment.hour() < now.hour() + 2) {
            responseHelper.throwError('Earliest time is too early!', res);
            return;

        }

        Address
            .find({
                where: {
                    id: addressId
                }
            })
            .then(function (address) {
                if (!address) {
                    responseHelper.throwError('Address not found', res);
                    return;
                }

                PaymentMethod
                    .find({
                        where: {
                            userId: user.id, // Verify if this payment method belongs to this user
                            id: paymentmethodId
                        }
                    })
                    .then(function (paymentMethod) {

                        let paymentMethodToken = paymentMethod.braintreePaymentMethodToken;

                        // Charge
                        let price = priceHelper.priceFor(massageDuration, sessionType, address.type);

                        console.log('Price: ' + price);

                        braintreeHelper.chargeCustomerWithPaymentMethod(paymentMethodToken, price, function (success, transactionId) {

                            if (success) {

                                Booking
                                    .create({
                                        userId: user.id,
                                        recipientId: recipientId,
                                        paymentmethodId: paymentMethod.id, // Reminder: Needs to be all lowercase before Id
                                        addressId: addressId,
                                        braintreeTransactionId: transactionId,
                                        sessionType: sessionType,
                                        massageDuration: massageDuration,
                                        specialInstructions: specialInstructions,
                                        earliestTime: earliestTime,
                                        latestTime: latestTime,
                                        status: 'new',
                                        massageFor: massageFor,
                                        timezone: timezone
                                    })
                                    .then(function (booking) {

                                        // Create booking details
                                        bookingDetails.forEach(function (detail) {

                                            detail.bookingId = booking.id;

                                        });

                                        BookingDetail
                                            .bulkCreate(bookingDetails)
                                            .then(function () {

                                                // Send confirmation email
                                                bookingWithId(booking.id, function (booking) {
                                                    responseHelper.returnObjectAsJSON(booking, res);

                                                    emailHelper.sendBookingConfirmationEmail(booking);
                                                });

                                                // Create GetSwift bookings
                                                BookingDetail
                                                    .findAll({
                                                        where: {
                                                            bookingId: booking.id
                                                        }
                                                    })
                                                    .then(function (bookingDetails) {

                                                        var asyncParallels = [];

                                                        var getSwiftSuccess = true;


                                                        bookingDetails.forEach(function (detail) {
                                                            asyncParallels.push(
                                                                function (callback) {
                                                                    // Create booking with GetSwift

                                                                    swiftHelper.createDelivery(booking, detail, function (success, jobIdentifier) {

                                                                        console.log('jobIdentifier: ' + jobIdentifier);

                                                                        if (!success) {
                                                                            getSwiftSuccess = false;
                                                                        }

                                                                        callback(null, jobIdentifier);

                                                                    });
                                                                }
                                                            );

                                                        });


                                                        async.parallel(asyncParallels, function (err, results) {

                                                            console.log('Async parallels done');

                                                            console.log('err: ' + err);
                                                            console.log('Results: ' + JSON.stringify(results));

                                                            if (err) {
                                                                // responseHelper.throwInternalServerError(res);
                                                                return;
                                                            }

                                                            if (getSwiftSuccess) {
                                                                console.log('getswiftsuccess');
                                                                console.log('booking: ' + JSON.stringify(booking));

                                                                // Set status for bookings
                                                                booking
                                                                    .updateAttributes({
                                                                        status: 'arranged'
                                                                    })
                                                                    .then(function () {

                                                                        console.log('updated status');

                                                                    });

                                                            } else {

                                                                console.log('GetSwift failed');

                                                                // if (results) {
                                                                //     responseHelper.throwError(results, res);
                                                                // } else {
                                                                //     responseHelper.throwInternalServerError(res);
                                                                // }

                                                            }

                                                        });
                                                    });

                                            });

                                    });

                            } else {
                                responseHelper.throwError('Unable to process payment on your selected payment method or credit card', res);
                            }

                        });


                    });
            });


    });

});

router.get('/:id(\\d+)', function (req, res) {

    userHelper.validateSession(req, res, function (user) {
        bookingWithId(req.params.id, function (booking) {
            responseHelper.returnObjectAsJSON(booking, res);
        });
    });

});

router.get('/', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        if (req.query.admin == 'true') {

            if (user.adminAccess) {
                getBookingsForAdminPanel(req, res);
            } else {
                responseHelper.throwUnauthorizedAccess(res);
            }

        } else {
            getBookingsForUser(user, 'all', function (bookings) {
                responseHelper.returnObjectAsJSON(bookings, res);
            });
        }

    });

});

router.get('/upcoming', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        getBookingsForUser(user, 'upcoming', function (bookings) {
            responseHelper.returnObjectAsJSON(bookings, res);
        });

    });
});

router.get('/past', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        getBookingsForUser(user, 'past', function (bookings) {
            responseHelper.returnObjectAsJSON(bookings, res);
        });

    });
});

router.get('/price', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        let massageDuration = req.query.massageDuration;
        let sessionType = req.query.sessionType;
        let typeOfLocation = req.query.typeOfLocation;

        let price = priceHelper.priceFor(massageDuration, sessionType, typeOfLocation);

        responseHelper.returnObjectAsJSON({price: price}, res);

    });

});

router.post('/:id(\\d+)/send_confirmation_email', function (req, res) {
    let bookingId = req.params.id;

    bookingWithId(bookingId, function (booking) {
        emailHelper.sendBookingConfirmationEmail(booking);

        responseHelper.returnOkWithoutBody(res);
    });
});

router.post('/:id(\\d+)/book_getswift', function (req, res) {

    let bookingId = req.params.id;

    bookingWithId(bookingId, function (booking) {

        if (!booking) {
            responseHelper.throwError('Booking not found', res);

            return;
        }

        if (booking.status == 'new') {

            // Create booking with GetSwift

            let detail = booking.bookingdetails[0];

            swiftHelper.createDelivery(booking, detail, function (success, jobIdentifier) {

                console.log('jobIdentifier: ' + jobIdentifier);

                if (success) {
                    // Set status for bookings
                    booking
                        .updateAttributes({
                            status: 'arranged'
                        })
                        .then(function () {

                            console.log('updated status');
                            bookingWithId(booking.id, function (booking) {
                                responseHelper.returnObjectAsJSON(booking, res);

                                emailHelper.sendBookingConfirmationEmail(booking);
                            });
                        });
                } else {
                    responseHelper.throwError(jobIdentifier, res);
                }

            });

        } else {
            responseHelper.throwError('Already arranged', res);
        }

    });

});

// Callback (Bookings)
function getBookingsForUser(user, type, callback) {

    let statuses = [];

    switch (type) {
        case 'all':
            statuses = ['new', 'arranged', 'completed'];
            break;

        case 'upcoming':
            statuses = ['new', 'arranged'];
            break;

        case 'past':
            statuses = ['completed'];
            break;
    }

    Booking
        .findAll({
            where: {
                userId: user.id,
                status: {
                    $in: statuses
                }
            },
            include: bookingHelper.getAllIncludes()
        })
        .then(function (bookings) {
            callback(bookings);
        });

}

function getBookingsForAdminPanel(req, res) {

    console.log('get bookings for admin panel');

    const perPage = req.query.perPage;
    const currentPage = req.query.currentPage;

    const limit = parseInt(perPage ? perPage : 10);
    const page = parseInt(currentPage ? currentPage : 1);
    const offset = limit * (page - 1);

    Booking
        .findAndCountAll({
            limit: limit,
            offset: offset,
            order: 'createdAt DESC',
            include: bookingHelper.getAllIncludes()
        })
        .then(result => {

            let bookings = result.rows;
            let count = result.count;

            responseHelper.returnObjectAsJSON({

                bookings: bookings,
                currentPage: page,
                pageCount: Math.ceil(count / limit),
                objectCount: count,
                perPage: limit

            }, res);

        });


}

function bookingWithId(id, callback) {
    bookingHelper.bookingWithId(id, callback);
}

router.get('/instructions_char_length_available', (req, res) => {

    userHelper.validateSession(req, res, user => {
        let genderPreference = req.query.genderPreference;
        let massageFor = req.query.massageFor;
        let gender = user.gender;
        let typeOfLocation = req.query.typeOfLocation;

        let instructions = swiftHelper.compileInstructionsWithDetails(genderPreference, massageFor, gender, typeOfLocation);

        let maxLength = 400;

        responseHelper.returnObjectAsJSON({
            'available': maxLength - instructions.length
        }, res);
    });

});

router.delete('/:id(\\d+)', (req, res) => {

    userHelper.validateSession(req, res, user => {

        console.log('user adminAccess: ' + user.adminAccess);

        if (!user.adminAccess) {
            responseHelper.throwUnauthorizedAccess(res);
            return;
        }

        bookingHelper.bookingWithId(req.params.id, booking => {
            swiftHelper.cancelDeliveriesForBooking(booking, user, success => {

                if (success) {

                    booking
                        .update({
                            status: 'cancelled'
                        })
                        .then(function () {
                            responseHelper.returnOkWithoutBody(res);
                        });

                } else {
                    responseHelper.throwError('Unable to cancel booking, booking and GetSwift deliveries may have been previously cancelled', res);
                }
            });
        });


    });

});

module.exports = router;