/**
 * Created by tingtzechuen on 9/09/2016.
 */


module.exports = function (sequelize, DataTypes) {
    return sequelize.define('address', {
        type: DataTypes.ENUM('home', 'hotel', 'office', 'other'),
        address: DataTypes.STRING,
        suburb: DataTypes.STRING,
        postcode: DataTypes.STRING,
        instructions: DataTypes.STRING
    });
};
