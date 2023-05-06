const { ObjectId } = require('mongodb');
var collection=require("../config/collections")

const mongoClient=require('mongodb').MongoClient
const url='mongodb://127.0.0.1:27017'
const client=new mongoClient(url);
const dbName= 'Shopping'
const bcrypt=require('bcrypt');
const { propfind } = require('../routes/user');
const saltRounds=10;

//const db=require("./config/connection ")
const db=client.db(dbName)
const Razorpay=require('razorpay');
const { resolve } = require('path');
var instance = new Razorpay({ key_id: 'rzp_test_fTUneBnC7XgBlC', key_secret: 'wysvSDVz748OyUF5UDiQtTdA' })
module.exports={
    doSignup:(userData)=>{
return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,saltRounds)
        db.collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{resolve(data)})
       
   })

},
doLogin:(userData)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let user=await db.collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
        if(user){
                bcrypt.compare(userData.Password,user.Password,function(err,status){
                if(status){
                    console.log("login success");
                    response.user=user
                    response.status=true
                    resolve(response)
                }else{

                    console.log("login failed");
                    resolve({status:false})
                }
            })

        }else{
            console.log('login failed');
            
            resolve({status:false})
        }
    })
},
addToCart:(proId,userId)=>{
    let proObj= ({
item:new ObjectId(proId),
 quantity:1
      
   });
   console.log("index created")
   
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId)
            console.log(proExist);
            if(proExist!=-1){
                db.collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId),"products.item":new ObjectId(proId)},
                {
                    $inc:{"products.$.quantity":1}
                }) .then(()=>{resolve()})
            }else{
         db.collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId)},
           {
            
                  $push:{products:proObj}
                

           }).then ((response)=>{resolve()
       })
    }
        }else{
            let cartObj={
                user:new ObjectId(userId),
                            products:[proObj]
                //products:[new ObjectId(proId)]
            }
            db.collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{

                 resolve()
            })
        }
    })
},
getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems= await db.collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:new ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:"$products.item",
                    quantity:"$products.quantity"

                }
            },
            {
                $lookup:{
                    from:collection.PRODUCTS_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:"product"
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                }
            }
            //{
               // $lookup:{
                   // from:'product',
                    //let :{prodList:'$products'},
                    //pipeline:[
                       // {
                           // $match:{
                               // $expr:{
                                    //$in:['$_id','$$prodList']
                                //}
                           // }

                        //}
                   // ],
                   // as:'cartItems'
               // }
           // }
           
        ]).toArray()
        //console.log(cartItems[0].products);
        resolve(cartItems)
    })
},
getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
        if(cart){
            count=cart.products.length

        }
        resolve(count)

    })
},
changeProductQuantity:(details)=>{
  details.count=parseInt(details.count)
  details.quantity=parseInt(details.quantity)

 return new Promise((resolve,reject)=>{
    if(details.count==-1 && details.quantity==1){
        db.collection(collection.CART_COLLECTION)
        .updateOne({_id:new ObjectId(details.cart)},
        {
            $pull:{products:{item:new ObjectId(details.product)}}
        }).then((response)=>{
            resolve({removeProduct:true})
        })
    }else{
        db.collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
    {
        $inc:{"products.$.quantity":details.count}
    }) .then((response)=>{resolve({status:true})
    })

    }
})
},
getTotalAmount:(userId)=>{
    
    return new Promise(async(resolve,reject)=>{
        let total= await db.collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:new ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:"$products.item",
                    quantity:"$products.quantity"

                }
            },
            {
                $lookup:{
                    from:collection.PRODUCTS_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:"product"
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                }
            },
            {
                $group:{
                  _id:null,
                total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}}
                }
            }
            
           
        ]).toArray()
     console.log(total[0].total);
       resolve(total[0].total)
       //console.log(total)
       //resolve(total)
    })

},
   placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
        console.log(order,products,total);
        let status=order["payment-method"]==="COD"?"placed":"pending"
        let orderObj={
            deliveryDetails:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode
            
            },
            userId:new ObjectId(order.userId),
            PaymentMethod:order["payment-method"],
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()

        }
        db.collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
            //console.log("order id:",insertedId)
            resolve(response.insertedId)

        })
    })

   },
getCartProductList:(userId)=>{
return new Promise(async(resolve,reject)=>{
    let cart=await db.collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
    resolve(cart.products)
})
},
getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userId);
        let orders= await db.collection(collection.ORDER_COLLECTION)
        .find({userId:new ObjectId(userId)}).toArray()
        console.log(orders);
        resolve(orders)
    })
},
getOrdersProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems= await db.collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:new ObjectId(orderId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:"$products.item",
                    quantity:"$products.quantity"

                }
            },
            {
                $lookup:{
                    from:collection.PRODUCTS_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:"product"
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                }
            },
        
            
           
        ]).toArray()
       console.log(orderItems);
        resolve(orderItems)
    })
},
generateRazorpay:(orderId,total)=>{
    console.log(orderId)
    return new Promise((resolve,reject)=>{
        var options={
  amount: total*100,
  currency: "INR",
  receipt: ""+orderId,
        };
  instance.orders.create(options,function(err,order){
    console.log("New Order:",order);
    resolve(order)
  });
  
  
  })

    
},
verifyPayment:(details)=>{

    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
        let hmac=crypto.createHmac('sha256','wysvSDVz748OyUF5UDiQtTdA')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac= hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
        
    })
},
changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.collection(collection.ORDER_COLLECTION)
        .updateOne({_id:new ObjectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
    })
}

}








