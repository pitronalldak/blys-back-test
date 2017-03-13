/**
 * Created by tingtzechuen on 11/09/2016.
 */

var braintree = require("braintree");


module.exports = function() {
    switch (process.env.NODE_ENV) {
        case 'production':
            return {
                braintree: {
                    environment: braintree.Environment.Production,
                    merchantId: "z29tyrdhkt94hg2b",
                    publicKey: "szgyydvxz5k7bc24",
                    privateKey: "103afea27083e7de9d2c8528f0965831"
                },
                getswift: {
                    apiKey: "c67dedfe-2149-4e49-a794-d83ad75e1b41", // This is the real API Key
                    // apiKey: "8ccdaf75-5fa5-487c-9289-dbbfdd0a5e49", // This is the Test Merchant API Key
                    baseUrl: "https://app.getswift.co/api/v2/"
                },
                db: {
                    host: 'api.getblys.com.au'
                }
            };

        case 'staging': // Braintree and GetSwift should be same as Dev
            return {
                braintree: {
                    environment: braintree.Environment.Sandbox,
                    merchantId: "72zkvn8rfvpy8rdv",
                    publicKey: "rnq6shj493g2sm75",
                    privateKey: "4b83ae662ec46506f6d5b88bf120fed7"
                },
                getswift: {
                    apiKey: "e68ec5d5-ae26-4624-afde-8d236aecdf6a",
                    baseUrl: "https://dev.getswift.co/api/v2/"
                },
                db: {
                    host: 'staging.getblys.com.au'
                }
            };

        default: // Development
            return {
                braintree: {
                    environment: braintree.Environment.Sandbox,
                    merchantId: "72zkvn8rfvpy8rdv",
                    publicKey: "rnq6shj493g2sm75",
                    privateKey: "4b83ae662ec46506f6d5b88bf120fed7"
                },
                getswift: {
                    apiKey: "e68ec5d5-ae26-4624-afde-8d236aecdf6a",
                    baseUrl: "https://dev.getswift.co/api/v2/"
                },
                db: {
                    host: 'localhost'
                }
            };
    }
};