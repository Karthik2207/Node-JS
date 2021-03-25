const User = require('../models/user');

const bcrypt =require('bcryptjs');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.isLoggedIn
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {
  const email=req.body.email;
  const password=req.body.password;
  User.findByPk(email)
    .then(user => {
      if(!user){
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
          return res.redirect('/signup');
        }
        return bcrypt.hash(password,12)
        .then(hashedPassword=>{
          return User.create({ email: email, password: hashedPassword});
        })
        .then(result=>{
          console.log(result);
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
