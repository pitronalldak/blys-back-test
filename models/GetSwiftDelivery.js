/**
 * Created by tingtzechuen on 12/09/2016.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('getswiftdelivery', {
        jobIdentifier: DataTypes.STRING,
        status: DataTypes.ENUM('new', 'accepted', 'finished', 'cancelled'),
        driverName: DataTypes.STRING,
        driverIdentifier: DataTypes.STRING
    });
};
