var db = require('../confic/connection')
var collection = require('../confic/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
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
                if(proExist!=-1){
                    db.get().collection(collection.CART).updateOne({user:objectId(userId),'products.item':objectId(productId)},
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
                console.log("No cart for this user");
                let cartObj = {
                            user:userId,
                            products:[proObj]
                        }
                        console.log(cartObj);
                        console.log(typeof cartObj);
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
        // console.log(cartItems[0].products);
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

            addOrder:(order,grantTotal)=>{

                return new Promise((resolve,reject)=>{
                    db.get().collection(collection.ORDER).insertOne({order,grantTotal})
                }).then((response)=>{
                    resolve()
                })
                
            },
            removeAllCartItem:(userId)=>{
                    db.get().collection(collection.CART).deleteOne({user:`${userId}`})
               
            },
            // getAllOrder(req.user.email)
            getAllOrder:(userId)=>{
                return new Promise(async(resolve,reject)=>{
                  let orders =await  db.get().collection(collection.ORDER).find({"order.userId":`${userId}`}).toArray()
                    resolve(orders)
                })

            },

            // cancelOrder(req.user.email,req.params.id)
            cancelOrder:(orderId)=>{

                db.get().collection(collection.ORDER).updateMany({_id:objectId(orderId)},{
                    $set:{
                        // pending
                    }
                })


            }







    // addAddress:(email,data)=>{
    //     console.log(data);
    //     console.log(email);
    //     data = data.address
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.USERS).updateOne({email:email},{
    //             $push:{
    //                 address:data
    //             }
    //         })

    //     })




    // // }
    // addAddress:(userId,productId)=>{
    //     let addressObj={
    //         email:objectId(userid),
    //         address:[]
    //     }

    //     // checking user have cart
    //     return new Promise(async(resolve,reject)=>{
    //         let userCart = await db.get().collection(collection.CART).findOne({user:userId})
    //         if(userCart){
    //             let proExist = userCart.products.findIndex(product => product.item==productId)
    //             if(proExist!=-1){
    //                 db.get().collection(collection.CART).updateOne({user:objectId(userId),'products.item':objectId(productId)},
    //                 {
    //                     $inc:{'products.$.quantity':1}
    //                 }
    //                 ).then(()=>{
    //                     resolve()
    //                 })
    //             }else{

    //             db.get().collection(collection.CART).updateOne({user:userId},{$push:{products:proObj}})
    //             }
    //         }else{
    //             console.log("No cart for this user");
    //             let cartObj = {
    //                         user:userId,
    //                         products:[proObj]
    //                     }
    //                     console.log(cartObj);
    //                     console.log(typeof cartObj);
    //                     db.get().collection(collection.CART).insertOne(cartObj)

    //         }
    //         resolve()

    //     })
       

    // }



}