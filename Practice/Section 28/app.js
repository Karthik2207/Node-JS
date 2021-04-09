const path =require('path');

const Post = require('./models/post');
const User = require('./models/user');

const cors = require('cors');

const express = require('express');
const multer = require('multer');

const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth =require('./middleware/auth');

const app = express();

const { v4: uuidv4 } = require('uuid');

const fileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'images');
  },
  filename: function(req, file, cb) {
      cb(null, uuidv4())
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const sequelize = require('./util/database');
const { Socket } = require('dgram');
app.use(express.json()); 

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method ==='OPTIONS'){
      return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.use('/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    // formatError(err)
    customFormatErrorFn(err){
      if (!err.originalError){
        return err;
      }
      const data=err.originalError.data;
      const message= err.message || 'An error occurred';
      const code= err.originalError.code || 500;
      return {message: message, status:code, data:data};
    }
  })
);

app.use((error, req, res, next)=>{
  console.log(error);
  const status =error.statusCode || 500;
  const message= error.message;
  res.status(status).json({message:message});
});

User.hasMany(Post, {constraints:true, onDelete: 'CASCADE'});

sequelize
  // .sync({ force: true })
  .sync()
  .then(result => {    
      app.listen(8081);
  })
  .catch(err => {
    console.log(err);
  });

