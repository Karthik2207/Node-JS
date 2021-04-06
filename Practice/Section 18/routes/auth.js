const express = require('express');

const User = require('../models/user');

const {check,body} = require('express-validator/check')

const {getLogin,getSignup,postLogin,postSignup,
    postLogout,getReset, postReset,getNewPassword , postNewPassword} = require('../controllers/auth');

const router = express.Router();

router.get('/login', getLogin);

router.get('/signup', getSignup);

router.post('/login', 
    [
        body('email').isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password', 'Please enter a password with atleast 5 characters')
    .isLength({min:5}).trim()
    ],
    postLogin);

router.post('/signup', 
    [check('email').isEmail().withMessage('Please enter a valid email')
    .custom((value, {req})=>{        
        return User.findByPk(value).then(user=>{
            if(user){
                return Promise.reject('E-mail already exists.');
            }
        });
    }).normalizeEmail() ,
        body('password', 'Please enter a password with atleast 5 characters')
        .isLength({min:5}).trim(),
        body('confirmPassword').trim().custom((value, {req})=>{
            if(value !== req.body.password){
                throw new Error('Passwords need to match');
            }
            return true;
        })
    ],
    postSignup);

router.post('/logout', postLogout);

router.get('/reset', getReset);

router.post('/reset', postReset);

router.get('/reset/:token', getNewPassword);

router.post('/new-password', postNewPassword);

module.exports = router;