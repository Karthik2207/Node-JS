const path = require('path');
const fs= require('fs');

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const csrf=require('csurf');
const csrfProtection= csrf();

const flash=require('connect-flash');

const helmet = require('helmet');
const compression = require('compression');
const morgan =require('morgan');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');
const dotenv =require('dotenv');
dotenv.config();

const app = express();

const store= new MySQLStore({
  host: 'localhost',
	port: 3306,
	user: process.env.MYSQLUser, 
	password: process.env.MYSQLPassword,
	database: process.env.MYSQLDatabase  
  }
)

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),
{flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
  if(!req.session){
    return next();
  }
  res.locals.isAuthenticated =req.session.isLoggedIn;
  res.locals.csrfToken= req.csrfToken();
  next();
});

app.use((req,res,next)=>{
  if(!req.session.user){
    return next();
  }
  User.findByPk(req.session.user.email)
    .then(user => {
      if(!user){
        return next();
      }
      req.user= user;
      next();
    })
    .catch(err => {
        next(new Error(err));
    });
})
  
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',errorController.get500);
app.use(errorController.get404);

app.use((err,req,res,next)=>{
  res.status(500).render('500', { 
    pageTitle: 'Error!', 
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
  // .sync({ force: true })
  .sync()
  .then(result => {    
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });




