var db = require('../confic/connection')
var collection = require('../confic/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
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
                    price:data.price,
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
    }






}