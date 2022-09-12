require('dotenv').config()
var express = require('express');
const jwt = require('jsonwebtoken')
var router = express.Router();
var helpers = require('../helpers/helpers')
// Authentication
/* GET home page. */
router.get('/', function(req, res) {
  if(req.cookies.err){
    res.render('admin/signin',{err:"Enter Correct Username and Password",err_class:"alert alert-warning"})
    res.clearCookie('err')
  }else{
    res.render('admin/signin')

  }
 
});

router.post('/', function(req, res) {
  
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
router.use((req,res,next)=>{

  let token = req.cookies.jwt;
      if(token == null) return res.redirect('/admin')
  
      jwt.verify(token,process.env.ADMIN_TOKEN_SECRET,(err,user)=>{
          if(err) return res.sendStatus(403)
          req.user = user
          console.log(req.user);
          next()
      })   
})

router.get('/home', function(req, res) {
   helpers.salesReport().then((data)=>{
    //  console.log(data);
     res.render('admin/index',{details:data,dashboard:true})
   })
});

router.get('/sales_report', function(req, res) {
  
  res.render('admin/salesReport',{salesReport:true})
});

router.post('/graphdata',(req, res)=>{
  // helpers.salesReport().then((data)=>{
    helpers.graphdata().then(data=>{

      console.log(data);
      



      res.json({data})
    })
    // res.render('admin/index',{details:data,dashboard:true})
  // })
});

router.get('/add_product', function(req, res) {
  helpers.getCategory().then((category)=>{
    res.render('admin/add_product',{category,addProduct:true})

  })

});

router.post('/add_product', function(req, res) {
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

router.post('/add_category',(req,res)=>{
  // push category:value in document 
  helpers.addCategory(req.body)
  res.redirect('add_product')
})


router.post('/categoryedit/:id',(req,res)=>{
helpers.editCategory(req.params.id,req.body)
 res.redirect('/admin/add_product')
})

router.get('/categorydelete/:id',(req,res)=>{
 
    helpers.deleteCategory(req.params.id)
    res.redirect('/admin/add_product')

  })
 


router.get('/form', function(req, res){
  res.render('/admin/form')
});

router.get('/allproducts', function(req, res) {
  helpers.getAllProducts().then((products)=>{
  res.render('admin/allproducts',{products,allProduct:true})
  })
})

router.get('/chart', function(req, res) {
  res.render('admin/chart')
});

router.get('/edit_product/:id', async function(req, res) {
  let id = req.params.id
  let product = await helpers.getProductDetails(id)
  // console.log(product);
  res.render('admin/edit_product',{product}) 

});

router.post('/edit_product/:id',(req, res)=>{
helpers.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin/allproducts')

  if(req.files){
    let image = req.files.image
    image.mv('./public/product_image/'+req.params.id+'.jpg')
  }
})
})
 
router.get('/edit/:email',(req,res)=>{
  helpers.getUser(req.params.email).then((user)=>{
    // console.log(user);
    res.render('admin/editUser',{user})

  })
  // res.send('edit get request')
  // data not found
})

router.post('/edit/:email',(req,res)=>{ 
  // update user and redirect
  console.log(req.params.email)
  // console.log(req.body)
  helpers.updateUser(req.params.email,req.body)
  
  // helpers.editUser(req.params.id) 
  res.redirect('/admin/allusers')
})

router.get('/delete_product/:id', function(req, res) {
  let id = req.params.id
  // delete file also
  helpers.deleteProduct(id).then((data)=>{
    console.log(data);
    res.redirect('../allproducts')
  })
});


router.get('/delete/:id', function(req, res) {
  let id = req.params.id
  helpers.deleteUser(id).then((data)=>{
    console.log(data);
    res.redirect('../allusers')
  })
});

router.get('/block/:id',(req,res)=>{
  helpers.block(req.params.id)
  res.redirect('/admin/allusers')
})

router.get('/unblock/:id',(req,res)=>{
  helpers.unblock(req.params.id)
  res.redirect('/admin/allusers')
})

router.get('/allusers', function(req, res) {
  helpers.getAllUsers().then((users)=>{
    res.render('admin/userslist',{users,allUsers:true})
    })
});


router.get('/about', function(req, res) {
  res.send('Admin about page')
});

router.get('/logout',(req,res)=>{
  res.clearCookie('jwt')
  res.redirect('/admin')
})

router.get('/orders',(req,res)=>{

  helpers.getAllOrderAvailable().then((data)=>{
    console.log(data[0]);
    res.render('admin/orders',{data,orders:true})
  })

  
  
  router.get('/orderstatus',(req,res)=>{
    console.log(req.query.status);
    console.log(req.query.id);
    helpers.cancelOrder(req.query.id,req.query.status)
    res.redirect('/admin/orders')

    })






    router.get('/profile',(req,res)=>{
      
      res.send("Admin profile ithuvare cheythilla")
  
      })

      router.get('/settings',(req,res)=>{
      
        res.send("Admin settings ithuvare cheythilla")
    
        })
  

})

module.exports = router;
