var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const { ObjectId } = require('mongodb');
var router = express.Router();
//const{render}=require('../app')
//var productHelper=require('../helpers/product-helpers')


/* GET users listing. */


/* GET home page. */
router.get('/delete-product/(:id)',(req,res)=>{
let proId=req.params.id
productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
});
router.get('/edit-product/(:id)',async(req,res)=>{
let product=await productHelpers.getProductDetails(req.params.id)
console.log(product)
res.render('admin/edit-product',{product}) 
})
router.post('/edit-product/(:id)',(req,res)=>{
 let insertedId=req.params.id
  productHelpers.updateProduct( req.params.id,req.body).then((response)=>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+insertedId+'.jpg')
    }
  })
})

router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    //console.log(products)
    res.render('admin/view-products',{admin:true,products});

  } )
 });

router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post("/add-product",(req,res)=>{
  //console.log(req.body);
// console.log(req.files.image);
productHelpers.addProduct(req.body,(insertedId)=>{
  let image=req.files.image
  console.log(insertedId);
  image.mv('./public/product-images/'+insertedId+'.jpg',(err,done)=>{
    if(!err){
      res.render('admin/add-product')
    }else{
      console.log(err);
      }
  res.render('admin/add-product')

})
  });
  
  
  
})


module.exports = router;
