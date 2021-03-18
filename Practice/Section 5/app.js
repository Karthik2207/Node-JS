const express = require('express');
const path=require('path');
const bodyParser= require('body-parser');
const app= express();
const adminRoutes= require('./routes/admin')
const shopRoutes= require('./routes/shop')

// app.use((req,res,next)=>{
//     console.log("In another MiddleWare");
//     res.send('<h1>Hello from Express</h1>')
// });

app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(path.join(__dirname,'public')));
app.use('/admin',adminRoutes);
app.use(shopRoutes);

//To send 404
app.use((req, res, next)=>{
    res.status(404).sendFile(path.join(__dirname, 'views','404.html'))
});


app.listen(3000);


