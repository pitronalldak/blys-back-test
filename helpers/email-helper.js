/**
 * Created by tingtzechuen on 29/09/2016.
 */

let api_key = 'key-7b87376128a1e67dcef1b84dcc36207c';
let domain = 'mg.getblys.com.au';
let mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
let request = require('request');
let moment = require('moment');

const from = "The Blys Team <hello@getblys.com.au>";


const fs = require('fs');
const path = require('path');

const optionsHelper = require('./options-helper');
const priceHelper = require('./price-helper');

exports.sendWelcomeEmail = function (user, password) {

    let firstName = user.firstName;

    const filePath = path.join(__dirname, '../email-templates/welcome');

    fs.readFile(filePath, 'utf8', function (err, data) {

        if (err) {
            console.log('Error: ' + err);
        } else {
            console.log('Data: ' + data);

            const text = data
                .replace(/{{password}}/g, password);

            let email = {
                from: from,
                to: user.email,
                subject: 'Welcome to Blys',
                text: text
            };

            mailgun.messages().send(email, function (error, body) {

                if (error) {
                    console.log('Mailgun error ' + error);
                } else {
                    console.log('Mailgun success: ' + JSON.stringify(body));
                }

            });
        }

    });

};

exports.sendBookingConfirmationEmail = function (booking) {

    const filePath = path.join(__dirname, '../email-templates/booking-confirmation');

    fs.readFile(filePath, 'utf8', function (err, data) {

        if (err) {
            console.log('Error: ' + err);
        } else {
            //console.log('Data: ' + data);

            let bookingDescription = compileBookingDescriptionForConfirmationEmail(booking);
            let priceDescription = "$" + priceHelper.priceForBooking(booking);

            let paymentMethodDescription;

            if (booking.paymentmethod.type == 'paypal') {
                paymentMethodDescription = "PayPal: " + booking.paymentmethod.email;
            } else {
                paymentMethodDescription = booking.paymentmethod.cardType + " ending in " + booking.paymentmethod.last4;
            }

            let emailAddress = booking.user.email;
            let mobile = booking.user.mobile;

            let html = data
                .replace(/{{bookingDescription}}/g, bookingDescription)
                .replace(/{{bookingPrice}}/g, priceDescription)
                .replace(/{{paymentMethod}}/g, paymentMethodDescription)
                .replace(/{{total}}/g, priceDescription)
                .replace(/{{email}}/g, emailAddress)
                .replace(/{{mobile}}/g, mobile);


            let bcc = process.env.NODE_ENV == 'production' ? 'bookings@getblys.com.au' : 'tzechuen.ting@gmail.com';

            let bookingDateMoment = moment(booking.earliestTime);

            let bookingDateString = bookingDateMoment.tz(booking.timezone).format('dddd, MMM Do');

            let subject = 'Blys | Your Booking for ' + bookingDateString;

            let email = {
                from: from,
                to: booking.user.email,
                bcc: bcc,
                subject: subject,
                html: html
            };

            mailgun.messages().send(email, function (error, body) {

                if (error) {
                    console.log('Mailgun error ' + error);
                } else {
                    console.log('Mailgun success: ' + JSON.stringify(body));
                }

            });
        }

    });


};


function compileBookingDescriptionForConfirmationEmail(booking) {


    let firstBookingDetails = booking.bookingdetails[0];
    let secondBookingDetails = booking.bookingdetails[1];

    var result = "Session Type: ";

    result += optionsHelper.stringRepresentationForSessionType(booking.sessionType) + "<br>";

    var price = optionsHelper.priceForMassageDuration(booking.massageDuration);

    if (booking.sessionType == 'backtoback') {
        price *= 2;
    }

    result += "Massage Length: " + booking.massageDuration + "min ($" + price + ")<br>";

    result += secondBookingDetails != undefined ? "Massage 1 - Massage Type: " : "Massage Type: ";
    result += optionsHelper.stringRepresentationForMassageType(firstBookingDetails.massageType) + "<br>";

    result += secondBookingDetails != undefined ? "Massage 1 - Therapist Gender Preference: " : "Therapist Gender Preference: ";
    result += optionsHelper.stringRepresentationForGenderPreference(firstBookingDetails.genderPreference) + "<br>";

    if (secondBookingDetails) {
        result += "Massage 2 - Massage Type: " + optionsHelper.stringRepresentationForMassageType(secondBookingDetails.massageType) + "<br>";
        result += "Massage 2 - Therapist Gender Preference: " + optionsHelper.stringRepresentationForGenderPreference(secondBookingDetails.genderPreference) + "<br>";
    }

    if (booking.massageFor == 'myself') {

        result += "Your Name: " + booking.user.firstName + " " + booking.user.lastName + "<br>";
        result += "Your Mobile: " + booking.user.mobile + "<br>";
        result += "Your Email: " + booking.user.email + "<br>";

    } else {

        result += "Recipient's Name: " + booking.recipient.firstName + " " + booking.recipient.lastName + "<br>";
        result += "Recipient's Mobile: " + booking.recipient.mobile + "<br>";
        result += "Recipient's Email: " + booking.recipient.email + "<br>";

    }

    result += "This massage is for...: " + optionsHelper.stringRepresentationForMassageFor(booking.massageFor) + "<br>";
    result += "Your Gender: " + optionsHelper.stringRepresentationForGender(booking.user.gender) + "<br>";
    result += "Special Instructions: " + booking.specialInstructions + "<br>";
    result += "Location Type: " + optionsHelper.stringRepresentationForTypeOfLocation(booking.address.type) + "<br>";
    result += "Address: " + booking.address.address + ", " + booking.address.suburb + "<br>";
    result += "Parking Instructions: " + booking.address.instructions + "<br>";

    let earliestTimeMoment = moment(booking.earliestTime);
    let latestTimeMoment = moment(booking.latestTime);

    let bookingDate = earliestTimeMoment.tz(booking.timezone).format('DD/MM/YYYY');
    let earliestTimeString = earliestTimeMoment.tz(booking.timezone).format('h:mma');
    let latestTimeString = latestTimeMoment.tz(booking.timezone).format('h:mma');

    result += "Booking Date: " + bookingDate + "<br>";

    if (booking.sessionType == 'couples') {
        result += "Time: " + earliestTimeString + "<br>";
    } else {
        result += "Earliest I can do is...: " + earliestTimeString + "<br>";
        result += "Latest I can do is...: " + latestTimeString + "<br>";
    }

    return result;

}

exports.sendResetPasswordEmail = function (user, token) {

    let filePath = path.join(__dirname, '../email-templates/reset-password');

    fs.readFile(filePath, 'utf8', function (err, data) {

        if (err) {
            console.log('Error: ' + err);
        } else {
            console.log('Data: ' + data);

            let link = 'blys://resetPassword?email=' + user.email + '&token=' + token;

            let html = data
                .replace(/{{link}}/g, link);

            let email = {
                from: from,
                to: user.email,
                subject: 'Reset Password',
                html: html
            };

            mailgun.messages().send(email, function (error, body) {

                if (error) {
                    console.log('Mailgun error ' + error);
                } else {
                    console.log('Mailgun success: ' + JSON.stringify(body));
                }

            });

        }

    });

};