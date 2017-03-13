/**
 * Created by tingtzechuen on 12/09/2016.
 */

const Config = require('../config/config');
const conf = new Config();

let request = require('request');
let moment = require('moment');
let async = require('async');

let models = require('../models');
let User = models.User;
let PaymentMethod = models.PaymentMethod;
let Booking = models.Booking;
let Address = models.Address;
let GetSwiftDelivery = models.GetSwiftDelivery;
let Recipient = models.Recipient;
let BookingDetail = models.BookingDetail;

let optionsHelper = require('./options-helper');
let bookingHelper = require('./booking-helper');

// Callback(success, jobIdentifier Or Error)
exports.createDelivery = function (booking, bookingDetail, callback) {

    Booking
        .find({
            where: {
                id: booking.id
            },
            include: [User, PaymentMethod, Address, Recipient, BookingDetail]
        })
        .then(function (booking) {

            let url = conf.getswift.baseUrl + "deliveries";

            let fullAddress = `${booking.address.address} ${booking.address.suburb} ${booking.address.postcode}`;
            let deliveryInstructions = compileInstructionsWithBookingAndBookingDetail(booking, bookingDetail);

            console.log('fullAddress: ' + fullAddress);

            var name = '';
            var phone = '';
            var email = '';

            let firstBookingDetail = booking.bookingdetails[0];


            if (booking.massageFor == 'myself') { // For myself

                if (firstBookingDetail.id == bookingDetail.id && booking.sessionType == 'couples') {
                    name = `${booking.user.firstName} ${booking.user.lastName}`;
                    phone = '0433 006 236';
                    email = 'ilter@getblys.com';

                } else {
                    name = `${booking.user.firstName} ${booking.user.lastName}`;
                    phone = `${booking.user.mobile}`;
                    email = `${booking.user.email}`;

                }

            } else { // For Someone Else

                if (firstBookingDetail.id == bookingDetail.id && booking.sessionType == 'couples') {

                    // Intended behaviour requested by Ilter to have his phone number and email in one of the GetSwift bookings
                    name = `${booking.recipient.firstName} ${booking.recipient.lastName}`;
                    phone = '0433 006 236';
                    email = 'ilter@getblys.com';

                } else {

                    name = `${booking.recipient.firstName} ${booking.recipient.lastName}`;
                    phone = `${booking.recipient.mobile}`;
                    email = `${booking.recipient.email}`;

                }
            }


            let massageDurationString = booking.massageDuration + 'min';
            let massageTypeString = optionsHelper.stringRepresentationForMassageType(bookingDetail.massageType);
            let sessionTypeString = optionsHelper.stringRepresentationForSessionType(booking.sessionType);

            var price = optionsHelper.priceForMassageDuration(booking.massageDuration);

            if (booking.sessionType == 'backtoback') { // Double the price if it's back to back
                price *= 2;
            }

            let pickupAndDropoffDetail = {
                address: fullAddress,
                name: name,
                phone: phone,
                email: email,
                description: compileBookingDescription(booking)
            };

            let dropoffWindow = {
                earliestTime: booking.earliestTime,
                latestTime: booking.latestTime
            };

            let data = {
                apiKey: conf.getswift.apiKey,
                booking: {

                    items: [
                        {
                            quantity: 1,
                            description: `${massageDurationString} - ${massageTypeString} - ${sessionTypeString}`,
                            price: price
                        }
                    ],
                    pickupTime: new Date(), // Have to provide pick up time so it's available right away
                    pickupDetail: pickupAndDropoffDetail, // Need to duplicate the drop off details so the API works
                    dropoffDetail: pickupAndDropoffDetail,
                    dropoffWindow: dropoffWindow,
                    deliveryInstructions: deliveryInstructions

                }
            };

            console.log('Data: ' + JSON.stringify(data));

            request.post({
                url: url,
                method: "POST",
                json: data
            }, function (err, response, body) {

                console.log('Response: ' + JSON.stringify(response));

                if (err) {
                    callback(false, err);
                    return;
                }

                if (response.statusCode >= 400) {

                    let error = body.message;

                    callback(false, error);

                    return;
                }
                //
                //console.log('Response: ' + JSON.stringify(response));
                //console.log('GetSwift Body: ' + JSON.stringify(body));


                let jobIdentifier = body.delivery.id;


                GetSwiftDelivery
                    .create({
                        bookingdetailId: bookingDetail.id,
                        jobIdentifier: jobIdentifier
                    })
                    .then(function (getSwiftDelivery) {
                        callback(true, jobIdentifier);
                    });

            });

        });

};

function compileInstructionsWithBookingAndBookingDetail(booking, detail) {

    let genderPreferenceString = optionsHelper.stringRepresentationForGenderPreferenceForGetSwift(detail.genderPreference);
    let massageForString = optionsHelper.stringRepresentationForMassageFor(booking.massageFor);

    var yourGenderString = '';

    if (booking.massageFor == 'myself') {
        yourGenderString = booking.user.gender;
    } else {
        yourGenderString = booking.recipient.gender;
    }

    let typeOfLocationString = optionsHelper.stringRepresentationForTypeOfLocation(booking.address.type);

    // TODO: Do you have stairs?

    return `Therapist Gender Preference\n${genderPreferenceString}\n\n` +
        `This massage is for...\n${massageForString}\n\n` +
        `Recipient's Gender\n${yourGenderString}\n\n` +
        `Special Instructions\n${booking.specialInstructions}\n\n` +
        `Type of Location\n${typeOfLocationString}\n\n` +
        `Parking Instructions\n${booking.address.instructions}\n\n`;

}

// Only used to calculate for character counters for instructions
exports.compileInstructionsWithDetails = function (genderPreference, massageFor, gender) {

    let genderPreferenceString = optionsHelper.stringRepresentationForGenderPreferenceForGetSwift(genderPreference);
    let massageForString = optionsHelper.stringRepresentationForMassageFor(massageFor);

    let instructions = `Therapist Gender Preference\n${genderPreferenceString}\n\n` +
        `This massage is for...\n${massageForString}\n\n` +
        `Recipient's Gender\n${gender}\n\n` +
        `Special Instructions\n\n\n` +
        `Type of Location\nOffice\n\n` +
        `Parking Instructions\n\n\n`;

    console.log('instructions: ' + instructions);

    return instructions;

};

function compileBookingDescription(booking) {

    let earliestTimeMoment = moment(booking.earliestTime);
    let latestTimeMoment = moment(booking.latestTime);

    var string = earliestTimeMoment.tz(booking.timezone).format('dddd, MMM D @ h:mma - ');
    string += latestTimeMoment.tz(booking.timezone).format('h:mma');

    return string;
}

// Callback (success)
exports.cancelDeliveriesForBooking = function (booking, admin, callback) {

    let getswiftJobIdentifiers = [];

    booking.bookingdetails.forEach(detail => {
        getswiftJobIdentifiers.push(detail.getswiftdelivery.jobIdentifier);
    });

    let url = conf.getswift.baseUrl + "deliveries/cancel";
    let cancellationNotes = "Cancelled by " + admin.firstName + " " + admin.lastName + " (" + admin.email + ")";

    let parallels = [];

    getswiftJobIdentifiers.forEach(jobIdentifier => {

        let data = {
            apiKey: conf.getswift.apiKey,
            jobId: jobIdentifier,
            cancellationNotes: cancellationNotes
        };

        parallels.push(
            function (callback) {
                request.post({
                    url: url,
                    method: "POST",
                    json: data
                }, function (err, response, body) {

                    if (err) {
                        callback(null, false);
                        return;
                    }

                    if (response.statusCode == 200) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }

                });
            }
        );

    });

    let allCancellationSuccessful = true;

    async.parallel(parallels, (err, results) => {

        results.forEach(result => {
            if (!result) {
                allCancellationSuccessful = false;
            }
        });

        callback(allCancellationSuccessful);

    });

};