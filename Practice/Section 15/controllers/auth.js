const User = require('../models/user');
const bcrypt =require('bcryptjs');

exports.getLogin = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message =message[0];
  }
  else message=null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
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
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email=req.body.email;
  const password=req.body.password;
  User.findByPk(email)
    .then(user => {
      if(!user){
        req.flash('error','Invalid email or password');
        return res.redirect('/login');
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
        req.flash('error','Invalid email or password');
        res.redirect('/login');
      }).catch(err=>{
        console.log(err);
        res.redirect('/login');
      })            
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email=req.body.email;
    const password=req.body.password;
    const confirmPassword=req.body.confirmPassword;    
    User.findByPk(email)
      .then(user=>{
        if(user){
          req.flash('error','Email exists Already');
          return res.redirect('/signup');
        }
        return bcrypt.hash(password,12)
        .then(hashedPassword=>{
          return User.create({ email: email, password: hashedPassword});
        })
        .then(result=>{
          result.createCart();
          res.redirect('/login');
        });        
    })    
    .catch(err=>{
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err=> {
    console.log(err);
    res.redirect('/');
  });
};
