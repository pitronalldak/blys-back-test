/**
 * Created by tingtzechuen on 12/09/2016.
 */


exports.stringRepresentationForSessionType = function (sessionType) {

    switch (sessionType) {

        case 'singles':
            return 'Single';
        case 'couples':
            return 'Couples';
        case 'backtoback':
            return 'Back-to-Back'

    }

};

exports.stringRepresentationForMassageType = function (massageType) {

    switch (massageType) {

        case 'swedish':
            return 'Swedish';
        case 'deeptissue':
            return 'Deep Tissue';
        case 'sports':
            return 'Sports';
        case 'pregnancy':
            return 'Pregnancy';

    }

};

exports.priceForMassageDuration = function (massageDuration) {

    console.log('Massage duration: ' + massageDuration);

    switch (parseInt(massageDuration)) {

        case 60:
            return 99.00;
        case 90:
            return 139.00;
        case 120:
            return 169.00;


    }

};

// For Get Swift, Prefer male/female = Either
exports.stringRepresentationForGenderPreferenceForGetSwift = function (genderPreference) {

    switch (genderPreference) {
        // Show 'Either' for all these 3 options
        case 'dont_care':
        case 'prefer_female':
        case 'prefer_male':
            return "Either";

        case 'female_only':
            return "Female only";

        case 'male_only':
            return "Male only";
    }

};

exports.stringRepresentationForGenderPreference = function (genderPreference) {

    switch (genderPreference) {
        case 'dont_care':
            return "Don't care - I just want a good massage";
        case 'prefer_female':
            return "Prefer Female, but I don't mind";
        case 'prefer_male':
            return "Prefer Male, but I don't mind";
        case 'female_only':
            return "Female only";
        case 'male_only':
            return "Male only";
    }

};

exports.stringRepresentationForMassageFor = function (massageFor) {

    switch (massageFor) {
        case 'myself':
            return "Myself";
        
        case 'someone_else':
            return "Someone else";
    }

};

exports.stringRepresentationForTypeOfLocation = function (typeOfLocation) {

    switch (typeOfLocation) {
        case 'home':
            return "Home";
        case 'hotel':
            return "Hotel";
        case 'office':
            return "Office";
        case 'other':
            return "Other";
    }

};

exports.stringRepresentationForGender = function (gender) {

    switch (gender) {
        case 'male': return "Male";
        case 'female': return "Female";
    }
    
};