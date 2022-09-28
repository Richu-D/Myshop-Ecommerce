var express = require('express');
var adminRouter = express.Router();

const {
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


} = require('./admin.controller')


adminRouter.get('/',getLogin);

adminRouter.post('/',login);

adminRouter.use(authorisation) // Admin Authorisation Middleware

adminRouter.get('/home',home);

adminRouter.get('/categoryOffer',categoryOffer);

adminRouter.get('/coupons', coupons);

adminRouter.post('/addCategoryOffer',addCategoryOffer);

adminRouter.post('/addCoupon', addCoupon);

adminRouter.get('/deleteCategoryOffer/:id', deleteCategoryOffer);

adminRouter.get('/deleteCoupon/:id', deleteCoupon);

adminRouter.post('/graphdata',graphdata);

adminRouter.get('/add_product', addProductPage);

adminRouter.post('/add_product',addProduct);

adminRouter.post('/add_category',addCategory)

adminRouter.post('/categoryedit/:id',categoryedit)

adminRouter.get('/categorydelete/:id',categorydelete)

adminRouter.get('/allproducts', allproducts)

adminRouter.get('/chart',chart);

adminRouter.get('/edit_product/:id',editProductPage);

adminRouter.post('/edit_product/:id',editProduct)

adminRouter.get('/delete_product/:id', deleteProductPage);

adminRouter.get('/delete/:id', deleteUser);

adminRouter.get('/block/:id',blockUser)

adminRouter.get('/unblock/:id',unblockUser)

adminRouter.get('/allusers', allusers);

adminRouter.get('/logout',logout)

adminRouter.get('/orders',allOrders)

adminRouter.get('/orderstatus',changeOrderStatus)

adminRouter.get('/profile',profile)

adminRouter.get('/settings',settings)

adminRouter.get('/error', error);

adminRouter.use(showError)

module.exports = adminRouter;
