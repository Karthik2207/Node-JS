const express = require('express');

const User = require('../models/user');

const {check,body} = require('express-validator/check')

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login', 
    [
        body('email').isEmail()
        .withMessage('Please enter a valid email')
        ,
    body('password', 'Please enter a password with atleast 5 characters')
    .isLength({min:5})
    ],
    authController.postLogin);

router.post('/signup', 
    [check('email').isEmail().withMessage('Please enter a valid email')
    .custom((value, {req})=>{        
        return User.findByPk(value).then(user=>{
            if(user){
                return Promise.reject('E-mail already exists.');
            }
        });
    }) ,
        body('password', 'Please enter a password with atleast 5 characters')
        .isLength({min:5}),
        body('confirmPassword').custom((value, {req})=>{
            if(value !== req.body.password){
                throw new Error('Passwords need to match');
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;