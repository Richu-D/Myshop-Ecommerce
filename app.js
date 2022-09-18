var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var fileUpload = require('express-fileUpload')
var db = require('./confic/connection')
var app = express();
var Handlebars = require('handlebars');
Handlebars.registerHelper("order",(a)=>{
  return a+1;
})

Handlebars.registerHelper("orderfinished",(a,id)=>{
  if(a!=="Delevered" && a!=="Order Cancelled By User" && a!=="Order Cancelled by Admin"){
    return new Handlebars.SafeString(`<a class="btn btn-danger" onclick="cancelOrder('${id}')" >Cancel Order</a>`)
    // href="/cancelorder/'+id+'" 
  }
})

Handlebars.registerHelper("adminOrder",(status,id)=>{
  if(status!=="Delevered" && status!=="Order Cancelled By User" && status!=="Order Cancelled by Admin"){
    return new Handlebars.SafeString(`<div class="dropdown">
    <button class="dropbtn">status</button>
    <div class="dropdown-content">
      <a href="/admin/orderstatus/?status=shipped&id=${id}">Shipped</a>
      <a href="/admin/orderstatus/?status=Out for delevery&id=${id}">Out for delevery</a>
      <a href="/admin/orderstatus/?status=Delevered&id=${id}">Delivered</a>
      <a href="/admin/orderstatus/?status=Order Cancelled by Admin&id=${id}" class="btn btn-danger">Cancel Order</a>
    </div>
  </div> `)
  }
})


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())

db.connect((err)=>{
  if(err)console.log("connection error"+err);
  else console.log("Database connected");
})

// caching disabled for every route
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.use('/', usersRouter);
app.use('/admin', adminRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
