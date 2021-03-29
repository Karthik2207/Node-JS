const crypto=require('crypto');

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
      .catch(err=>{
        console.log(err);
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
  .catch(err=>{
    console.log(err);
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
  .catch(err=>{
    console.log(err);
  });

};