/**
 * Created by tingtzechuen on 10/09/2016.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('paymentmethod', {
        braintreePaymentMethodToken: DataTypes.STRING,
        last4: DataTypes.STRING,
        expiryMonth: DataTypes.STRING,
        expiryYear: DataTypes.STRING,
        email: DataTypes.STRING,
        type: DataTypes.ENUM('card', 'paypal'),
        cardType: DataTypes.STRING
    });
};
