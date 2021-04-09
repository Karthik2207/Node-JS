const bcrypt = require('bcryptjs');
const validator =require('validator');
const User = require('../models/user');
const Post = require('../models/post');
const jwt = require('jsonwebtoken');

module.exports = {
  createUser: async function({ userInput }, req) {
    const errors=[];
    if(!validator.isEmail(userInput.email)){
      errors.push({message: 'Email is invalid.'});
    }
    if(validator.isEmpty(userInput.password) || 
      !validator.isLength(userInput.password, {min: 5})){
        errors.push({message: 'Password must have atleast 5 characters.'});
      }
    if(errors.length >0){
      const error = new Error('Invalid Input');
      error.data =errors;
      error.code=422;
      throw error;
    }
    const existingUser = await User.findOne({where: {email: userInput.email}});
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const createdUser= await User.create({email: userInput.email,
      name: userInput.name, password: hashedPw});        
    // return { ...createdUser._doc, id: createdUser.id.toString() };
    return  createdUser;
  },

  login: async function({email, password}){
    const user = await User.findOne({where: {email:email}});
    if (!user) {
      const error = new Error('User not found.');
      error.code=401;      
      throw error;
    }
  const isEqual = await bcrypt.compare(password, user.password);
  if (!isEqual) {
    const error = new Error('Wrong password!');
    error.statusCode = 401;
    throw error;
  }
  const token = jwt.sign({email: email, userId: user.id.toString()},
    'somesupersecretsecret',{ expiresIn: '1h' });
    console.log("Token-------",token);
    return {token: token, userId: user.id.toString()};
  },

  createPost: async function({postInput}, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const errors=[];
    if(validator.isEmpty(postInput.title) || 
      !validator.isLength(postInput.title, {min: 5})){
        errors.push({message: 'Title is invalid.'});
      }
    if(validator.isEmpty(postInput.content) || 
    !validator.isLength(postInput.content, {min: 5})){
      errors.push({message: 'Content is invalid.'});
    }
    if(errors.length >0){
      const error = new Error('Invalid Input');
      error.data =errors;
      error.code=422;
      throw error;
    }
    const result =await Post.create({title: postInput.title, content: postInput.content,
      imageUrl: postInput.imageUrl, creator: req.userId});
    return result;
  },
  
  posts: async function({page}, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    if(!page){
      page=1;
    }
    // const totalPosts = await Post.find().countDocuments(); order: [obToArray]
    const perPage=4;
    // {offset: (pageNo-1)*perPage, limit:3}
    const posts = await Post.findAll();
    return {posts, totalPosts:4};
  },

  post: async function({id},req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const post = await Post.findByPk(id);
    if(!post){
      const error = new Error('No post found.');
      error.code=404;      
      throw error;
    }
    return post;
  },

  updatePost: async function({id, postInput}, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const post = await Post.findByPk(id);
    if(!post){
      const error = new Error('No post found.');
      error.code=404;      
      throw error;
    }
    if(post.creator !==req.userId.toString()){
      const error = new Error('Not Authorized to edit.');
      error.code=403;      
      throw error;
    }
    const errors=[];
    if(validator.isEmpty(postInput.title) || 
      !validator.isLength(postInput.title, {min: 5})){
        errors.push({message: 'Title is invalid.'});
      }
    if(validator.isEmpty(postInput.content) || 
    !validator.isLength(postInput.content, {min: 5})){
      errors.push({message: 'Content is invalid.'});
    }
    if(errors.length >0){
      const error = new Error('Invalid Input');
      error.data =errors;
      error.code=422;
      throw error;
    }
    const updatedPost =await post.update({title: postInput.title, 
      imageUrl : postInput.imageUrl, content : postInput.content});
    return updatedPost;
  },

  deletePost: async function({id}, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const post = await Post.findByPk(id);
    if(!post){
      const error = new Error('No post found.');
      error.code=404;      
      throw error;
    }
    if(post.creator !==req.userId.toString()){
      const error = new Error('Not Authorized to edit.');
      error.code=403;      
      throw error;
    }
    await post.destroy();
    return true;
  },

  user: async function(args, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const user = await User.findOne({where: {id: req.userId}});
    if (!user) {
      const error = new Error('No User found!');
      error.code= 404;
      throw error;
    }
    return user;
  },

  updateStatus: async function({status}, req){
    if(!req.isAuth){
      const error = new Error('Not Authenticated.');
      error.code=401;      
      throw error;
    }
    const user = await User.findOne({where: {id: req.userId}});
    if (!user) {
      const error = new Error('No User found!');
      error.code= 404;
      throw error;
    }    
    const updatedUser =await user.update({status:status});
    return updatedUser;
  }
};
