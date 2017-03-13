/**
 * Created by tingtzechuen on 11/09/2016.
 */



var braintree = require("braintree");


const Config = require('../config/config');
const conf = new Config();


var gateway = braintree.connect({
    environment: conf.braintree.environment,
    merchantId: conf.braintree.merchantId,
    publicKey: conf.braintree.publicKey,
    privateKey: conf.braintree.privateKey
});

let bookingHelper = require('./booking-helper');


// Callback (success, clientToken)
exports.getClientToken = function (callback) {

    gateway.clientToken.generate({}, function (err, response) {

        if (err) {
            callback(false, null);

        } else {
            callback(true, response.clientToken);

        }
    });

};

// Callback (success, customerId Or Error Message, paymentMethodToken)
exports.createCustomerWithPaymentMethod = function (firstName, lastName, nonce, callback) {
    gateway.customer.create({
        firstName: firstName,
        lastName: lastName,
        paymentMethodNonce: nonce
    }, function (err, result) {

        if (result.success) {
            let customerId = result.customer.id;
            let paymentMethodToken = result.customer.paymentMethods[0].token;

            callback(true, customerId, paymentMethodToken);

        } else {
            console.log('Failed:' + JSON.stringify(result));

            callback(false, result.message);
        }

        //result.success;
        //// true
        //
        //result.customer.id;
        //// e.g 160923
        //
        //result.customer.paymentMethods[0].token;
        //// e.g f28wm
    });
};

// Callback (success, paymentMethodToken Or Error Message)
exports.createPaymentMethodTokenForCustomer = function (customerId, nonce, callback) {
    gateway.paymentMethod.create({
        customerId: customerId,
        paymentMethodNonce: nonce
    }, function (err, result) {

        if (result.success) {

            //console.log('Success result: ' + JSON.stringify(result));

            let paymentMethodToken = result.paymentMethod.token;

            callback(true, paymentMethodToken);

        } else {
            console.log('Failed:' + JSON.stringify(result));

            callback(false, result.message);

        }

    });
};


// Callback (success, transactionId)
// Does not submit for settlement, Submit For Settlement will be done when therapists accepted the job
exports.chargeCustomerWithPaymentMethod = function (paymentMethodToken, amount, callback) {

    gateway.transaction.sale({
        paymentMethodToken: paymentMethodToken,
        amount: amount,
        options: {
            submitForSettlement: false
        }
    }, function (err, result) {

        if (!result) {
            callback(false);

            return;
        }

        if (result.success) {

            console.log('Success: ' + JSON.stringify(result));

            let transactionId = result.transaction.id;

            callback(true, transactionId);

        } else {
            console.log('Failed: ' + JSON.stringify(result));

            callback(false);

        }

    });


};

// Callback (success)
exports.submitForSettlementIfNeededForBooking = function(_booking, callback) {

    bookingHelper.bookingWithId(_booking.id, booking => {

        let shouldSubmitForSettlement = true;

        // Check if all Get Swift bookings have been accepted or finished
        booking.bookingdetails.forEach(detail => {

            let status = detail.getswiftdelivery.status;

            if (status != 'accepted' && status != 'finished') {
                console.log('Status is not accepted or finished: ' + status);

                shouldSubmitForSettlement = false;
            }

        });


        if (shouldSubmitForSettlement) {

            gateway.transaction.submitForSettlement(booking.braintreeTransactionId, function (err, result) {
                if (result.success) {
                    // let settledTransaction = result.transaction;

                    booking.update({
                       braintreeSettlementSubmittedAt: new Date()
                    });

                    callback(true);

                } else {
                    console.log('Submit for Settlement errors: ' + JSON.stringify(result.errors));

                    callback(false);

                }
            });

        }


    });

};
