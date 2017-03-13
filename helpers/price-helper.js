/**
 * Created by tingtzechuen on 21/09/2016.
 */

let optionsHelper = require('./options-helper');

exports.priceFor = function(massageDuration, sessionType, typeOfLocation) {

    var price = optionsHelper.priceForMassageDuration(massageDuration);

    // For Couples and Back-to-Back, charge 2x
    if (sessionType == 'couples' || sessionType == 'backtoback') {
        price = price * 2;
    }

    // If hotel, add $20 surcharge
    if (typeOfLocation == 'hotel') {
        price = price + 20;
    }

    return price;

};

exports.priceForBooking = function(booking) {
    return this.priceFor(booking.massageDuration, booking.sessionType, booking.address.type);
};