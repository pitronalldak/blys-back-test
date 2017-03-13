/**
 * Created by tingtzechuen on 15/09/2016.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('recipient', {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        mobile: DataTypes.STRING,
        email: DataTypes.STRING,
        gender: DataTypes.ENUM('male', 'female'),
        relationship: DataTypes.ENUM('spouse', 'parent', 'friend', 'colleague', 'guest')
    });
};
