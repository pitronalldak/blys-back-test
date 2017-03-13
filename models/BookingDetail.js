/**
 * Created by tingtzechuen on 20/09/2016.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('bookingdetail', {
        massageType: DataTypes.ENUM('swedish', 'deeptissue', 'sports', 'pregnancy'),
        genderPreference: DataTypes.ENUM('dont_care', 'prefer_female', 'prefer_male', 'female_only', 'male_only'),
    });
};
