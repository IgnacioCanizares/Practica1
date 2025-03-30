const { check } = require("express-validator")
const validateResults = require("../utils/handleValidator")

const validatorRegister = [
    check("email")
        .exists()
        .notEmpty()
        .isEmail(),
    check("password")
        .exists()
        .notEmpty()
        .isLength({ min: 8 }),
    validateResults
]

const validatorValidateCode = [
    check("code")
        .exists()
        .notEmpty()
        .isLength({ min: 6, max: 6 })
        .isNumeric(),
    validateResults
]

const validatorLogin = [
    check("email")
        .exists()
        .notEmpty()
        .isEmail(),
    check("password")
        .exists()
        .notEmpty(),
    validateResults
]

const validatorOnboarding = [
    check("name")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    check("surname")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    check("nif")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    validateResults
];

const validatorCompany = [
    check("company.name")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    check("company.cif")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    check("company.address")
        .exists()
        .notEmpty()
        .isString()
        .trim(),
    check("company.isAutonomous")
        .optional()
        .isBoolean(),
    validateResults
];

const validatorGetUser = [
    validateResults
];

const validatorPasswordReset = {
    request: [
        check("email")
            .exists()
            .notEmpty()
            .isEmail(),
        validateResults
    ],
    reset: [
        check("email")
            .exists()
            .notEmpty()
            .isEmail(),
        check("code")
            .exists()
            .notEmpty()
            .isLength({ min: 6, max: 6 })
            .isNumeric(),
        check("newPassword")
            .exists()
            .notEmpty()
            .isLength({ min: 8 }),
        validateResults
    ]
};

const validatorInvite = [
    check("email")
        .exists()
        .notEmpty()
        .isEmail(),
    validateResults
];

module.exports = { 
    validatorRegister, 
    validatorValidateCode, 
    validatorLogin, 
    validatorOnboarding,
    validatorCompany,
    validatorGetUser,
    validatorPasswordReset,
    validatorInvite
};