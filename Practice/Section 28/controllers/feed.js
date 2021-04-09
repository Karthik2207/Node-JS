const fs = require('fs');
const path = require('path');

const io =require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const {validationResult}= require('express-validator/check');
const { post } = require('../routes/feed');

const getPagination = (page, size) => {
  const limit = size ? +size : 4;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: posts } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, posts, totalPages, currentPage };
};

exports.getPosts = async (req, res, next) => {    
  const {page} = req.query.page;
  const { limit, offset } = getPagination(page, 4);  
  try{
    const data = await Post.findAndCountAll({limit, offset });    
    const response = getPagingData(data, page, limit);
    res.status(200).json({message: 'Fetched posts sucessfully', 
    posts: response.posts, totalItems: response.totalItems});
  }
  catch (err){
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving tutorials."
    });
  }      
};

exports.createPost = async (req, res, next) => {
  const errors =validationResult(req);
  if(!errors.isEmpty()){
    const error = new Error('Validation failed...');
    error.statusCode= 422;
    throw error;    
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\" ,"/");
  const title = req.body.title;
  const content = req.body.content;
  try{
    const result =await Post.create({title: title, content: content,
      imageUrl: imageUrl, creator: req.userId});
    console.log('Created Product');
    io.getIo().emit('posts',{ action: 'create', post: result});
    const user = await User.findByPk(req.userId);
    res.status(201).json({message: 'Post created successfully!',
      post: {...result, creator: {id: req.userId, name: user.name }}}); 
  }
  catch (err){
    if(!err.statusCode){
      err.statusCode =500;
    }
    next(err);
  }  
};

exports.getPost = async (req, res, next) => {
  const postId =req.params.postId;
  try{
    const post = await Post.findByPk(postId)  
    if(!post){
      const error = new Error('Could not find the post');
      error.statusCode= 404;
      throw error;   
    }
    res.status(200).json({message:'Post fetched ' , post:post});
  }    
  catch(err){
    if(!err.statusCode){
      err.statusCode =500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\","/");
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  try{
    const post = await Post.findByPk(postId);    
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId){
      const error =new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    const result =await post.update({title: title, imageUrl : imageUrl, content : content});          
    io.getIo().emit('posts', {action: 'update', post: result})
    res.status(200).json({ message: 'Post updated!', post: result });
  }  
    catch(err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
};

exports.deletePost= async (req, res, next) => {
  const postId = req.params.postId;
  try{
    const post = await Post.findByPk(postId)    
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString() !== req.userId){
        const error =new Error('Not Authorized!');
        error.statusCode = 403;
        throw error;
      }      
      clearImage(post.imageUrl);
      await post.destroy();      
      console.log('Post deleted!');
      io.getIo().emit('posts', {action: 'delete', post: postId});
      res.status(200).json({ message: 'Post deleted!'});
  }  
    catch(err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};