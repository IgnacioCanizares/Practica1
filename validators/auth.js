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

module.exports = { validatorRegister, validatorValidateCode, validatorLogin }