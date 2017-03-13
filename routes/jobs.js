/**
 * Created by tingtzechuen on 1/3/17.
 */

const CronJob = require('cron').CronJob;

let models = require('../models');
let Booking = models.Booking;

let bookingHelper = require('../helpers/booking-helper');
let braintreeHelper = require('../helpers/braintree-helper');


function checkForBookingsThatNeedSettlementSubmission() {

    Booking
        .findAll({
            where: {
                braintreeSettlementSubmittedAt: null,
                status: {
                    $in: ['arranged', 'completed']
                }
            }
        })
        .then(bookings => {

            if (bookings) {

                bookings.forEach(booking => {
                    braintreeHelper.submitForSettlementIfNeededForBooking(booking, success => {

                        console.log('Submit for Settlement for booking id ' + booking.id + ' success: ' + success);

                    });
                });

            }

        });

}

// Execute every hour
new CronJob('0 * * * *', function () {

    checkForBookingsThatNeedSettlementSubmission();

}, null, true, 'Australia/Sydney');


checkForBookingsThatNeedSettlementSubmission(); // Run once on deploy