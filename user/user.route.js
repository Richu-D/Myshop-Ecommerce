var express = require('express');
var usersRouter = express.Router();


const {
ifUser,
getlogin,
login,
getSignup,
home,
sendOtp,
verifyOtp,
detail,
search,
searchRateRange,
getCategory,
authorisation,
applyCoupon,
cart,
addtocart,
changeProductQuantity,
removeCartItem,
checkout,
logout,
updateAllValues,
wishlistAndCartCount,
myprofile,
cancelorder,
wishlist,
addWishlist,
addAddress,
addAddressCheckOut,
orders,
editpersonaldetails,
removeItemFromWishlist,
changepassword,
verifyPayment,
deleteaddress,
placeorder,
error,
showError,



} = require('./user.controller');

/* GET users listing. */
usersRouter.get('/login',ifUser, getlogin);

usersRouter.post('/login', login);

usersRouter.get('/signup', getSignup);

usersRouter.get('/',home);

usersRouter.post('/sendOtp',sendOtp);

usersRouter.post('/verifyOtp',verifyOtp)

usersRouter.get('/detail/:id', detail);

usersRouter.get('/search',search)

usersRouter.post('/searchRateRange',searchRateRange)

usersRouter.get('/getCategory',getCategory)

usersRouter.get('/error',error);

usersRouter.use(authorisation)     // User Authorisation middleware

usersRouter.post('/applyCoupon',applyCoupon);

usersRouter.get('/cart',cart);

usersRouter.post('/addtocart/:id',addtocart); 

usersRouter.patch('/changeProductQuantity',changeProductQuantity)

usersRouter.delete('/removeCartItem',removeCartItem)

usersRouter.get('/checkout', checkout)

usersRouter.get('/logout',logout)

usersRouter.get('/updateAllValues',updateAllValues)

usersRouter.get('/wishlistAndCartCount',wishlistAndCartCount)

usersRouter.get('/myprofile',myprofile)

usersRouter.get('/cancelorder/:id',cancelorder)

usersRouter.get('/wishlist',wishlist)

usersRouter.post('/wishlist/:id',addToWishlist);

usersRouter.post('/addAddress',addAddress)

usersRouter.post('/addAddressCheckOut',addAddressCheckOut)

usersRouter.get('/orders',orders)

usersRouter.post('/editpersonaldetails',editpersonaldetails)

usersRouter.delete('/removeItemFromWishlist',removeItemFromWishlist)

usersRouter.post('/changepassword',changepassword)

usersRouter.post('/verifyPayment',verifyPayment)

usersRouter.post('/editaddress',editaddress)

usersRouter.get('/deleteaddress/:id',deleteaddress)

usersRouter.post('/placeorder',placeorder)

usersRouter.use(showError)

module.exports = usersRouter;
