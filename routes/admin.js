require('dotenv').config()
var express = require('express');
const jwt = require('jsonwebtoken')
var adminRouter = express.Router();
var helpers = require('../helpers/helpers')
// Authentication
/* GET home page. */
adminRouter.get('/', function(req, res) {
  if(req.cookies.err){
    res.render('admin/signin',{err:"Enter Correct Username and Password",err_class:"alert alert-warning"})
    res.clearCookie('err')
  }else{
    res.render('admin/signin')

  }
 
});

adminRouter.post('/', function(req, res) {
  
 if(req.body.email==='r@gmail.com'&& req.body.password==='123'){
 console.log(process.env.ADMIN_TOKEN_SECRET)
   const email = req.body.email
  const user = { email: email}
  const accessToken = jwt.sign(user,process.env.ADMIN_TOKEN_SECRET)
  
  // res.setHeader('Set-Cookie',`jwt=${accessToken}`)
  res.cookie('jwt',accessToken, { httpOnly: true })
    res.redirect('admin/home')
 }else{
  // cookie warning setting + redirect to /
  res.setHeader('Set-Cookie',"err=true")
  res.redirect('/admin')
 }

  res.end()
});
// Authorisation 
adminRouter.use((req,res,next)=>{

  let token = req.cookies.jwt;
      if(token == null) return res.redirect('/admin')
  
      jwt.verify(token,process.env.ADMIN_TOKEN_SECRET,(err,user)=>{
          if(err) return res.sendStatus(403)
          req.user = user
          console.log(req.user);
          next()
      })   
})

adminRouter.get('/home', function(req, res) {
   helpers.salesReport().then((data)=>{
    //  console.log(data);
     res.render('admin/index',{details:data,dashboard:true})
   })
});

adminRouter.get('/categoryOffer',async function(req, res) {
  helpers.categoryOffersStatusUpdate()
  let categorys = await helpers.getCategoryOfferProducts()
  helpers.getCategory().then(categoryList =>{
    console.log(categoryList);
    res.render('admin/categoryOffer',{categoryOffer:true,categoryList,categorys})
  })
});
// coupons
adminRouter.get('/coupons',async function(req, res) {
  await helpers.couponsOffersStatusUpdate()
    helpers.getCoupons().then(coupons =>{
      console.log(coupons);
      res.render('admin/coupons',{coupons,coupon:true})
    })
});

adminRouter.post('/addCategoryOffer',function(req, res) {
console.log(req.body);
helpers.getCategory().then(categoryList =>{
  console.log(categoryList);
  console.log(categoryList.length);
  for(let i=0;i<categoryList.length;++i){
    if(categoryList[i].offer && categoryList[i].category==req.body.categoryName){
        console.log("offer avaliable");
        // should pass error offer available msg by json
        res.redirect("/admin/categoryOffer")
        return;
      }
  }
  console.log("offer is not available");    
        helpers.addCategoryOffer(req.body)
        .then(() =>{
          res.redirect("/admin/categoryOffer")
        })
  
})
});

// addCoupon
adminRouter.post('/addCoupon', function(req, res) {
console.log(req.body);
req.body.couponName=req.body.couponName.replace(/\s+/g,'').trim()
if(req.body.couponName.length>2){
  helpers.addCoupon(req.body)
}
 res.redirect("/admin/coupons")
});

// deleteCategoryOffer
adminRouter.get('/deleteCategoryOffer/:id', function(req, res) {
  helpers.removeCategoryOffer(req.params.id)
  res.json()
});
// deleteCoupon
adminRouter.get('/deleteCoupon/:id', function(req, res) {
  helpers.removeCouponOffer(req.params.id)
  res.json()
});

adminRouter.post('/graphdata',(req, res)=>{
  // helpers.salesReport().then((data)=>{
    helpers.graphdata().then(data=>{

      console.log(data);
      res.json({data})
    })
    // res.render('admin/index',{details:data,dashboard:true})
  // })
});

adminRouter.get('/add_product', function(req, res) {
  helpers.getCategory().then((category)=>{
    res.render('admin/add_product',{category,addProduct:true})

  })

});

adminRouter.post('/add_product', function(req, res) {
  console.log(req.body);
  if(req.files){
  helpers.addProduct(req.body,(id)=>{
    let image = req.files.image
    image.mv('./public/product_image/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add_product')
      }else{
        console.log(err);
      }
    })
  })
  res.redirect('/admin/add_product')
  }else{
    res.redirect('/admin/add_product')
    // set cookie error = image is not null
  }

});

// makeit Ajax request
adminRouter.post('/add_category',(req,res)=>{
  // check category is already exist 
  helpers.checkCategoryAvailable(req.body.category).then(exist =>{
    if(exist){
      console.log("exist ",exist);
      res.redirect('add_product')
    }else{
      console.log("not exist ",exist);
      // push category:value in document 
      helpers.addCategory(req.body)
      res.redirect('add_product')
    }
  })

  
})


adminRouter.post('/categoryedit/:id',(req,res)=>{
helpers.editCategory(req.params.id,req.body)
 res.redirect('/admin/add_product')
})

adminRouter.get('/categorydelete/:id',(req,res)=>{
 
    helpers.deleteCategory(req.params.id)
    res.redirect('/admin/add_product')

  })
 


adminRouter.get('/form', function(req, res){
  res.render('/admin/form')
});

adminRouter.get('/allproducts', function(req, res) {
  helpers.getAllProducts().then((products)=>{
  res.render('admin/allproducts',{products,allProduct:true})
  })
})

adminRouter.get('/chart', function(req, res) {
  res.render('admin/chart')
});

adminRouter.get('/edit_product/:id', async function(req, res) {
  let id = req.params.id
  let product = await helpers.getProductDetails(id)
  // console.log(product);
  res.render('admin/edit_product',{product}) 

});

adminRouter.post('/edit_product/:id',(req, res)=>{
helpers.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin/allproducts')

  if(req.files){
    let image = req.files.image
    image.mv('./public/product_image/'+req.params.id+'.jpg')
  }
})
})
 
adminRouter.get('/edit/:email',(req,res)=>{
  helpers.getUser(req.params.email).then((user)=>{
    // console.log(user);
    res.render('admin/editUser',{user})

  })
  // res.send('edit get request')
  // data not found
})

adminRouter.post('/edit/:email',(req,res)=>{ 
  // update user and redirect
  console.log(req.params.email)
  // console.log(req.body)
  helpers.updateUser(req.params.email,req.body)
  
  // helpers.editUser(req.params.id) 
  res.redirect('/admin/allusers')
})

adminRouter.get('/delete_product/:id', function(req, res) {
  let id = req.params.id
  // delete file also
  helpers.deleteProduct(id).then((data)=>{
    console.log(data);
    res.redirect('../allproducts')
  })
});


adminRouter.get('/delete/:id', function(req, res) {
  let id = req.params.id
  helpers.deleteUser(id).then((data)=>{
    console.log(data);
    res.redirect('../allusers')
  })
});

adminRouter.get('/block/:id',(req,res)=>{
  helpers.block(req.params.id)
  res.redirect('/admin/allusers')
})

adminRouter.get('/unblock/:id',(req,res)=>{
  helpers.unblock(req.params.id)
  res.redirect('/admin/allusers')
})

adminRouter.get('/allusers', function(req, res) {
  helpers.getAllUsers().then((users)=>{
    res.render('admin/userslist',{users,allUsers:true})
    })
});


adminRouter.get('/about', function(req, res) {
  res.send('Admin about page')
});

adminRouter.get('/logout',(req,res)=>{
  res.clearCookie('jwt')
  res.redirect('/admin')
})

adminRouter.get('/orders',(req,res)=>{

  helpers.getAllOrderAvailable().then((data)=>{
    console.log(data[0]);
    res.render('admin/orders',{data,orders:true})
  })

  
  
  adminRouter.get('/orderstatus',(req,res)=>{
    console.log(req.query.status);
    console.log(req.query.id);
    helpers.cancelOrder(req.query.id,req.query.status)
    res.redirect('/admin/orders')

    })






    adminRouter.get('/profile',(req,res)=>{
      
      res.send("Admin profile ithuvare cheythilla")
  
      })

      adminRouter.get('/settings',(req,res)=>{
      
        res.send("Admin settings ithuvare cheythilla")
    
        })
  

})

module.exports = adminRouter;
