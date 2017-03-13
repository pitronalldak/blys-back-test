/**
 * Created by tingtzechuen on 9/09/2016.
 */

let userHelper = require('../helpers/user-helper');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {

        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        mobile: DataTypes.STRING,
        gender: DataTypes.ENUM('male', 'female'),
        accessToken: DataTypes.STRING,
        braintreeCustomerId: DataTypes.STRING,
        pushToken: DataTypes.STRING,
        resetPasswordToken: DataTypes.STRING,
        adminAccess: DataTypes.BOOLEAN

    }, {
        hooks: {
            // So it doesn't show password in response
            beforeFind: function (options) {

                if (!options.attributes) {
                    options.attributes = userHelper.getAllAttributesToInclude()
                }

                return options;
            }
        }
    });
};
