/**
 * Created by tingtzechuen on 1/3/17.
 */


let models = require('../models');

let Booking = models.Booking;
let User = models.User;
let PaymentMethod = models.PaymentMethod;
let Address = models.Address;
let Recipient = models.Recipient;
let BookingDetail = models.BookingDetail;
let GetSwiftDelivery = models.GetSwiftDelivery;

let userHelper = require('../helpers/user-helper');

function bookingWithId(id, callback) {
    Booking
        .find({
            where: {
                id: id
            },
            include: getAllIncludes()
        })
        .then(function (booking) {
            callback(booking);
        });
}

exports.bookingWithId = function (id, callback) {
    bookingWithId(id, callback);
};

exports.getAllIncludes = function() {
   return getAllIncludes();
};

function getAllIncludes() {
    return [{
        model: User,
        attributes: userHelper.getAllAttributesToInclude()
    }, PaymentMethod, Address, Recipient, {
        model: BookingDetail,
        include: [GetSwiftDelivery]
    }];
}