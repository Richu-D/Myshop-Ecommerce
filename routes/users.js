var express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var helpers = require('../helpers/helpers')
const twilio = require('twilio');
const { Db } = require('mongodb');
var moment = require('moment')
let referralCodeGenerator = require('referral-code-generator')
const { response } = require('../app');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


var router = express.Router();

function ifuser(req,res,next){
  // checking JWT

let token = req.cookies.jwt;
    if(token == null){next()}

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        
        res.redirect('/home')
    })}

/* GET users listing. */
router.get('/', function(req, res) {
  if(req.cookies.err){
    // res.render('users/signin')

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
  
  // res.setHeader('Set-Cookie',`jwt=${accessToken}`) //maxAge: 10000,
  res.cookie('jwt',accessToken, { httpOnly: true })
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
console.log(req.body);
if(req.body.password){
req.body.password = await bcrypt.hash(req.body.password,10)
otp = Math.floor(100000 + Math.random() * 900000);
console.log(otp);
req.body.otp = await bcrypt.hash(`${otp}`,10)
// send to cookie
res.setHeader('set-Cookie',[`username=${req.body.username}`,`email=${req.body.email}`,`password=${req.body.password}`,`number=${req.body.number}`,`otp=${req.body.otp}`,`referelCode=${req.body.referelCode}`])

// verify




//Twilio otp send uncomment

//   try{
//   client.messages
//   .create({
//     body: `Your one time password for login is ${otp} `,
//     from: +16415521519,
//     to: `+91` + req.body.number,
//   })
//   .then((message) => {
  
//     res.redirect('/verifyotp')
//   })
//   .catch((err) => {
//     console.error(err);
//   });
// }catch (err){

// console.log(`Some error cames in catch /signup post  ${err}`);

// }





  res.redirect('/verifyotp')

}else{
 res.send("Error pass cheyyanam User script block cheyyuva")
}

});

router.get('/verifyotp', function(req, res, next) {
  res.render('users/verifyotp')
});

// applyCoupon
router.post('/applyCoupon', (req, res) => {
  console.log(req.body);
  helpers.checkCoupon(req.body).then(coupon=>{
    res.json({coupon})
  })
});

router.post('/verifyotp', function(req, res, next) {
var {username,email,number,password,otp,referelCode} = req.cookies;
  
var userdata ={username,email,number,password}

  // verifying otp 
  bcrypt.compare(req.body.otp,otp).then((data)=>{
    if(data){


userdata.wallet = {
  balance:0,
  myReferelId:referralCodeGenerator.alphaNumeric('uppercase', 4, 4),
  whoReferedMe:referelCode
};
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

    }
  })

});



// User Authorisation
function checkuser(req,res,next){
  // checking JWT
 
let token = req.cookies.jwt;
    if(token == null) return res.redirect('/')

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        req.user = user
        // check block or not
        helpers.getUser(req.user.email).then((data)=>{
          if(data){
          if(data.block){
            res.send('Your are blocked')
          }
        }else{
          res.redirect('/')
        }
        })
        
        next()
    })}

    

router.get('/home',checkuser,async function(req, res) {
 let products = await helpers.getAllProducts()
  let category = await helpers.getCategory()
console.log(products);
    res.render('users/home',{products,category})
    
});

router.get('/shop',checkuser, function(req, res) {
  res.render('users/shop')
});

router.get('/detail/:id',checkuser, function(req, res) {
  helpers.getProductDetails(req.params.id).then((data)=>{
    res.render('users/detail',{data})
  }).catch(err =>{
    console.log(`This is an cautch error ${err}`);
    console.log(err);
    res.json()
  })
});

router.get('/cart',checkuser, async function(req, res) {

  let products = await helpers.getAllCartItems(req.user.email)
let grantTotal = 0;   
let category = await helpers.getCategory()
console.log(products);
if(products[0]){
products.forEach(data => {

  if(data.product.offerPrice){    
    data.total=data.quantity*data.product.offerPrice;
  }else{
    data.total=data.quantity*data.product.price;
  }

  grantTotal += data.total;
  console.log(grantTotal);
});


  res.render('users/cart',{products,grantTotal:grantTotal,cart:true,category})
}else{
  res.render('users/emptyCart',{cart:true,category})
}

   });

router.post('/addtocart/:id',checkuser, function(req, res) {
  // add to cart 

    helpers.addToCart(req.user.email,req.params.id).then(()=>{
      res.redirect('/cart')
    }).catch(err =>{
      console.log(err);
    })

  
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

  helpers.getAddress(req.user.email).then(async (data) =>{

    let products = await helpers.getAllCartItems(req.user.email)
    let grantTotal = 0;
    let productdata = [];
    products.forEach(data => {
      console.log(data);
      if(data.product.offerPrice){
        data.total=data.quantity*data.product.offerPrice;
         grantTotal += data.total;  
      productdata.push({name:data.product.name,price:data.product.offerPrice,quantity:data.quantity})

      }else{      
      data.total=data.quantity*data.product.price;
      grantTotal += data.total;    
      productdata.push({name:data.product.name,price:data.product.price,quantity:data.quantity})

    }
    });
    console.log(grantTotal,productdata);
    res.render('users/checkout',{address:data.address,productdata:productdata,razorpay_key:process.env.RAZORPAY_KEY_ID,grantTotal,name:data.username,number:data.number})
});

})




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
    if(data.product.offerPrice){
      rates.push(data.quantity*data.product.offerPrice)
      grantTotal += data.quantity*data.product.offerPrice;
    }else{
      rates.push(data.quantity*data.product.price)
      grantTotal += data.quantity*data.product.price;
    }
  });
 
    res.json({rates,grantTotal})

})


router.get('/search',checkuser,(req,res)=>{
  
  helpers.search(req.query.searchKey).then(async data =>{ 
    let category = await helpers.getCategory()
    res.render('users/shop',{data:data,category})
  })

  // res.send(req.query.searchKey)
  })

  
  router.post('/wishlistAndCartCount',checkuser,async (req,res)=>{
  
   let wishlistCountAndCartCount = await helpers.wishlistAndCartCount(req.user.email).catch(err =>{
    console.log(err);
   })
    res.json(wishlistCountAndCartCount)
    })

router.post('/searchRateRange',(req,res)=>{
  helpers.searchRateRange(req.body.params,req.body.min,req.body.max).then(async data =>{
    
    res.json({data:data})
  })
})

router.get('/myprofile',checkuser,(req,res)=>{ 
    helpers.getUser(req.user.email).then(async(user)=>{
      let category = await helpers.getCategory()
    res.render('users/profile',{address:user.address,user,category})
    }).catch(err =>{
      console.log(err);
    })
  })

// })

router.get('/cancelorder/:id',checkuser,(req,res)=>{
helpers.cancelOrder(req.params.id,"Order Cancelled By User")

  res.redirect('/orders')
})

router.get('/wishlist',checkuser,(req,res)=>{
  helpers.getWishlistItems(req.user.email).then(async(data)=>{
    let category = await helpers.getCategory()
        if(data[0]){
          res.render('users/wishlist',{products:data,wishlist:true,category})
        }else{
          res.render('users/emptyWishlist',{wishlist:true,category})
        }
    }).catch(err =>{
      console.log(err);
    })
 })
 

 router.post('/wishlist/:id',checkuser,(req,res)=>{
 
helpers.addWishlist(req.user.email,req.params.id)

  
    res.redirect('/wishlist')
})




router.post('/addAddress',checkuser,(req,res)=>{
  let address = req.body.address
  let stringAdress = address.replace(/\s+/g, ' ').trim()
  if(stringAdress.length > 10){
  helpers.addAddress(req.user.email,stringAdress)
}else{
  res.cookie('Address_error',"Invalid Address", { httpOnly: true })
}

  res.redirect('myprofile')
})

router.get('/orders',checkuser,(req,res)=>{
helpers.getAllOrder(req.user.email).then(async(data)=>{
  // let grantTotal = 0
  // data.forEach(data=>{
  //   grantTotal += data.grantTotal.grantTotal;
  //   console.log(data.order);

  // }) 
  let category = await helpers.getCategory()
  if(data[0]){
  res.render('users/orders',{data,category})
  }else{
    res.render('users/emptyOrders',{category})
  }

})


})

// editpersonaldetails
router.post('/editpersonaldetails',checkuser,(req,res)=>{

helpers.updateUser(req.user.email,req.body)

res.redirect('/myprofile')
})

router.post('/removeItemFromWishlist',checkuser,(req,res)=>{

  helpers.removeItemFromWishlist(req.user.email,req.body.productId)
  
  res.json({delete:true})
  })

router.get('/wallet',checkuser,async(req,res)=>{

  let walletDetails = await helpers.walletDetails(req.user.email)
  console.log(walletDetails);
  res.render('users/wallet.hbs',{walletDetails})
})

router.post('/changepassword',checkuser,async (req,res)=>{
  let existingpassword = req.body.existingpassword;
  let newpassword = req.body.newpassword;
  let conformpassword = req.body.conformpassword;
  if(newpassword==conformpassword){
  helpers.getUser(req.user.email).then(async (data)=>{
    bcrypt.compare(existingpassword,data.password).then(async (data)=>{
      if(data){
        // change password
        newpassword = await bcrypt.hash(newpassword,10)

        helpers.changePassword(req.user.email,newpassword)

  res.redirect('/myprofile')

      }else{

        res.redirect('/myprofile')
        // PASS ERROR MSG USING COOKIE
return 0;
      }
    })
  })
}else{
  res.redirect('/myprofile')
  // PASS ERROR MSG USING COOKIE 
}


  })

  router.post('/verifyPayment',checkuser,(req,res)=>{
      helpers.verifyPayment(req.body).then(()=>{
        helpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
          res.json({status:true})
        })
      }).catch((err)=>{
        res.json({status:false,errMsg:"Payment Failed"})
      })

  })


  

router.post('/editaddress',checkuser,(req,res)=>{

  // delete address
  let oldaddress = req.body.oldaddress
  let newaddress = req.body.newaddress 
  let stringoldAddress = oldaddress.replace(/\s+/g, ' ').trim()
  let stringnewAddress = newaddress.replace(/\s+/g, ' ').trim()

  if(stringnewAddress.length > 10){
    helpers.editAddress(req.user.email,stringoldAddress,stringnewAddress)
  }else{
    
  }
  
res.redirect('/myprofile')
})
router.get('/deleteaddress/:id',checkuser,(req,res)=>{


  helpers.deleteaddress(req.user.email,req.params.id)
    // delete address
    
res.redirect('/myprofile')
})


// moment().format("MMM Do YY")
router.post('/placeorder',checkuser, (req,res)=>{

console.log("first");
    // inser details into order collection 
 helpers.getAllCartItems(req.user.email).then(async (cartitems)=>{
console.log("middle");
  grantTotal = 0
  
  details = {}
  order = []
  cartitems.forEach(async data =>{


  if(data.product.offerPrice){
    order.push({item:data.item,quantity:data.quantity,price:data.product.offerPrice,productname:data.product.name,category:data.product.category,description:data.product.description,totalAmount:data.quantity*data.product.offerPrice})

    details = { date: moment().format("MMM Do YY"),name:req.body.name,number:req.body.number,address:req.body.address,paymentMethod:req.body.paymentMethod,status: (req.body.paymentMethod=="COD")?"placed":"pending",userId:req.user.email}

    grantTotal += data.quantity*data.product.offerPrice;

      }else{      

        order.push({item:data.item,quantity:data.quantity,price:data.product.price,productname:data.product.name,category:data.product.category,description:data.product.description,totalAmount:data.quantity*data.product.price})

        details = { date: moment().format("MMM Do YY"),name:req.body.name,number:req.body.number,address:req.body.address,paymentMethod:req.body.paymentMethod,status: (req.body.paymentMethod=="COD")?"placed":"pending",userId:req.user.email}
    
        grantTotal += data.quantity*data.product.price;
    }

  
    let stringProductId = ""+data.product._id


    
    
  helpers.removeItemFromWishlist(req.user.email,stringProductId)

  })


  let off = await helpers.checkCoupon(req.body)
  console.log(off);
  if(off){
  off = off.offer;
  details['offer'] =  off                    
  grantTotal = (grantTotal - ((grantTotal/100)*off)) 
  }
   console.log("Grand total inside loop ",grantTotal);
 

details['grantTotal'] =  grantTotal                    


console.log("isndie details grantTotal",details.grantTotal);

console.log("Order details",order,"details",details)
console.log("last");

  helpers.addOrder(order,details).then((orderId)=>{
    if(req.body.paymentMethod=="COD"){
      
      res.json({codSuccess:true})

    }else{
      helpers.generateRazorpay(orderId,grantTotal).then((response)=>{
res.json(response)
        
      })
    }
    

  })

  helpers.removeAllCartItem(req.user.email)


})

 })


module.exports = router;
