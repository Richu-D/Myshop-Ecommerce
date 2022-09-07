var db = require('../confic/connection')
var collection = require('../confic/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
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
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        }) 
    },
    addUser:(userDetail)=>{
        db.get().collection(collection.USERS).insertOne(userDetail)
    },
    getUser:(email)=>{
        return new Promise(async(resolve,reject)=>{
let data = await db.get().collection(collection.USERS).findOne({email})
            resolve(data)
        })
    },
    
    updateUser:(email,data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS).updateOne({'email':email},{
                $set:{
                    username:data.username,
                    email:data.email,
                    number:data.number                    
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    // deleteaddress(req.user.email,req.params.id)
    deleteaddress:(email,data)=>{
       
            db.get().collection(collection.USERS).updateOne({'email':email},{
                $pull:{
                    'address': `${data}`      
                          
                }
                
        })
    },

    

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users =await db.get().collection(collection.USERS).find().toArray()
            resolve(users)
        }) 
    },
    deleteUser:(id)=>{
        return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.USERS).remove({_id:objectId(id)}).then((response)=>{
            resolve(response)
        })
    })
    },
    deleteProduct:(id)=>{
        return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(id)}).then((response)=>{
            resolve(response)
        })
    })
    },
    getProductDetails:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((product)=>{
                
                resolve(product)
            })
            
        })
    },
    updateProduct:(id,data)=>{
        return new Promise((resolve,reject)=>{
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
        })
    },
    block:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS).updateOne({_id:objectId(id)},{
                $set:{
                    block:true           
                 }
            }).then((response)=>{
                resolve()
            })
        })
    },
    unblock:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS).updateOne({_id:objectId(id)},{
                $set:{
                    block:false             
              }
            }).then((response)=>{
                resolve()
            })
        })
    },
    addCategory:(data)=>{
            db.get().collection(collection.CATEGORY).insertOne(data)
        },
    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
        let category =await db.get().collection(collection.CATEGORY).find().toArray()
        resolve(category)
    }) 
    },
    editCategory:(id,data)=>{
        db.get().collection(collection.CATEGORY).updateOne({_id:objectId(id)},{
            $set:{            
                category:data.category                    
            }
        })
    },
    deleteCategory:(id)=>{
        db.get().collection(collection.CATEGORY).remove({_id:objectId(id)})
    },

    addToCart:(userId,productId)=>{

        let proObj={
            item:objectId(productId),
            quantity:1
        }

        // checking user have cart
        return new Promise(async(resolve,reject)=>{
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
                let cartObj = {
                            user:userId,
                            products:[proObj]
                        }
                        db.get().collection(collection.CART).insertOne(cartObj)

            }
            resolve()

        })
       

    },

    getAllCartItems:(userId)=>{
        return new Promise(async(resolve,reject)=>{
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
            resolve(cartItems)
        })
    },
    changeProductQuantity:async ({cartId,productId,count,quantity})=>{
        count = parseInt(count)
        quantity = parseInt(quantity)
        return new Promise((resolve,reject)=>{
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
        })
    },
    
    removeCartItem:({cartId,productId})=>{
        return new Promise((resolve,reject)=>{
                db.get().collection(collection.CART).updateOne({_id:objectId(cartId)},{
                    $pull:{products:{item:objectId(productId)}}
                }).then((response)=>{
                    resolve({delete:true})
                })
             } )
            } ,
            // helpers.addOrder(order,grantTotal)

            addOrder:(order,details)=>{

                return new Promise((resolve,reject)=>{
                    db.get().collection(collection.ORDER).insertOne({order,details}).then((response)=>{
                        resolve(response.insertedId)
                    })
                })
                
            },
            removeAllCartItem:(userId)=>{
                    db.get().collection(collection.CART).deleteOne({user:`${userId}`})
               
            },
            // getAllOrder(req.user.email)
            getAllOrder:(userId)=>{
                return new Promise(async(resolve,reject)=>{
                let orders =await  db.get().collection(collection.ORDER).aggregate([{$match:{"details.userId":`${userId}`}},{$sort:{_id:-1}}

                ]).toArray()
                resolve(orders)

                })

            },

            // cancelOrder(req.user.email,req.params.id)
            cancelOrder:(orderId,cancelMsg)=>{

                db.get().collection(collection.ORDER).updateMany({_id:objectId(orderId)},{
                    $set:{
                       'details.status':`${cancelMsg}`
                    }
                })


            },
            getAllOrderAvailable:()=>{
                return new Promise(async(resolve,reject)=>{
                    // let orderslist = await db.get().collection(collection.ORDER).find().toArray()

                    let orderslist = await db.get().collection(collection.ORDER).aggregate([{$sort:{_id:-1}}]).toArray()






                    resolve(orderslist)
                })
            },
            search:(data)=>{
                return new Promise(async(resolve,reject)=>{

                    let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({$text:{$search:data}}).toArray()
                    resolve(products)
                })
            },
            addWishlist:(userId,productId)=>{

                    db.get().collection(collection.WISHLIST).updateOne({user:userId},{ $addToSet: { wishlistItems: objectId(productId)} },{upsert:true})

            },
            getWishlistItems:(userId)=>{

                console.log(`Inside helpers `,userId);
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
            
            // 

        }
        )

    },
    generateRazorpay:(orderId,grantTotal)=>{
        orderId = ""+orderId;

        return new Promise((resolve,reject)=>{

           var options = {
            amount: grantTotal*100,
            currency:"INR",
            receipt:orderId
           };
           instance.orders.create(options,(err,order)=>{
            resolve(order)
           })
                
        })


    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256',process.env.RAZORPAY_SECRET_KEY)

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER).updateOne({_id:objectId(orderId)},{
                $set:{
                    'details.status':'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    changePassword:(email,password)=>{
        db.get().collection(collection.USERS).updateOne({email:`${email}`},{
            $set:{password:`${password}`}})


        // return new Promise((resolve,reject)=>{
        //     db.get().collection(collection.ORDER).updateOne({_id:objectId(orderId)},{
        //         $set:{
        //             'details.status':'placed'
        //         }
        //     }).then(()=>{
        //         resolve()
        //     })
        // })
    },
    editAddress:(email,oldaddress,newaddress)=>{
    
    db.get().collection(collection.USERS).updateOne(
        {$and:
            [{"email":email},
            {"address":oldaddress}]
        },
        {
            $set:{"address.$":newaddress}
        }
        )
    
},
removeItemFromWishlist:(userId,productId)=>{
    console.log(`inside helpers and this is userId ${userId} and this is productId ${productId}`);
    db.get().collection(collection.WISHLIST).updateOne({user:userId},{$pull:{wishlistItems:objectId(productId)}})
},


    getAddress:(email)=>{
        return new Promise( async(resolve,reject)=>{

            let useraddress = db.get().collection(collection.USERS).findOne({email:email})
            resolve(useraddress)
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
    }



}