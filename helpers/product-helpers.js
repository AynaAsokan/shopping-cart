const { response } = require('express');
const  ObjectId  = require('mongodb').ObjectId;
var collection=require("../config/collections")

//var db=require('mongodb ').db
const mongoClient=require('mongodb').MongoClient
const url='mongodb://127.0.0.1:27017'
const client=new mongoClient(url);
const dbName= 'Shopping'


//const db=require("./config/connection ")
const db=client.db(dbName)
  //const collection=db.collection('user')
  
  //const Promise=require('promise')
module.exports={
    addProduct:(product,callback)=>{
        console.log(product);
        db.collection('product').insertOne(product).then((data)=>{

        console.log(data);
            callback(data.insertedId)



        })


    },//these are all objects
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.collection(collection.PRODUCTS_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
        db.collection(collection.PRODUCTS_COLLECTION).deleteOne({_id:new ObjectId(proId)}).then((response)=>{ resolve(response)})
           //function(err, response) {
           //if (err) throw err; 
            //console.log(response)
           // resolve(response)

           //})
           
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.collection(collection.PRODUCTS_COLLECTION).findOne({_id:new ObjectId(proId)}).then((product)=>{ resolve(product)})
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{ 
            db.collection(collection.PRODUCTS_COLLECTION).updateOne({_id:new ObjectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve()
            })

            

            
        
            
    

        })
    }
}