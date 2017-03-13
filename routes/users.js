var express = require('express');
var router = express.Router();

let responseHelper = require('../helpers/response-helper');
let userHelper = require('../helpers/user-helper');
let emailHelper = require('../helpers/email-helper');

let models = require('../models');
let User = models.User;
let Address = models.Address;
let Recipient = models.Recipient;
let Booking = models.Booking;

let db = models.db;

let randomstring = require('randomstring');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', function (req, res) {

    const email = req.body.email;
    var password = req.body.password;

    if (!email) {
        responseHelper.throwError('Please enter your email', res);
        return;
    }

    // No password, generate random password
    if (!password || (password && password.length == 0)) {
        password = randomstring.generate(6);
    }

    console.log('Random password: ' + password);

    User
        .find({
            where: {
                email: email
            }
        })
        .then(function (user) {

            if (user) {
                responseHelper.throwErrorWithStatusCode('This email already exists', 490, res);
                return;
            }

            User
                .create({
                    email: email,
                    password: db.fn('SHA2', [password, 512]),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    gender: req.body.gender,
                    mobile: req.body.mobile
                })
                .then(function (user) {

                    User
                        .find({
                            where: {
                                id: user.id
                            }
                        })
                        .then(function (user) {
                            userHelper.createAccessTokenAndReturnUser(user, function (user) {
                                responseHelper.returnObjectAsJSON(user, res);

                                // Send Email
                                emailHelper.sendWelcomeEmail(user, password);
                            });
                        });


                });

        });

});

router.post('/login', function (req, res) {

    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        responseHelper.throwError('Please enter your email and password', res);

        return;
    }

    User
        .find({
            where: {
                email: email,
                password: db.fn('SHA2', [password, 512])
            }
        })
        .then(function (user) {

            if (user) {
                userHelper.createAccessTokenAndReturnUser(user, function (user) {
                    responseHelper.returnObjectAsJSON(user, res);
                });
            } else {
                responseHelper.throwError('Please make sure you have entered the correct email and password', res);
            }

        });

});

router.put('/me', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        let email = req.body.email;

        if (!email) {
            user.updateAttributes({

                firstName: req.body.firstName,
                lastName: req.body.lastName,
                mobile: req.body.mobile,
                gender: req.body.gender

            })
                .then(function (user) {
                    responseHelper.returnObjectAsJSON(user, res);

                });

            return;
        }

        User
            .find({
                where: {
                    id: {
                        $not: user.id
                    },
                    email: email
                }
            })
            .then(function (existingUser) {

                if (existingUser) {
                    // Email already taken
                    responseHelper.throwError('This email has already been taken!', res);

                } else {
                    user.updateAttributes({

                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        mobile: req.body.mobile,
                        gender: req.body.gender,
                        email: email

                    })
                        .then(function (user) {
                            responseHelper.returnObjectAsJSON(user, res);

                        });
                }

            });


    });

});

// Addresses

function verifyAddressInputWithRequest(req, res) {

    let type = req.body.type;
    let address = req.body.address;
    let suburb = req.body.suburb;
    let postcode = req.body.postcode;

    if (!type || type.length == 0) {
        responseHelper.throwError('Please specify type of address', res);
        return false;
    }

    if (!address || address.length == 0) {
        responseHelper.throwError('Please enter your address', res);
        return false;
    }

    if (!suburb || suburb.length == 0) {
        responseHelper.throwError('Please enter your suburb', res);
        return false;
    }

    if (!postcode || postcode.length == 0) {
        responseHelper.throwError('Please enter your postcode', res);
        return false;
    }

    return true;
}

router.post('/me/addresses', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        if (!verifyAddressInputWithRequest(req, res)) {
            return;
        }

        // Check if address exists first, update if already exist
        Address
            .find({
                where: {
                    userId: user.id,
                    address: req.body.address,
                    suburb: req.body.suburb,
                    postcode: req.body.postcode
                }
            })
            .then(address => {

                if (address) { // Already exist, update!

                    address
                        .update({
                            type: req.body.type,
                            instructions: req.body.instructions
                        })
                        .then(address => {
                            responseHelper.returnObjectAsJSON(address, res);
                        });

                } else { // Doesn't exist, create!

                    Address
                        .create({
                            userId: user.id,
                            type: req.body.type,
                            address: req.body.address,
                            suburb: req.body.suburb,
                            postcode: req.body.postcode,
                            instructions: req.body.instructions
                        })
                        .then(function (address) {
                            responseHelper.returnObjectAsJSON(address, res);

                        });

                }

            });

    });

});

router.put('/me/addresses/:id', (req, res) => {

    userHelper.validateSession(req, res, user => {

        if (!verifyAddressInputWithRequest(req, res)) {
            return;
        }

        let addressId = req.params.id;

        Address
            .find({
                where: {
                    id: addressId,
                    userId: user.id
                }
            })
            .then(address => {

                if (address) {
                    address
                        .update({
                            type: req.body.type,
                            address: req.body.address,
                            suburb: req.body.suburb,
                            postcode: req.body.postcode,
                            instructions: req.body.instructions
                        })
                        .then(address => {
                            responseHelper.returnObjectAsJSON(address, res);
                        });

                } else {
                    responseHelper.throwError('Address not found', res);
                }

            });

    });

});

router.get('/me/addresses', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        Address
            .findAll({
                where: {
                    userId: user.id
                },
                group: ['type', 'address', 'suburb', 'postcode'],
                order: 'updatedAt DESC'
            })
            .then(function (addresses) {
                responseHelper.returnObjectAsJSON(addresses, res);
            });

    });

});

router.get('/me/addresses/last', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        Booking
            .find({
                where: {
                    userId: user.id
                },
                include: [Address],
                order: 'createdAt DESC',
                limit: 1

            })
            .then(function (booking) {

                if (booking) {
                    responseHelper.returnObjectAsJSON(booking.address, res);

                } else {
                    // Fallback
                    Address
                        .findOne({
                            where: {
                                userId: user.id
                            }
                        })
                        .then(function (address) {
                            responseHelper.returnObjectAsJSON(address, res);
                        });

                }

            });

    });


});


router.get('/me', function (req, res) {
    userHelper.validateSession(req, res, function (user) {

        responseHelper.returnObjectAsJSON(user, res);

    });
});

router.get('/:id(\\d+)', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        User
            .find({
                where: {
                    id: req.params.id
                }
            })
            .then(function (user) {
                if (user) {
                    responseHelper.returnObjectAsJSON(user, res);
                } else {
                    responseHelper.throwError('User not found', res);
                }
            });

    });

});

router.get('/email/:email', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        User
            .find({
                where: {
                    email: req.params.email
                }
            })
            .then(function (user) {
                if (user) {
                    responseHelper.returnObjectAsJSON(user, res);
                } else {
                    responseHelper.throwError('User not found', res);
                }
            });

    });

});

function verifyRecipientParametersWithRequest(req, res) {

    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let mobile = req.body.mobile;
    let email = req.body.email;
    let gender = req.body.gender;
    let relationship = req.body.relationship;

    if (!firstName || firstName.length == 0) {
        responseHelper.throwError('Please enter First name', res);
        return false;
    }

    if (!lastName || lastName.length == 0) {
        responseHelper.throwError('Please enter Last name', res);
        return false;
    }

    if (!mobile || mobile.length == 0) {
        responseHelper.throwError('Please provide mobile', res);
        return false;
    }

    if (!email || email.length == 0) {
        responseHelper.throwError('Please provide email', res);
        return false;
    }

    if (!gender || gender.length == 0) {
        responseHelper.throwError('Please provide gender', res);
        return false;
    }

    if (!relationship || relationship.length == 0) {
        responseHelper.throwError('Please provide relationship', res);
        return false;
    }

    return true;
}

router.post('/me/recipients', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        if (!verifyRecipientParametersWithRequest(req, res)) {
            return;
        }

        Recipient
            .create({
                userId: user.id,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                mobile: req.body.mobile,
                email: req.body.email,
                gender: req.body.gender,
                relationship: req.body.relationship
            })
            .then(function (recipient) {
                responseHelper.returnObjectAsJSON(recipient, res);
            });

    });

});

router.get('/me/recipients', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        Recipient
            .findAll({
                where: {
                    userId: user.id
                },
                group: ['firstName', 'lastName', 'mobile', 'email', 'gender', 'relationship'],
                order: 'updatedAt DESC'
            })
            .then(function (recipients) {
                responseHelper.returnObjectAsJSON(recipients, res);
            });

    });

});

router.put('/me/recipients/:id', (req, res) => {

    userHelper.validateSession(req, res, user => {

        if (!verifyRecipientParametersWithRequest(req, res)) {
            return;
        }

        Recipient
            .find({
                where: {
                    id: req.params.id,
                    userId: user.id
                }
            })
            .then(recipient => {

                if (recipient) {
                    recipient
                        .update({
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            mobile: req.body.mobile,
                            email: req.body.email,
                            gender: req.body.gender,
                            relationship: req.body.relationship
                        })
                        .then(recipient => {
                            responseHelper.returnObjectAsJSON(recipient, res);
                        });
                } else {
                    responseHelper.throwError("Recipient not found", res);
                }

            });

    });

});

router.post('/me/push', function (req, res) {

    userHelper.validateSession(req, res, function (user) {

        let token = req.body.token;

        if (!token) {
            responseHelper.throwError('Token not provided', res);
            return;
        }

        user
            .updateAttributes({
                pushToken: token
            })
            .then(function (user) {
                responseHelper.returnObjectAsJSON(user, res);
            });

    });

});


// Initiate Reset Password
router.get('/me/password/reset', (req, res) => {

    let email = req.query.email;

    if (!email) {
        responseHelper.throwError('Please enter your email address!', res);
        return;
    }

    User
        .find({
            where: {
                email: email
            }
        })
        .then(user => {

            if (!user) {
                responseHelper.throwError('Your email is not yet registered with Blys', res);
                return;
            }

            let token = randomstring.generate({
                length: 8,
                charset: 'alphanumeric'
            });

            user.update({
                resetPasswordToken: token
            })
                .then(function () {

                    emailHelper.sendResetPasswordEmail(user, token);

                    responseHelper.returnOkWithoutBody(res);

                });
        });


});

// Reset Password
router.post('/me/password/reset', (req, res) => {

    let email = req.body.email;
    let token = req.body.token;
    let password = req.body.password;

    if (!email) {
        responseHelper.throwError('Please enter your email', res);
        return;
    }

    if (!token) {
        responseHelper.throwError('Token not provided', res);
        return;
    }

    if (!password) {
        responseHelper.throwError('Please enter your new password', res);
        return;
    }

    if (password.length < 6) {
        responseHelper.throwError('Your new password must have at least 6 characters', res);
        return;
    }

    User
        .find({
            where: {
                email: email,
                resetPasswordToken: token
            }
        })
        .then(user => {

            if (!user) {
                responseHelper.throwError('Your reset password is no longer valid. Please request a new one.', res);
                return;
            }

            user
                .update({
                    password: db.fn('SHA2', [password, 512]),
                    resetPasswordToken: null
                })
                .then(function () {

                    responseHelper.returnOkWithoutBody(res);

                });

        });

});

module.exports = router;
