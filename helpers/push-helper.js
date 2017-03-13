/**
 * Created by tingtzechuen on 3/10/2016.
 */
var apn = require('apn');

var options = {
    token: {
        key: __dirname + "/../keys/key.p8",
        keyId: "T32LXKQ2Z9",
        teamId: "3EKG4EBL2B"
    }
};

var apnProvider = new apn.Provider(options);

exports.sendPush = function(token, alert, payload) {

   sendPush(token, alert, payload);

};

function sendPush(token, alert, payload) {
    var note = new apn.Notification();

    //note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 1;
    note.sound = "ping.aiff";
    note.alert = alert;
    if (payload) {
        note.payload = payload;
    }
    note.topic = "au.com.getblys.Blys";

    apnProvider.send(note, token).then( (result) => {
        // see documentation for an explanation of result
        console.log(JSON.stringify(result));
    });
}

exports.sendBookingUpdatedForUser = function(user, alert) {

    sendPush(user.pushToken, alert, {
       "event": "bookingUpdated"
    });

};