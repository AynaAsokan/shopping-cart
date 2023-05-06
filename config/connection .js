const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

//module.exports.connect=function(done){
    const url='mongodb://127.0.0.1:27017'
    const client=new mongoClient(url);
    const dbname='shopping'

    async function main(){
    await client.connect()
        console.log('successfully connected')
        //if(err) return done(err)
        //state.db=data.db(dbname)
        //const db=client.db(dbname)
        // done()
    
    }
main()
.then (console.log)
.catch(console.error)
.finally(()=>client.close())


//module.exports.get=function(){
//return state.db
//}
