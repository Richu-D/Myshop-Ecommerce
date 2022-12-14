var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
var moment = require('moment')
const { resolve } = require('path');
var instance = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_SECRET_KEY,
});

module.exports={

    addProduct:(product,callback)=>{
        product.price=parseInt(product.price)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            let x = data.insertedId
            let y = x.toString()
            callback(y)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            try {                
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({}).toArray()
            resolve(products)
            } catch (error) {
                
            }
        })
    },
    wishlistAndCartCount:(email)=>{        
        return new Promise(async(resolve,reject)=>{
       try {
        
       
        let userName = await db.get().collection(collection.USERS).aggregate([
            {$match:{"email":email}},
            {$project:{_id:0,username:1}}
        ]).toArray()
             
        let wishlistCount = await db.get().collection(collection.WISHLIST).aggregate([
                {$match:{user:email}},
                {$project:{_id:0,'wishlistSize':{$size:"$wishlistItems"}}}
            ]).toArray()

        let cartCount = await db.get().collection(collection.CART).aggregate([
            {$match:{user:email}},
            {$project:{_id:0,'cartSize':{$size:"$products"}}}
        ]).toArray()

        resolve({wishlistCount:wishlistCount[0]?.wishlistSize||0,cartCount:cartCount[0]?.cartSize||0,userName:userName[0]?.username||"Guest User"});      
    } catch (error) {
        
    }
   
        })
    },
    addUser:async(userDetail)=>{
        return new Promise(async(resolve,reject)=>{
            
            try {
    let olduser = await db.get().collection(collection.USERS).findOne({"email":userDetail.email})
    console.log(olduser);
    if(olduser){
        
    }else{
        
   
    db.get().collection(collection.USERS).insertOne(userDetail).then(response=>{
       
        // adding referel wallet balance 50
        db.get().collection(collection.USERS).updateOne({"wallet.myReferelId":userDetail.wallet.whoReferedMe},{$inc: { "wallet.balance": 50}}).then(result =>{
            // adding user wallet balance by 100
            if(result.modifiedCount) db.get().collection(collection.USERS).updateOne({"wallet.myReferelId":userDetail.wallet.myReferelId},{$inc: { "wallet.balance": 100}})

        })

        resolve(response.insertedId)

        
    })
}
} catch (error) {
    console.log(error)   
}
   
})
        // update wallet if user have whoReferedMe field value and valid referel
    //    let whoReferedMeId = await db.get().collection(collection.USERS).aggregate([
    //         {$match:{email:userDetail.email}},
    //         {$project:{"whoReferedMe":"$wallet.whoReferedMe",_id:0}},
    //         {
    //             $lookup:
    //               {
    //                 from: collection.USERS,
    //                 localField: "whoReferedMe",
    //                 foreignField: "wallet.myReferelId",
    //                 as: "result"
    //               }
    //          },
    //          {
    //             $project:{whoReferedMe:0}
    //          }

    //     ]).toArray()
    //     if(whoReferedMeId[0]?.result[0]){
    //         whoReferedMeId = whoReferedMeId[0].result[0]._id;
    //         console.log(whoReferedMeId);
    //         // Adding 50 rs to whoreferedMe
    //         db.get().collection(collection.USERS).updateOne({"_id":whoReferedMeId},{ $inc: { "wallet.balance": 50}}).then(result =>{
    //             if(result.modifiedCount){
    //                 // Adding 100 rs to new user after referer get money
    //                 db.get().collection(collection.USERS).updateOne({"email":userDetail.email},{ $inc: { "wallet.balance": 100}})
    //             }
    //         })

    //     }
    
    },
    getUser:(email)=>{
        return new Promise(async(resolve,reject)=>{
            try {
let data = await db.get().collection(collection.USERS).findOne({email})
            resolve(data)
        } catch (error) {
                
        }
        })
    },
    
    updateUser:(email,data)=>{
        return new Promise((resolve,reject)=>{
            try {
            db.get().collection(collection.USERS).updateOne({'email':email},{
                $set:{
                    username:data.username,
                    email:data.email,
                    number:data.number                    
                }
            }).then((response)=>{
                resolve()
            })
    
    } catch (error) {
                
    }
})
},

    // deleteaddress(req.user.email,req.params.id)
    deleteaddress:(email,data)=>{
            try {            
            db.get().collection(collection.USERS).updateOne({'email':email},{
                $pull:{
                    'address': `${data}`   
                          
                }
                
        })    
    } catch (error) {
    }

    },
    // walletDetails
    walletDetails:(userId)=>{
        
        
        return new Promise(async(resolve,reject)=>{
            try {
            let users =await db.get().collection(collection.USERS).aggregate([
               {$match:{email:userId}} ,
            {$project:{"_id":0,"balance":"$wallet.balance","myReferelId":"$wallet.myReferelId","whoReferedMe":"$wallet.whoReferedMe"}}
            ]).toArray()
            resolve(users[0])
        } catch (error) {
        
        }
        })     
    
    },
    

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let users =await db.get().collection(collection.USERS).find().toArray()
            resolve(users)
            } catch (error) {
                
            }
            
        }) 
    },
    deleteUser:(id)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                db.get().collection(collection.USERS).remove({_id:objectId(id)}).then((response)=>{
                    resolve(response)
                })
            } catch (error) {
                
            }
        
    })
    },
    deleteProduct:(id)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(id)}).then((response)=>{
                    resolve(response)
                })
            } catch (error) {
                
            }
        
    })
    },
    getProductDetails:(id)=>{
        return new Promise(async(resolve,reject)=>{
            try {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)})
                    console.log("Product is ",product);
                    if(product){
                        resolve(product)   
                    }else{
                        
                        reject()            
                        
                    } 
                
            } catch (error) {
                reject() 
            }
            
            
        })
    },
    updateProduct:(id,data)=>{
        return new Promise((resolve,reject)=>{
            try {

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
                    $set:{
                        name:data.name,
                        description:data.description,
                        price:parseInt( data.price),
                        category:data.category                    
                    }
                }).then((response)=>{
                    resolve()
                })
                
            } catch (error) {
                
            }
            
        })
    },
    block:(id)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.USERS).updateOne({_id:objectId(id)},{
                    $set:{
                        block:true           
                     }
                }).then((response)=>{
                    resolve()
                })
            } catch (error) {
                
            }
           
        })
    },
    unblock:(id)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.USERS).updateOne({_id:objectId(id)},{
                    $set:{
                        block:false             
                  }
                }).then((response)=>{
                    resolve()
                })
            } catch (error) {
                
            }
            
        })
    },
    addCategory:(data)=>{
    try {
        db.get().collection(collection.CATEGORY).insertOne(data)
    } catch (error) {
        
    }
           
        },
    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let category =await db.get().collection(collection.CATEGORY).find().toArray()
                resolve(category)
            } catch (error) {
                
            }
        
    }) 
    },
    checkCategoryAvailable:(categoryName)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let availbleCategory =await db.get().collection(collection.CATEGORY).find({"category":categoryName}).toArray()
        resolve(availbleCategory[0])
            } catch (error) {
                
            }
        
    }) 
    },
    editCategory:(id,data)=>{
        try {
            db.get().collection(collection.CATEGORY).updateOne({_id:objectId(id)},{
                $set:{            
                    category:data.category                    
                }
            })
        } catch (error) {
            
        }
        
    },
    deleteCategory:(id)=>{
        try {
            db.get().collection(collection.CATEGORY).remove({_id:objectId(id)})
        } catch (error) {
            
        }
        
    },

    addToCart:(userId,productId)=>{
    
try {
    let proObj={
        item:objectId(productId),
        quantity:1
    }

    // checking user have cart
    return new Promise(async(resolve,reject)=>{
        try {
            let userCart = await db.get().collection(collection.CART).findOne({user:userId})
            if(userCart){

            let proExist = userCart.products.findIndex(product => product.item==productId)
            if(proExist != -1){

                console.log(`product exist`);

                db.get().collection(collection.CART).updateOne({user:userId,'products.item':objectId(productId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
            }else{

            db.get().collection(collection.CART).updateOne({user:userId},{$push:{products:proObj}})
            }




        }else{
            try {
                let cartObj = {
                    user:userId,
                    products:[proObj]
                }
                db.get().collection(collection.CART).insertOne(cartObj)
            } catch (error) {
                console.log(error);
            }
           

        }
        resolve()
        } catch (error) {
            console.log(error);
        }
        

    })
} catch (error) {
    console.log(error);
}
       
       

    },

    getAllCartItems:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let cartItems= await  db.get().collection(collection.CART).aggregate([
                    {
                        $match:{user:userId}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    }
                ]).toArray()
                console.log(cartItems);
                    resolve(cartItems)
            } catch (error) {
                console.log(error);
            }
        
        })
    },
    changeProductQuantity:async ({cartId,productId,count})=>{
        count = parseInt(count)
        quantity = await db.get().collection(collection.CART).aggregate([
           {$match:{_id:objectId(cartId)}},
           {$project:{_id:0,user:0}},
           {
            $unwind:"$products"
           },
           {
            $match:{"products.item":objectId(productId)}
           },
           {
            $project:{"products.quantity":1}
           }
        ]).toArray()
        quantity = await quantity[0]?.products?.quantity;
        
        return new Promise((resolve,reject)=>{
            try {
                
            if(count == -1 && quantity == 1){
                db.get().collection(collection.CART).updateOne({_id:objectId(cartId)},{
                    $pull:{products:{item:objectId(productId)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART).updateOne({_id:objectId(cartId),'products.item':objectId(productId)},
                {
                    $inc:{'products.$.quantity':count}
                }
                ).then((response)=>{
                    resolve(true)
                })       
            }

            } catch (error) {
                
            }
        })
    },
    
    removeCartItem:({cartId,productId})=>{
        return new Promise((resolve,reject)=>{
            try {
                
                db.get().collection(collection.CART).updateOne({_id:objectId(cartId)},{
                    $pull:{products:{item:objectId(productId)}}
                }).then((response)=>{
                    resolve({delete:true})
                })

            } catch (error) {
                
            }
             } )
            } ,
            // helpers.addOrder(order,grantTotal)

            addOrder:(order,details)=>{

                return new Promise((resolve,reject)=>{
                    try {
                        
                    db.get().collection(collection.ORDER).insertOne({order,details}).then((response)=>{
                        resolve(response.insertedId)
                    })
                    } catch (error) {
                        
                    }
                })
                
            },
            removeAllCartItem:(userId)=>{
                try {
                    db.get().collection(collection.CART).deleteOne({user:`${userId}`})
                } catch (error) {
                    
                }
                    
               
            },
            // getAllOrder(req.user.email)
            getAllOrder:(userId)=>{
                return new Promise(async(resolve,reject)=>{
                    try {
                        let orders =await  db.get().collection(collection.ORDER).aggregate([{$match:{"details.userId":`${userId}`}},{$sort:{_id:-1}}

                ]).toArray()
                resolve(orders)

                    } catch (error) {
                        
                    }
                

                })

            },

            // cancelOrder(req.user.email,req.params.id)
            cancelOrder:(orderId,cancelMsg)=>{
               
                return new Promise((resolve,reject)=>{
                    try {
                        db.get().collection(collection.ORDER).updateMany({_id:objectId(orderId)},{
                            $set:{
                               'details.status':`${cancelMsg}`
                            }
                        })
                        resolve()
                    } catch (error) {
                        
                    }
                    
    
                })
               
            },
            getAllOrderAvailable:()=>{
                return new Promise(async(resolve,reject)=>{
                    try {
                        let orderslist = await db.get().collection(collection.ORDER).aggregate([{$sort:{_id:-1}}]).toArray()
                        resolve(orderslist)
                        
                    } catch (error) {
                        
                    }

                })
            },
            search:(data)=>{
                return new Promise(async(resolve,reject)=>{
                    try {
                        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({$text:{$search:data}}).toArray()
                    resolve(products)
                    } catch (error) {
                        
                    }
                    
                })
            },

            searchRateRange:(params,min,max)=>{
                return new Promise(async(resolve,reject)=>{
                    try {
                        let minimum = Number(min)
                    let maximum = Number(max)
                    let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                     {$match:{$text:{$search:params}}},
                     {$match:{price:{$gte:minimum,$lte:maximum}}}
                    ]).toArray()
                    console.log(products);
                    resolve(products)
                    } catch (error) {
                        
                    }
                    
                })
            },

            addWishlist:(userId,productId)=>{
                    try {
                        db.get().collection(collection.WISHLIST).updateOne({user:userId},{ $addToSet: { wishlistItems: objectId(productId)} },{upsert:true})                        
                    } catch (error) {
                        
                    }

            },
            getWishlistItems:(userId)=>{

                return new Promise(async (resolve,reject)=>{
                        try {
                            let products = await db.get().collection(collection.WISHLIST).aggregate([
                                {$match:{user:userId}},
                                {$project:{_id:0,wishlistItems:1}},
                                // {$unwind:"wishlistItems"}
                                {
                                    $lookup:
                                      {
                                        from: collection.PRODUCT_COLLECTION,
                                        localField: "wishlistItems",
                                        foreignField: "_id",
                                        as: "product"
                                      }
                                 },
                                 {$project:{product:1}},
                                 {
                                    $unwind:"$product"
                                 }
                                 
                            ]).toArray()
        
                            
                           resolve(products)
                        } catch (error) {
                            reject(error)
                        }
                   
                })
            },






    addAddress:(email,data)=>{
    
        return new Promise( async(resolve,reject)=>{

            try {
                let  userdata = await db.get().collection(collection.USERS).findOne({email:email})
            if(userdata.address==undefined){
                db.get().collection(collection.USERS).updateOne({email:email},{
                        $set:{
        
                            address:[data]
                        }
                    })
            }else{
                db.get().collection(collection.USERS).updateOne({email:email},{$push:{address:data}})
               
            }
            } catch (error) {
                
            }
  
        }
        )

    },
    generateRazorpay:(orderId,grantTotal)=>{
        orderId = ""+orderId;

        return new Promise((resolve,reject)=>{
            try {
                var options = {
                    amount: grantTotal*100,
                    currency:"INR",
                    receipt:orderId
                   };
                   instance.orders.create(options,(err,order)=>{
                    resolve(order)
                   })
            } catch (error) {
                
            }
          
                
        })


    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            try {
                const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256',process.env.RAZORPAY_SECRET_KEY)

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
            } catch (error) {
                
            }
            
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.ORDER).updateOne({_id:objectId(orderId)},{
                    $set:{
                        'details.status':'placed'
                    }
                }).then(()=>{
                    resolve()
                })
            } catch (error) {
                
            }
            
        })
    },
    changePassword:(email,password)=>{

    try {
        db.get().collection(collection.USERS).updateOne({email:`${email}`},{
            $set:{password:`${password}`}})
    } catch (error) {
        
    }
        


        
    },

    editAddress:(email,oldaddress,newaddress)=>{
        try {
            db.get().collection(collection.USERS).updateOne(
                {$and:
                    [{"email":email},
                    {"address":oldaddress}]
                },
                {
                    $set:{"address.$":newaddress}
                }
                )
            
        } catch (error) {
            
        }
    
    
},
removeItemFromWishlist:(userId,productId)=>{
    try {
        db.get().collection(collection.WISHLIST).updateOne({user:userId},{$pull:{wishlistItems:objectId(productId)}})
        
    } catch (error) {
        
    }
},


    getAddress:(email)=>{
        return new Promise( async(resolve,reject)=>{
            try {
                let useraddress = db.get().collection(collection.USERS).findOne({email:email})
                resolve(useraddress)
            } catch (error) {
                
            }

            
        })

    },
    salesReport:()=>{
            // Today Sale           
            
            // Today Revenue
            // Total Revenue
            
            // Weekly Sales
            // Yearly Sales
        return new Promise( async(resolve,reject)=>{
        // var details = await db.get().collection(collection.CART).find('details.date')
        // resolve(details.toArray)



        // Total Users 
        var totalUsers = await db.get().collection(collection.USERS).count();


            // Total Delivered Orders & today Revenue
        var TodayrevenueAndDelevered = await db.get().collection(collection.ORDER).aggregate([
            {
                $match:{"details.status":"Delevered"}
            },
            {
                $project:{
                 date:{$convert: { input: "$_id", to: "date" } },order:1,details:1
                }
            },
            {
                $match:{
                    date:{$lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000))}
                }
            },

            { $group: {
              "_id": "tempId",
              "todayRevenue": { 
                  "$sum": { "$sum": "$details.grantTotal" } 
              },
                 "todaytotalOrders": { 
                "$sum": { "$sum": "$order.quantity" } 
                 }
          } }
          ]).toArray()

        // Total Sale Price
         // Total Order Count
        var totalSale = await db.get().collection(collection.ORDER).aggregate([
          { $group: {
            "_id": "tempId",
            "totalSale": { 
                "$sum": { "$sum": "$details.grantTotal" } 
            },
            "totalOrders": { 
                "$sum": { "$sum": "$order.quantity" } 
            }
        } }
        ]).toArray()


         // Total Delivered Sale Price
         // Total Delivered Order Count
         var deliveredTotalSale = await db.get().collection(collection.ORDER).aggregate([
            {
                $match:{"details.status":"Delevered"}
            },
            { $group: {
              "_id": "tempId",
              "totalRevenue": { 
                  "$sum": { "$sum": "$details.grantTotal" } 
              },
              "totalDelivered": { 
                  "$sum": { "$sum": "$order.quantity" } 
              }
          } }
          ]).toArray()

         

        // today Order Quantity todaytotalOrders
        var todayOrders = await db.get().collection(collection.ORDER).aggregate([
            {
                $project:{
                 date:{$convert: { input: "$_id", to: "date" } },order:1,details:1
                }
            },
            {
                $match:{
                    date:{$lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000))}
                }
            },

            { $group: {
              "_id": "tempId",
              "todaySales": { 
                  "$sum": { "$sum": "$details.grantTotal" } 
              },
                 "todaytotalOrders": { 
                "$sum": { "$sum": "$order.quantity" } 
                 }
          } }
          ]).toArray()

     
                           
       
          resolve({data:totalSale[0],totalUsers:totalUsers,todayOrders:todayOrders[0],deliveredTotalSale:deliveredTotalSale[0],TodayrevenueAndDelevered:TodayrevenueAndDelevered[0]})
    })
    },

graphdata:()=>{
    return new Promise( async(resolve,reject)=>{

   //   WeeklySales
   var weeklySales = await db.get().collection(collection.ORDER).aggregate([
    {$match:{"details.status":"Delevered"}},
    {
        $project:{
         date:{$convert: { input: "$_id", to: "date" } },total:"$details.grantTotal"
        }
    },
   {
    $match:{
    date:{
    $lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000*7))
    }
     }
   },
   {
    $group:{
       _id:{ $dayOfWeek:"$date"},
       total:{$sum:"$total"}
    }           
   },
   {
    $project:{
        date:"$_id",
        total:"$total",
        _id:0
    }
   },
   {
     $sort: {date:1}
   }
  ]).toArray()

//   console.log(weeklySales[0]);

// monthly Sales
var monthlySales = await db.get().collection(collection.ORDER).aggregate([
    {$match:{"details.status":"Delevered"}},
    {
        $project:{
         date:{$convert: { input: "$_id", to: "date" } },total:"$details.grantTotal"
        }
    },
   {
    $match:{
    date:{
    $lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000*365))
    }
     }
   },
   {
    $group:{
       _id:{ $month:"$date"},
       total:{$sum:"$total"}
    }           
   },
   {
    $project:{
        month:"$_id",
        total:"$total",
        _id:0
    }
   }
]).toArray()

// console.log(monthlySales);


// Yearly Sales
var yearlySales = await db.get().collection(collection.ORDER).aggregate([
    {$match:{"details.status":"Delevered"}},
    {
        $project:{
         date:{$convert: { input: "$_id", to: "date" } },total:"$details.grantTotal"
        }
    },
   
   {
    $group:{
       _id:{ $year:"$date"},
       total:{$sum:"$total"}
    }           
   },
   {
    $project:{
        year:"$_id",
        total:"$total",
        _id:0
    }
   }
]).toArray()

// console.log(yearlySales);
resolve({weeklySales,monthlySales,yearlySales})

    })
},
// addCoupon
addCategoryOffer:(categoryOffer)=>{
    return new Promise( async(resolve,reject)=>{
        try {
            db.get().collection(collection.CATEGORY).updateOne({"category":categoryOffer.categoryName},{$set:{"offer":Number(categoryOffer.offer),"offerStarts":new Date(categoryOffer.offerStarts),"offerExpire":new Date(categoryOffer.offerExpire),starts:moment(new Date(categoryOffer.offerStarts)).format("MMM Do YY"),ends:moment(new Date(categoryOffer.offerExpire)).format("MMM Do YY")}}).then(() =>{
                resolve()
            })
        } catch (error) {
            
        }
    
    })
},
// getCategoryOfferProducts
getCategoryOfferProducts:()=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let categorys = await db.get().collection(collection.CATEGORY).find({"offer":{$exists: true}}).toArray()
       resolve(categorys)
        } catch (error) {
            
        }
       
    })
    
},
// addCoupon
addCoupon:(couponOffer)=>{
    try {
    db.get().collection(collection.COUPON).updateOne({"couponName":couponOffer.couponName},{$set:{"offer":Number(couponOffer.offer),"offerUpto":Number(couponOffer.offerUpto),"offerStarts":new Date(couponOffer.offerStarts),"offerExpire":new Date(couponOffer.offerExpire)}},{upsert:true}) 
        
    } catch (error) {
        
    }
},
// getCoupons
getCoupons:()=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let Coupons = await db.get().collection(collection.COUPON).find({}).toArray()
            resolve(Coupons)
        } catch (error) {
            
        }
       
    })
    
},

getValidCoupons:()=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let Coupons = await db.get().collection(collection.COUPON).find({status:true}).toArray()
            resolve(Coupons)
        } catch (error) {
            
        }
       
    })
    
},

// checkCoupon
checkCoupon:(coupon)=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let Coupon = await db.get().collection(collection.COUPON).aggregate([
                {$match:{$and:[{"couponName":coupon.coupon},{"status":true}]}},
                {$project:{
                    _id:0,
                    offer:1,
                    couponName:1,
                    offerUpto:1
                }}
            ]).toArray()
               resolve(Coupon[0])
        } catch (error) {
            
        }
       
    })
    
},

// helpers.findNonUsedCoupons(req.user.email,req.body.coupon)
findNonUsedCoupons:(userId,coupon)=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let Coupon = await db.get().collection(collection.USERS).findOne({$and:[{"email":userId},{"usedCoupons":coupon}]})
    if(Coupon) resolve(true)       
    resolve(false)
        } catch (error) {
            
        }
       
    })
},

// getUsedCoupons
getUsedCoupons:(userId)=>{
    return new Promise( async(resolve,reject)=>{
        try {
            let usedCoupons = await db.get().collection(collection.USERS).aggregate([
                {$match:{"email":userId}},
                {$project:{_id:0,usedCoupons:1}},
                {$lookup:{
                    from: collection.COUPON,
                    localField: "usedCoupons",
                    foreignField: "couponName",
                    as: "Coupons"
                  }},
                {$project:{usedCoupons:0}},
               ]).toArray()
               resolve(usedCoupons[0]?.Coupons)
        } catch (error) {
            
        }
       
    })

},

// addUsedCoupon(req.body.email,details['couponName'])
addUsedCoupon: (userId,couponName)=>{
    try {
        db.get().collection(collection.USERS).updateOne({email:userId},{$addToSet:{usedCoupons:couponName}})
        
    } catch (error) {
        
    }

},

//removeCategoryOffer(req.params.id)
removeCategoryOffer:(categoryName)=>{
    try {
        db.get().collection(collection.CATEGORY).updateOne({"category":categoryName},{$unset:{"offer":1,"offerStarts":1,"offerExpire":1,"status":1,"updated":1,"offerPercentage":1}})
        db.get().collection(collection.PRODUCT_COLLECTION).updateMany({$and:[{offerPrice:{ $exists: true }},{category:categoryName}]},{$unset:{offerPrice:1,offerPercentage:1}})
        
    } catch (error) {
        
    }
},

// removeCouponOffer
removeCouponOffer:(couponName)=>{
    try {
        db.get().collection(collection.COUPON).deleteOne({"couponName":couponName})   
        
    } catch (error) {
        
    }
},

// couponsOffersStatusUpdate

couponsOffersStatusUpdate:async ()=>{
    try {
        db.get().collection(collection.COUPON).updateMany({$and:[{offerStarts:{$lte:new Date()}},{offerExpire:{$gte:new Date()}}]},{$set:{status:true}}).then(result =>{
            console.log("inside helper set offer status true",result);
        })
        // set offer status false
        db.get().collection(collection.CATEGORY).updateMany({$or:[{offerStarts:{$gt:new Date()}},{offerExpire:{$lt:new Date()}}]},{$set:{status:false}}).then(result =>{
            
                console.log("inside helper set offer status false",result);
            }
        )
    } catch (error) {
        
    }
    // Set offer status true


},

// activateOffers
categoryOffersStatusUpdate:async ()=>{

    try {
        
    
    // setting Active status for active offers in category
 db.get().collection(collection.CATEGORY).updateMany({$and:[{offerStarts:{$lte:new Date()}},{offerExpire:{$gte:new Date()}}]},{$set:{status:true}}).then(async result =>{
    
    if(result.modifiedCount){
        // updated true

       let modifyProductCollections = await db.get().collection(collection.CATEGORY).aggregate([
        {$match:{status:true,updated:{ $exists: false }}},
        {$project:{category:true,offer:true,_id:0}},
        {
            $lookup:
            {
            from: collection.PRODUCT_COLLECTION,
            localField: "category",
            foreignField: "category",
            as: "items"
            }
        },
        {
            $unwind:"$items"
        },
        {
            $project:{
                category:true,
                offer:true,
                _id:"$items._id",
                price:"$items.price",                
            }
        } 
        ]).toArray()

        for(let i = 0;i<modifyProductCollections.length;++i){
     db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:modifyProductCollections[i]._id},{$set:{"offerPrice":Math.round(modifyProductCollections[i].price-(modifyProductCollections[i].offer*(modifyProductCollections[i].price/100))),"offerPercentage":modifyProductCollections[i].offer}})
        }
   



    //    updated true set cheyyanam so that no repitation again
    db.get().collection(collection.CATEGORY).updateMany({status:true},{$set:{updated:true}})


    }
 }
    
    
 )
 // udate offer price inside product collection // remove offers
 let a = await db.get().collection(collection.CATEGORY).aggregate([
    {$match:{offerExpire:{$lt:new Date()}}},
    {$project:{_id:0,category:1}}

]).toArray()

for(let i=0;i<a.length;++i){
    console.log(a[i].category);
    db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:a[i].category},{$unset:{offerPercentage:1,offerPrice:1}})
    db.get().collection(collection.CATEGORY).updateMany({category:a[i].category},{$unset:{offer:1,offerExpire:1,offerStarts:1,status:1,updated:1}})
}


// removing expired category offer
//


// remove offer price inside product collection

} catch (error) {
        
}
    

},








}