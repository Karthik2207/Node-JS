const crypto=require('crypto');

const User = require('../models/user');
const bcrypt =require('bcryptjs');
const {validationResult}= require('express-validator/check');


exports.getLogin = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message =message[0];
  }
  else message=null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput:{ 
      email:"" , password:""
    },
    validationErrors:[]
  });
};

exports.getSignup = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message =message[0];
  }
  else message=null;
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput:{ 
      email:"" , password:"", confirmPassword:""
    },
    validationErrors:[]
  });
};

exports.postLogin = (req, res, next) => {
  const email=req.body.email;
  const password=req.body.password;

  const errors= validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',         
      errorMessage: errors.array()[0].msg,
      oldInput:{ 
        email:email , password:password
      },
      validationErrors: errors.array()
    });
  }   

  User.findByPk(email)
    .then(user => {
      if(!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',         
          errorMessage: 'Invalid email or password',
          oldInput:{ 
            email:email , password:password
          },
          validationErrors: []
        });
      }
      bcrypt.compare(password,user.password)
      .then(doMatch=>{
        if(doMatch){      //if passwords match
          req.session.isLoggedIn = true;
          req.session.user = user; 
          return req.session.save(err=>{
            console.log(err);
            res.redirect('/');
          });              
        }
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',         
          errorMessage: 'Invalid email or password',
          oldInput:{ 
            email:email , password:password
          },
          validationErrors: []
        });
      }).catch(err=>{
        console.log(err);
        res.redirect('/login');
      })            
    })
    .catch(err => {
      // console.log(err);
      const error =new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email=req.body.email;
    const password=req.body.password;
    const confirmPassword=req.body.confirmPassword;

    const errors= validationResult(req);
    if(!errors.isEmpty()){
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()[0].msg,
        oldInput:{ 
          email:email , password:password, confirmPassword:confirmPassword
        },
        validationErrors: errors.array()
      });
    }    

    bcrypt.hash(password,12)
      .then(hashedPassword=>{
        return User.create({ email: email, password: hashedPassword});
      })
      .then(result=>{
        result.createCart();
        res.redirect('/login');
      })       
      .catch(err => {
        // console.log(err);
        const error =new Error(err);
        error.httpStatusCode =500;
        return next(error);
      });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err=> {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message =message[0];
  }
  else message=null;
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32,(err, buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token=buffer.toString('hex');
    User.findOne({email:req.body.email})
      .then(user=>{
        if(!user){
          req.flash('error','No account with that email found');
          return res.redirect('/reset');
        }
        const resetTokenExpiration= Date.now()+ 3600000; //1hr
        return user.update({resetToken:token, resetTokenExpiration: resetTokenExpiration})
      }).then(result=>{
        console.log("Token",token);
        res.redirect('/')
        //http://localhost:3000/reset/token to reset New Password
      })
      .catch(err => {
        // console.log(err);
        const error =new Error(err);
        error.httpStatusCode =500;
        return next(error);
      });
  });
};

exports.getNewPassword =(req,res,next) => {
  const token=req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()} })
  .then(user=>{
    let message=req.flash('error');
  if(message.length>0){
    message =message[0];
  }
  else message=null;
  res.render('auth/new-password', {
    path: '/new-password',
    pageTitle: 'New Password',
    errorMessage: message,
    email: user.email.toString(),
    passwordToken: token
  });

   })
   .catch(err => {
    // console.log(err);
    const error =new Error(err);
    error.httpStatusCode =500;
    return next(error);
  });  
};

exports.postNewPassword =(req,res,next) => {
  const newPassword= req.body.password;
  const email= req.body.email;
  const passwordToken =req.body.passwordToken;
  let resetUser;
  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()} ,
      email:email})
  .then(user=>{
    resetUser=user;
    return bcrypt.hash(newPassword,12);
  })
  .then(hashedPassword=>{
    return resetUser.update({ password:hashedPassword,
      resetToken:null, 
      resetTokenExpiration: null})
  })
  .then(result=>{
    res.redirect('/login')
  })
  .catch(err => {
    // console.log(err);
    const error =new Error(err);
    error.httpStatusCode =500;
    return next(error);
  });
};