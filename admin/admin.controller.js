require('dotenv').config()
var express = require('express');
const jwt = require('jsonwebtoken')
var helpers = require('../helpers/helpers')

getLogin =(req, res)=>{
if(req.cookies.err){
res.render('admin/signin',{err:"Enter Correct Username and Password",err_class:"alert alert-warning"})
res.clearCookie('err')
}else{
res.render('admin/signin')

}

}

login = (req, res)=>{

if(req.body.email==='r@gmail.com'&& req.body.password==='123'){
console.log(process.env.ADMIN_TOKEN_SECRET)
const email = req.body.email
const user = { email: email}
const accessToken = jwt.sign(user,process.env.ADMIN_TOKEN_SECRET)

// res.setHeader('Set-Cookie',`jwt=${accessToken}`)
res.cookie('jwt',accessToken, { httpOnly: true,expires:new Date("9999-12-31T23:59:59.000Z") })
res.redirect('admin/home')
}else{
// cookie warning setting + redirect to /
res.setHeader('Set-Cookie',"err=true")
res.redirect('/admin')
}

res.end()
}

authorisation=(req,res,next)=>{

let token = req.cookies.jwt;
if(token == null) return res.redirect('/')

jwt.verify(token,process.env.ADMIN_TOKEN_SECRET,(err,user)=>{
console.log(err,user);
if(err){ res.redirect('/')}
req.user = user

next()
})   
}

home=(req, res)=> {
helpers.salesReport().then((data)=>{
//  console.log(data);
res.render('admin/index',{details:data,dashboard:true})
})
}

categoryOffer = async(req, res)=> {
helpers.categoryOffersStatusUpdate()
let categorys = await helpers.getCategoryOfferProducts()
helpers.getCategory().then(categoryList =>{
console.log(categoryList);
res.render('admin/categoryOffer',{categoryOffer:true,categoryList,categorys})
})
}

coupons = async(req, res)=> {
await helpers.couponsOffersStatusUpdate()
helpers.getCoupons().then(coupons =>{
console.log(coupons);
res.render('admin/coupons',{coupons,coupon:true})
})
}

addCategoryOffer = (req, res)=> {
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
}

addCoupon=(req, res) => {
console.log(req.body);
req.body.couponName=req.body.couponName.replace(/\s+/g,'').trim()
if(req.body.couponName.length>2){
helpers.addCoupon(req.body)
}
res.redirect("/admin/coupons")
}

deleteCategoryOffer=(req, res)=> {
helpers.removeCategoryOffer(req.params.id)
res.json()
}

deleteCoupon=(req, res)=>{
helpers.removeCouponOffer(req.params.id)
res.json()
}
graphdata=(req, res)=>{
helpers.graphdata().then(data=>{

console.log(data);
res.json({data})
})
}
addProductPage=(req, res)=>{
helpers.getCategory().then((category)=>{
res.render('admin/add_product',{category,addProduct:true})

})

}

addProduct=(req, res)=>{
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

}

addCategory = (req,res)=>{
// check category is already exist 
helpers.getCategory().then(category =>{
let flag = 0;
// console.log(category);
for(let i=0;i<category.length;++i){
if((req.body.category).toUpperCase()==(category[i].category).toUpperCase()){        
res.redirect('add_product')
flag = 1;
break;
}
}
if(!flag){
// push category:value in document 
helpers.addCategory(req.body)
res.redirect('add_product')

}
})

}
categoryedit=(req,res)=>{
helpers.editCategory(req.params.id,req.body)
res.redirect('/admin/add_product')
}

categorydelete=(req,res)=>{

helpers.deleteCategory(req.params.id)
res.redirect('/admin/add_product')

}
allproducts=(req, res)=> {
helpers.getAllProducts().then((products)=>{
res.render('admin/allproducts',{products,allProduct:true})
})
}
chart=(req, res)=> {
res.render('admin/chart')
}
editProductPage = async(req, res)=>{
let id = req.params.id
let product = await helpers.getProductDetails(id)
// console.log(product);
res.render('admin/edit_product',{product}) 

}
editProduct=(req, res)=>{
helpers.updateProduct(req.params.id,req.body).then(()=>{
res.redirect('/admin/allproducts')

if(req.files){
let image = req.files.image
image.mv('./public/product_image/'+req.params.id+'.jpg')
}
})
}

deleteProductPage =(req, res)=> {
let id = req.params.id
// delete file also
helpers.deleteProduct(id).then((data)=>{
console.log(data);
res.redirect('../allproducts')
})
}

deleteUser =(req, res)=>{
let id = req.params.id
helpers.deleteUser(id).then((data)=>{
console.log(data);
res.redirect('../allusers')
})
}

blockUser = (req,res)=>{
helpers.block(req.params.id)
res.redirect('/admin/allusers')
}

unblockUser=(req,res)=>{
helpers.unblock(req.params.id)
res.redirect('/admin/allusers')
}

allusers=(req, res)=>{
helpers.getAllUsers().then((users)=>{
res.render('admin/userslist',{users,allUsers:true})
})
}

logout = (req,res)=>{
res.clearCookie('jwt')
res.redirect('/admin')
}

allOrders=(req,res)=>{

helpers.getAllOrderAvailable().then((data)=>{
console.log(data[0]);
res.render('admin/orders',{data,orders:true})
})

}

changeOrderStatus=(req,res,next)=>{
helpers.cancelOrder(req.query.id,req.query.status).then(()=>{
res.redirect('/admin/orders')
})

}


profile=(req,res)=>{

res.send("Admin profile ithuvare cheythilla")
return;

}

settings=(req,res)=>{

res.send("Admin settings ithuvare cheythilla")

}
error=(req, res)=>{
res.render('admin/404')
}

showError=(req, res, next)=>{
res.redirect('/admin/error')
}
module.exports={
getLogin,
login,
authorisation,
home,
categoryOffer,
coupons,
addCategoryOffer,
addCoupon,
deleteCategoryOffer,
deleteCoupon,
graphdata,
addProductPage,
addCategory,
categoryedit,
categorydelete,
allproducts,
chart,
editProductPage,
editProduct,
deleteProductPage,
deleteUser,
blockUser,
unblockUser,
allusers,
logout,
allOrders,
changeOrderStatus,
profile,
settings,
error,
showError,
}