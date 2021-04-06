const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

const {validationResult}= require('express-validator/check');

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: posts } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, posts, totalPages, currentPage };
};

exports.getPosts = (req, res, next) => {  
  // Post.findAll()
  // .then(posts=>{
  //   res.status(200).json({
  //     message: 'Fetched posts successfully!',post: posts});
  // })
  // .catch(err => {
  //   if(!err.statusCode){
  //     err.statusCode =500;
  //   }
  //   next(err);
  // });
  const {page} = req.query.page;
  const { limit, offset } = getPagination(page, 3);
  
  Post.findAndCountAll({limit, offset })
    .then(data => {
      const response = getPagingData(data, page, limit);
      res.status(200).json({message: 'Fetched posts sucessfully', 
      posts: response.posts, totalItems: response.totalItems});
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials."
      });
    }); 
};

exports.createPost = (req, res, next) => {
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
  // Create post in db
  Post.create({
    title: title, 
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  })
  .then(result => {
    console.log('Created Product');
    res.status(201).json({
      message: 'Post created successfully!',
      post: result
    });
  })
  .catch(err => {
    if(!err.statusCode){
      err.statusCode =500;
    }
    next(err);
  });
  
};

exports.getPost = (req, res, next) => {
  const postId =req.params.postId;
  Post.findByPk(postId)
  .then(post =>{
    if(!post){
      const error = new Error('Could not find the post');
      error.statusCode= 404;
      throw error;   
    }
    res.status(200).json({message:'Post fetched ' , post:post});
  })
  .catch(err => {
    if(!err.statusCode){
      err.statusCode =500;
    }
    next(err);
  });
};

exports.updatePost = (req, res, next) => {
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
  Post.findByPk(postId)
    .then(post => {
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
      return post.update({title: title, imageUrl : imageUrl, content : content});      
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost= (req, res, next) => {
  const postId = req.params.postId;
  Post.findByPk(postId)
    .then(post => {
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
      return post.destroy();      
    })
    .then(result => {
      console.log('Post deleted!');
      res.status(200).json({ message: 'Post deleted!'});
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};