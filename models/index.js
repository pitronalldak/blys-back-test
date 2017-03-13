/**
 * Created by tingtzechuen on 9/09/2016.
 */

const Config = require('../config/config');
const conf = new Config();

// Sequelize setup
var Sequelize;

Sequelize = require('sequelize');

var sequelize;

// Connection
// var environment = process.env.NODE_ENV || 'development';

var db_name = 'blys';
var db_user = 'blys';
var db_password = '4E819B9C-56D9-4CA7-A62F-D00AF5E255E1';

var host = conf.db.host;
var port = 3306;

sequelize = new Sequelize(db_name, db_user, db_password, {
    host: host,
    port: port,
    dialect: 'mariadb'
});

sequelize
    .authenticate()
    .then(function(err) {
        if (!!err) {
            console.log('Unable to connect to the database:', err);
            console.log('Name: ' + db_name);
            console.log('User: ' + db_user);
            console.log('Password: ' + db_password);
            console.log('Host: ' + host);
            console.log('Port: ' + port);
        } else {
            console.log('Host: ' + host);
            console.log('Connection has been established successfully.')
        }
    });

// Models
var models = [

    'User',
    'Address',
    'PaymentMethod',
    'Booking',
    'BookingDetail',
    'GetSwiftDelivery',
    'Recipient'

];

models.forEach(function(model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// Relationships
(function(m) {

    m.User.hasMany(m.Address);
    m.User.hasMany(m.PaymentMethod);

    m.User.hasMany(m.Booking);
    m.Booking.belongsTo(m.User);

    m.PaymentMethod.hasMany(m.Booking);
    m.Booking.belongsTo(m.PaymentMethod);

    m.Address.hasMany(m.Booking);
    m.Booking.belongsTo(m.Address);

    //m.Booking.hasMany(m.GetSwiftDelivery);
    //m.GetSwiftDelivery.belongsTo(m.Booking);

    m.BookingDetail.hasOne(m.GetSwiftDelivery);
    m.GetSwiftDelivery.belongsTo(m.BookingDetail);

    m.Recipient.hasMany(m.Booking);
    m.Booking.belongsTo(m.Recipient);

    m.User.hasMany(m.Recipient);
    m.Recipient.belongsTo(m.User);

    m.Booking.hasMany(m.BookingDetail);
    m.BookingDetail.belongsTo(m.Booking);

})(module.exports);

module.exports.db = sequelize;
