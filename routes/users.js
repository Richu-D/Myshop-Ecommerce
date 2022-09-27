var express = require('express');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var helpers = require('../helpers/helpers')
const { Db } = require('mongodb');
var moment = require('moment')
let referralCodeGenerator = require('referral-code-generator')
const { response } = require('../app');
const { json } = require('express');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

var usersRouter = express.Router();

function ifuser(req,res,next){
  // checking JWT

let token = req?.cookies?.jwt;
    if(!token){ return next()}
    else{
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) { res.clearCookie('jwt')
      res.redirect('/')} 
        else{
          
          req.user = user
        // check block or not
        helpers.getUser(req.user.email).then((data)=>{
          if(data){
          if(data.block){
            res.clearCookie('jwt')
            res.send('Your are blocked')
            

          }
        }else{
          res.redirect('/')
        }
        })
        next()
       // res.redirect('/home')
        }    
    })
}}

/* GET users listing. */
usersRouter.get('/',ifuser, function(req, res) {
  if(req.cookies.err){
    // res.render('users/signin')

    res.render('users/signin',{err:"Invalid Username or Password",err_class:"alert alert-warning"})
    res.clearCookie('err')
  }else{
    res.render('users/signin')
  }
});

usersRouter.post('/', (req, res)=>{
  helpers.getUser(req.body.email).then((data)=>{
if(data){
    if(!data.block){
    if(data){
    bcrypt.compare(req.body.password,data.password).then((data)=>{
      if(data){
      const email = req.body.email
  const user = { email: email}
  const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
  
  res.cookie('jwt',accessToken, { httpOnly: true,expires:new Date("9999-12-31T23:59:59.000Z")})
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
    
    res.clearCookie('jwt')
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



usersRouter.get('/signup', function(req, res) {
  res.render('users/signup')
});


usersRouter.get('/home',async function(req, res) {
  let products = await helpers.getAllProducts()   
     res.render('users/home',{products,})
     
 });
 
 
 usersRouter.post('/sendOtp',function(req, res) { 
  try {
    client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
                 .verifications
                 .create({to: `+91${req.body.phoneNumber}`, channel: 'sms'})
                 .then(verification => {
                   console.log(verification.status)
                 });
     res.json({})
  } catch (error) {
    
  }
      
  });


  usersRouter.post('/verifyOtp',async function(req, res) { 
    try {
      var {username,email,number,password,referelCode,otp} = req.body;
    client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
       .verificationChecks
       .create({to: `+91${number}`, code:`${otp}`})
       .then(async verification_check =>{
         console.log(verification_check?.status)
          if(verification_check?.status!=="approved"){ return res.json({status:false})}
          console.log("sussuss");
          password = await bcrypt.hash(password,10)
 
var userdata ={username,email,number,password}

userdata.wallet = {
  balance:0,
  myReferelId:referralCodeGenerator.alphaNumeric('uppercase', 4, 4),
  whoReferedMe:referelCode
}

// console.log(userdata);

helpers.addUser(userdata).then(userObjectId =>{
  try {
    const user = {email,userObjectId}

    //  generating JWT
     const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
    console.log(user);
  
    res.setHeader('Set-Cookie',`jwt=${accessToken}`)
  
    res.json({status:true})
  } catch (error) {
    console.log(error);
  }
 

})    
  


  })
    } catch (error) {
      console.log(error);
    }
   

})
  
  usersRouter.get('/detail/:id', function(req, res) {
    try {
      helpers.getProductDetails(req.params.id).then((data)=>{
        res.render('users/detail',{data})
      }).catch(() =>{
        res.redirect('/error')
      })
    } catch (error) {
      
    }
   
  });
 

  usersRouter.get('/search',(req,res)=>{
  
    helpers.search(req.query.searchKey).then(async data =>{ 
      
      res.render('users/shop',{data:data})
    })
  
    // res.send(req.query.searchKey)
    })

  // need to implement contact us page
    usersRouter.get('/contact', function(req, res) {
      res.render('users/contact')
    });

    usersRouter.post('/searchRateRange',(req,res)=>{
      helpers.searchRateRange(req.body.params,req.body.min,req.body.max).then(async data =>{
        
        res.json({data:data})
      })
    })


  // getCategory
usersRouter.post('/getCategory',async (req,res)=>{
  try {
    let category = await helpers.getCategory()
    res.json({category})
  } catch (error) {
    console.log(error);
  }
  
  })

    
// User Authorisation middleware

    usersRouter.use((req,res,next)=>{

      let token = req.cookies.jwt;
    if(token == null) return res.redirect('/')

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) {res.clearCookie('jwt')
        res.redirect('/')
        return;
      }
        req.user = user
        // check block or not
        helpers.getUser(req.user.email).then((data)=>{
          if(data){
          if(data.block){
            
            res.clearCookie('jwt')
            res.send('Your are blocked')
          }
        }else{
          res.redirect('/')
        }
        })
        
        next()
    })

    })



// applyCoupon 
usersRouter.post('/applyCoupon', async (req, res) => {

  let couponUsed = await helpers.findNonUsedCoupons(req.user.email,req.body.coupon)
  if(couponUsed){
  // coupon is used 
  console.log("used");
  res.json({status:false,ErrMsg:"Coupen Code is already Used"})
}else{
  // coupon is not used
  console.log("Not used");
helpers.checkCoupon(req.body).then(coupon=>{
  if(coupon){
    // coupon is available
    console.log(coupon.couponName);
    console.log("available coupon");
  res.json({status:true,coupon})



  }else{
    // coupon is not available
    console.log(coupon);
  res.json({status:false,ErrMsg:"Invalid Coupen Code"})
  }

  })

  }
});




usersRouter.get('/cart', async function(req, res) {

  let products = await helpers.getAllCartItems(req.user.email)
let grantTotal = 0;   

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


  res.render('users/cart',{products,grantTotal:grantTotal,cart:true})
}else{
  res.render('users/emptyCart',{cart:true})
}

   });

usersRouter.post('/addtocart/:id', function(req, res) {
  // add to cart 

    helpers.addToCart(req.user.email,req.params.id).then(()=>{
      res.redirect('/cart')
    }).catch(err =>{
      console.log(err);
    })

  
// res.send("add to cart post request"+req.user.email)
  // res.render('users/cart')
});

usersRouter.post('/change-product-quantity',(req,res)=>{
  if(req.body.count == -1||req.body.count == 1){
  helpers.changeProductQuantity(req.body).then((response)=>{ 
    res.json(response)
    
  })
  
}else{
  res.json({})
}
})

usersRouter.post('/removeCartItem',(req,res)=>{
  helpers.removeCartItem(req.body).then((response)=>{
    res.json(response)
  })

  // helpers.changeProductQuantity(req.body).then((response)=>{
  //   res.json(response)
  // })
})

usersRouter.get('/checkout', async function(req, res) {

  helpers.getAddress(req.user.email).then(async (data) =>{
    let coupons = await helpers.getValidCoupons();
      let availableCoupons = []

      // console.log(coupons);
      for(let i=0;i<coupons.length;++i){ 
      await helpers.findNonUsedCoupons(req.user.email,coupons[i].couponName).then(result =>{
        if(!result) availableCoupons.push(coupons[i])        
      })
    }

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
    res.render('users/checkout',{address:data.address,productdata:productdata,razorpay_key:process.env.RAZORPAY_KEY_ID,grantTotal,name:data.username,number:data.number,availableCoupons})
});

})





usersRouter.get('/logout',(req,res)=>{
  res.clearCookie('jwt')
  res.redirect('/')
})
usersRouter.post('/updateAllValues',async(req,res)=>{
  
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



  usersRouter.post('/wishlistAndCartCount',async (req,res)=>{
    try {
      let wishlistCountAndCartCount = await helpers.wishlistAndCartCount(req.user.email)
      console.log(wishlistCountAndCartCount);      
      res.json({wishlistCountAndCartCount});
    } catch (error) {
      console.log(error);
    }
  
    
    })



usersRouter.get('/myprofile',(req,res)=>{ 
    helpers.getUser(req.user.email).then(async(user)=>{
      
      let walletDetails = await helpers.walletDetails(req.user.email)
      let usedCoupons = await helpers.getUsedCoupons(req.user.email)
      let coupons = await helpers.getValidCoupons();
      let availableCoupons = []

      // console.log(coupons);
      for(let i=0;i<coupons.length;++i){ 
      await helpers.findNonUsedCoupons(req.user.email,coupons[i].couponName).then(result =>{
        if(!result) availableCoupons.push(coupons[i])        
      })
    }
    res.render('users/profile',{address:user.address,user,walletDetails,availableCoupons,usedCoupons})
    }).catch(err =>{
      console.log(err);
    })
  })

// })
 
usersRouter.get('/cancelorder/:id',(req,res)=>{
helpers.cancelOrder(req.params.id,"Order Cancelled By User")

  res.redirect('/orders')
})

usersRouter.get('/wishlist',(req,res)=>{
  helpers.getWishlistItems(req.user.email).then(async(data)=>{
    
        if(data[0]){
          res.render('users/wishlist',{products:data,wishlist:true})
        }else{
          res.render('users/emptyWishlist',{wishlist:true})
        }
    }).catch(err =>{
      console.log(err);
    })
 })
 

 usersRouter.post('/wishlist/:id',(req,res)=>{
 
helpers.addWishlist(req.user.email,req.params.id)

  
    res.redirect('/wishlist')
})




usersRouter.post('/addAddress',(req,res)=>{
  let address = req.body.address
  let stringAdress = address.replace(/\s+/g, ' ').trim()
  if(stringAdress.length > 10){
  helpers.addAddress(req.user.email,stringAdress)
}else{
  res.cookie('Address_error',"Invalid Address", { httpOnly: true })
}

  res.redirect('myprofile')
})

usersRouter.post('/addAddressCheckOut',(req,res)=>{
  let address = req.body.address
  console.log(address);
  let stringAdress = address.replace(/\s+/g, ' ').trim()
  if(stringAdress.length > 10){
  helpers.addAddress(req.user.email,stringAdress)
}else{
  res.cookie('Address_error',"Invalid Address", { httpOnly: true })
}

res.json({})
})

usersRouter.get('/orders',(req,res)=>{
helpers.getAllOrder(req.user.email).then(async(data)=>{
  // let grantTotal = 0
  // data.forEach(data=>{
  //   grantTotal += data.grantTotal.grantTotal;
  //   console.log(data.order);

  // }) 
  
  if(data[0]){
    console.log(data[0]);
  res.render('users/orders',{data})
  }else{
    res.render('users/emptyOrders')
  }

})


})

// editpersonaldetails
usersRouter.post('/editpersonaldetails',(req,res)=>{

helpers.updateUser(req.user.email,req.body)

res.redirect('/myprofile')
})

usersRouter.post('/removeItemFromWishlist',(req,res)=>{

  helpers.removeItemFromWishlist(req.user.email,req.body.productId)
  
  res.json({delete:true})
  })


usersRouter.post('/changepassword',async (req,res)=>{
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

  usersRouter.post('/verifyPayment',(req,res)=>{
      helpers.verifyPayment(req.body).then(()=>{
        helpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
          res.json({status:true})
        })
      }).catch((err)=>{
        res.json({status:false,errMsg:"Payment Failed"})
      })

  })


  

usersRouter.post('/editaddress',(req,res)=>{

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
usersRouter.get('/deleteaddress/:id',(req,res)=>{


  helpers.deleteaddress(req.user.email,req.params.id)
    // delete address
    
res.redirect('/myprofile')
})


// moment().format("MMM Do YY")
usersRouter.post('/placeorder', (req,res)=>{

    // inser details into order collection 
 helpers.getAllCartItems(req.user.email).then(async (cartitems)=>{
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

  let couponUsed = await helpers.findNonUsedCoupons(req.user.email,req.body.coupon)
if(couponUsed){
// coupon is used 
}else{
 
  let off = await helpers.checkCoupon(req.body)
  // console.log(off);
 
  if(off && off.offerUpto >= grantTotal){
  details['couponName'] =  off.couponName 
  off = off.offer;
  details['offer'] =  off  
  grantTotal = (grantTotal - ((grantTotal/100)*off)) 
  helpers.addUsedCoupon(req.user.email,details['couponName'])
  }

// console.log("inside if");


}



  //  console.log("Grand total inside loop ",grantTotal);
 

details['grantTotal'] =  grantTotal                    


// console.log("isndie details grantTotal",details.grantTotal);

// console.log("Order details",order,"details",details)




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

 usersRouter.get('/error', function(req, res) {
  res.render('users/404')
});

 usersRouter.use(function(req, res, next) {
  res.redirect('/error')
 })

module.exports = usersRouter;
 