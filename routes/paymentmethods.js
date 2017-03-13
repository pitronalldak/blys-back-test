/**
 * Created by tingtzechuen on 10/09/2016.
 */
var express = require('express');
var router = express.Router();

let responseHelper = require('../helpers/response-helper');
let userHelper = require('../helpers/user-helper');
let braintreeHelper = require('../helpers/braintree-helper');

let models = require('../models');
let User = models.User;
let PaymentMethod = models.PaymentMethod;
let Booking = models.Booking;

let db = models.db;


router.post('/', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        let nonce = req.body.nonce;

        let last4 = req.body.last4;
        let expiryMonth = req.body.expiryMonth;
        let expiryYear = req.body.expiryYear;
        let cardType = req.body.cardType;
        let email = req.body.email;
        let type = 'card';

        if (!nonce) {
            responseHelper.throwInternalServerError(res);
            return;
        }

        if (email && !cardType) {
            type = 'paypal';
        }

        if (user.braintreeCustomerId) { // Already have braintree customer id

            braintreeHelper.createPaymentMethodTokenForCustomer(user.braintreeCustomerId, nonce, function (success, paymentMethodTokenOrError) {

                if (success) {
                    PaymentMethod.create({
                        userId: user.id,
                        last4: last4,
                        expiryMonth: expiryMonth,
                        expiryYear: expiryYear,
                        email: email,
                        type: type,
                        cardType: cardType,
                        braintreePaymentMethodToken: paymentMethodTokenOrError
                    }).then(function (paymentMethod) {
                        responseHelper.returnObjectAsJSON(paymentMethod, res);
                    });

                } else {
                    if (paymentMethodTokenOrError) {
                        responseHelper.throwError(paymentMethodTokenOrError, res);
                    } else {
                        responseHelper.throwInternalServerError(res);
                    }
                }

            });

        } else { // Create customer id with payment method together

            braintreeHelper.createCustomerWithPaymentMethod(user.firstName, user.lastName, nonce, function (success, customerIdOrError, paymentMethodToken) {
                if (success) {
                    user.updateAttributes({
                        braintreeCustomerId: customerIdOrError
                    })
                        .then(function () {
                            PaymentMethod.create({
                                userId: user.id,
                                last4: last4,
                                expiryMonth: expiryMonth,
                                expiryYear: expiryYear,
                                email: email,
                                type: type,
                                cardType: cardType,
                                braintreePaymentMethodToken: paymentMethodToken
                            }).then(function (paymentMethod) {
                                responseHelper.returnObjectAsJSON(paymentMethod, res);
                            });

                        });
                } else {
                    if (customerIdOrError) {
                        responseHelper.throwError(customerIdOrError, res);
                    } else {
                        responseHelper.throwInternalServerError(res);
                    }
                }

            });
        }

    });


});

router.get('/clientToken', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        braintreeHelper.getClientToken(function (success, clientToken) {

            if (success) {
                responseHelper.returnObjectAsJSON({
                    clientToken: clientToken

                }, res);
            } else {
                responseHelper.throwInternalServerError(res);

            }
        });

    });

});

router.get('/', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        PaymentMethod
            .findAll({
                where: {
                    userId: user.id
                }
            })
            .then(function (paymentMethods) {
                responseHelper.returnObjectAsJSON(paymentMethods, res);
            });

    });

});

router.get('/last', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        Booking
            .find({
                where: {
                    userId: user.id
                },
                include: [PaymentMethod],
                order: 'createdAt DESC',
                limit: 1

            })
            .then(function (booking) {
                if (booking) {
                    responseHelper.returnObjectAsJSON(booking.paymentmethod, res);

                } else {
                    // Fallback in case they haven't made a booking yet
                    PaymentMethod
                        .findOne({
                            where: {
                                userId: user.id
                            }
                        })
                        .then(function (paymentMethod) {
                            responseHelper.returnObjectAsJSON(paymentMethod, res);
                        });

                }

            });

    });

});

module.exports = router;