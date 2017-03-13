/**
 * Created by tingtzechuen on 11/09/2016.
 */
/*
 CREATE TABLE `bookings` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `userId` int(11) DEFAULT '0',
 `paymentMethodId` int(11) DEFAULT '0',
 `sessionType` enum('singles','couples','backtoback') DEFAULT NULL,
 `massageType` enum('swedish','deeptissue','sports','pregnancy') DEFAULT NULL,
 `massageDuration` int(11) DEFAULT '0',
 `genderPreference` enum('dont_care','prefer_female','prefer_male','female_only','male_only') DEFAULT NULL,
 `specialInstructions` varchar(1024) DEFAULT NULL,
 `date` datetime DEFAULT NULL,
 `earliestTime` int(11) DEFAULT '0',
 `latestTime` int(11) DEFAULT '0',
 `createdAt` datetime DEFAULT NULL,
 `updatedAt` datetime DEFAULT NULL,
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('booking', {
        braintreeTransactionId: DataTypes.STRING,
        braintreeSettlementSubmittedAt: DataTypes.DATE,
        sessionType: DataTypes.ENUM('singles', 'couples', 'backtoback'),
        massageDuration: DataTypes.INTEGER,
        specialInstructions: DataTypes.STRING,
        earliestTime: DataTypes.DATE,
        latestTime: DataTypes.DATE,
        status: DataTypes.ENUM('new', 'arranged', 'completed', 'cancelled'),
        massageFor: DataTypes.ENUM('myself', 'someone_else'),
        timezone: DataTypes.STRING
    });
};
