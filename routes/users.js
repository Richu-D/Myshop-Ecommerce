var express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var helpers = require('../helpers/helpers')
const twilio = require('twilio');
const { Db } = require('mongodb');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


var router = express.Router();

function ifuser(req,res,next){
  // checking JWT
  if(req.headers.cookie){
let x = req.headers.cookie;
let y = x.split('=')[1]
   let token = y;
    if(token == null){next()}

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        
        res.redirect('/home')
    })}else{
      next()
    }
  }

/* GET users listing. */
router.get('/', function(req, res) {
  if(req.cookies.err){
    res.render('users/signin')

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
  // with err
  res.setHeader('Set-Cookie',"err=true")
  
  res.redirect('/')
}
  
 }
 )

 
});

router.get('/signup', function(req, res) {
  res.render('users/signup')
});

router.post('/signup', async function (req, res) {

req.body.password = await bcrypt.hash(req.body.password,10)
otp = Math.floor(100000 + Math.random() * 900000);
console.log(otp);
req.body.otp = await bcrypt.hash(`${otp}`,10)
// send to cookie
res.setHeader('set-Cookie',[`username=${req.body.username}`,`email=${req.body.email}`,`password=${req.body.password}`,`number=${req.body.number}`,`otp=${req.body.otp}`])

// verify


  try{
  client.messages
  .create({
    body: `Your one time password for login is ${otp} `,
    from: +16415521519,
    to: `+91` + req.body.number,
  })
  .then((message) => {
  

    
    console.log(`This is something return from twilio ${message}`);
    res.redirect('/verifyotp')
  })
  .catch((err) => {
    console.error(err);
  });
}catch (err){

console.log(`Some error cames in catch /signup post  ${err}`);

}
  res.redirect('/verifyotp')
});

router.get('/verifyotp', function(req, res, next) {
  res.render('users/verifyotp')
});

router.post('/verifyotp', function(req, res, next) {
  // console.log(req.cookies.otp); 
var {username,email,number,password,otp} = req.cookies;
  
var userdata ={username,email,number,password}

  // verifying otp 
  bcrypt.compare(req.body.otp,req.cookies.otp).then((data)=>{
    if(data){
// push data into database
console.log(userdata);



helpers.addUser(userdata)
    const email = req.cookies.email
    const user = { email: email}

  


  //  generating JWT
   const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
  
  res.setHeader('Set-Cookie',`jwt=${accessToken}`)
  res.clearCookie('password')
res.clearCookie('email')
res.clearCookie('username')
res.clearCookie('number')
res.clearCookie('data')
res.clearCookie('otp')
    res.redirect('/')


    }else{
      console.log("data delete ayi");
    }
  })

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
        // check block or not
        helpers.getUser(req.user.email).then((data)=>{
          if(data.block){
            res.send('Your are blocked')
          }
        })
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
  helpers.getProductDetails(req.params.id).then((data)=>{
    res.render('users/detail',{data})
  })
});

// router.post('/getTotalAmount',(req,res)=>{
//   console.log(req.body);
//   helpers.getTotalAmount(req.body.userId).then((response)=>{
//     console.log(`Resposne of getTotalAmount is ${response}`);
//     res.json(response)
//   })
// })

router.get('/cart',checkuser, async function(req, res) {

  let products = await helpers.getAllCartItems(req.user.email)
let grantTotal = 0;
products.forEach(data => {
  data.total=data.quantity*data.product.price;
  grantTotal += data.total;
});
  res.render('users/cart',{products,grantTotal:grantTotal})
   });

router.post('/addtocart/:id',checkuser, function(req, res) {
  // add to cart 
  try {
    helpers.addToCart(req.user.email,req.params.id).then(()=>{
      res.redirect('/cart')
    })
  } catch (error) {

  }
  
// res.send("add to cart post request"+req.user.email)
  // res.render('users/cart')
});

router.post('/change-product-quantity',(req,res)=>{
  helpers.changeProductQuantity(req.body).then((response)=>{    
    res.json(response)
  })
})

router.post('/removeCartItem',(req,res)=>{
  helpers.removeCartItem(req.body).then((response)=>{
    res.json(response)
  })

  // helpers.changeProductQuantity(req.body).then((response)=>{
  //   res.json(response)
  // })
})

router.get('/checkout',checkuser, async function(req, res) {

  res.render('users/checkout')
});
router.get('/contact',checkuser, function(req, res) {
  res.render('users/contact')
});
router.get('/logout',checkuser,(req,res)=>{
  res.clearCookie('jwt')
  res.redirect('/')
})
router.post('/updateAllValues',checkuser,async(req,res)=>{
  
  let products = await helpers.getAllCartItems(req.user.email)
  let grantTotal = 0;
  let rates = [];
  products.forEach(data => {
    rates.push(data.quantity*data.product.price)
    grantTotal += data.quantity*data.product.price;
  });
 
    res.json({rates,grantTotal})

})

router.get('/myprofile',checkuser,(req,res)=>{
  

  res.render('users/profile')
})

router.get('/cancelorder/:id',checkuser,(req,res)=>{
helpers.cancelOrder(req.params.id)

  res.send(req.params.id)
})


router.post('/addAddress',checkuser,(req,res)=>{
  
  helpers.addAddress(req.user.email,req.body)

  res.render('users/profile')
})

router.get('/orders',checkuser,(req,res)=>{
helpers.getAllOrder(req.user.email).then((data)=>{
  console.log(data[0]);
  // let grantTotal = 0
  // data.forEach(data=>{
  //   grantTotal += data.grantTotal.grantTotal;
  //   console.log(data.order);

  // })
  res.render('users/orders',{data})

})


})
router.post('/placeorder',checkuser,(req,res)=>{
    // inser details into order collection 
helpers.getAllCartItems(req.user.email).then((cartitems)=>{

  grantTotal =0
  
  order = []
  cartitems.forEach(data =>{
    order.push({userId:req.user.email,item:data.item,quantity:data.quantity,price:data.product.price,productname:data.product.name,category:data.product.category,description:data.product.description,totalAmount:data.quantity*data.product.price,date:new Date(),status:"placed",name:req.body.name,number:req.body.number,address:req.body.address,paymentMethod:req.body.paymentMethod})

    grantTotal += data.quantity*data.product.price;

  })
  grantTotal={'grantTotal':grantTotal}


  helpers.addOrder(order,grantTotal)

  helpers.removeAllCartItem(req.user.email)


})


  res.redirect('/orders')
 })


module.exports = router;
