var express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var helpers = require('../helpers/helpers')
// const twilio = require('twilio')

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require('twilio')(accountSid, authToken);


var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.cookies.err){
    res.render('users/signin',{err:"Invalid Username or Password",err_class:"alert alert-warning"})
    res.clearCookie('err')
  }else{
    res.render('users/signin')

  }
});

router.post('/', (req, res)=>{
  helpers.getUser(req.body.email).then((data)=>{
if(data){
    if(!data.block){
    if(data){
    bcrypt.compare(req.body.password,data.password).then((data)=>{
      if(data){
      const email = req.body.email
  const user = { email: email}
  const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
  
  res.setHeader('Set-Cookie',`jwt=${accessToken}`)
    res.redirect('/home')
      }
      else{
        res.setHeader('Set-Cookie',"err=true")
        res.redirect('/')
      }
    })
  }else{
    res.setHeader('Set-Cookie',"err=true")
        res.redirect('/')
  }

  }else{
    res.send('Your are blocked')
  }

}else{
  res.redirect('/signup')
}
  
 }
 )

 
});

router.get('/signup', function(req, res) {
  res.render('users/signup')
});

router.post('/signup', async function (req, res) {
  req.body.password = await bcrypt.hash(req.body.password,10)
  // res.setHeader('set-Cookie',[`username=${req.body.username}`,`email=${req.body.email}`,`password=${req.body.password}`])
console.log(req.body);
helpers.addUser(req.body)
  const email = req.body.email
  const user = { email: email}
  const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
  
  res.setHeader('Set-Cookie',`jwt=${accessToken}`)
    res.redirect('/home')

  // cookie warning setting + redirect to /
  // res.setHeader('Set-Cookie',"err=true")
  // res.redirect('/')

  // res.end()

// // 
// client.messages('MM800f449d0399ed014aae2bcc0cc2f2ec')
//       .fetch()
//       .then(message => console.log(message.body));

// res.redirect('/home')
  // res.redirect('/verifyotp')
});

router.get('/verifyotp', function(req, res, next) {
  console.log(req.cookies); 
  res.render('users/verifyotp')
});

router.post('/verifyotp', function(req, res, next) {
  // verifying otp 
  // generating JWT
  res.clearCookie('password')
  res.clearCookie('email')
  res.clearCookie('username')
  res.redirect('/home')

});



// User Authorisation
function checkuser(req,res,next){
  // checking JWT
  if(req.headers.cookie){
let x = req.headers.cookie;
let y = x.split('=')[1]
   let token = y;
    if(token == null) return res.redirect('/')

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        req.user = user
        console.log(req.user);
        next()
    })}else{
      res.redirect('/')
    }
}

router.get('/home',checkuser, function(req, res) {
  helpers.getAllProducts().then((products)=>{
    res.render('users/home',{products})
    })
});

router.get('/shop',checkuser, function(req, res) {
  res.render('users/shop')
});

// now work on here
router.get('/detail/:id',checkuser, function(req, res) {
  console.log(req.params.id); 
  helpers.getProductDetails(req.params.id).then((data)=>{
    res.render('users/detail',{data})
  })
});

router.get('/cart/:id',checkuser, function(req, res) {
  // add to cart then render
  res.render('users/cart')
});

router.get('/checkout',checkuser, function(req, res) {
  res.render('users/checkout')
});
router.get('/contact',checkuser, function(req, res) {
  res.render('users/contact')
});
router.get('/logout',checkuser,(req,res)=>{
  res.clearCookie('jwt')
  res.redirect('/')
})


module.exports = router;
