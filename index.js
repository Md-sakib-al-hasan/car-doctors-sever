const express = require("express");
const cors = require("cors");
const app = express()
const jwt = require('jsonwebtoken')
const cookieparse= require('cookie-parser')
const port = process.env.PORT || 5000
require('dotenv').config()
app.use(cors({
  origin:['http://localhost:5173','https://car-doctors-client-508aa.web.app','https://car-doctors-client-508aa.firebaseapp.com'],
  credentials:true,
}));
app.use(express.json());
app.use(cookieparse());

//our created middle wear

const logger = async(req,res,next) => {
   console.log('called:',req.host,req.originalUrl)
   next();
}
// const verifyToken = async(req,res,next) => {
//   const token =req.cookies?.token;
//   console.log('value of token in middleware', token)
//   if(!token) {
//     return res.status(401).send({message:'not authorized'})
//   }
//   jwt.verify(token,process.env.Access_Token_SECRET,(err,decoded) => {
//      if(err){
//       return res.status(401).send({message:'unauthrited'})
//      }
//      console.log(decoded)
//      req.user = decoded;
//      next();
//   })

// }

const verifyToken = async(req,res,next) => {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message:"unuthraige"})
  }

  jwt.verify(token,process.env.Access_Token_SECRET, (error,decoded) =>{
      if(error){
        return res.status(401).send({message:"unuthraige"})
      }
      req.user = decoded;
      console.log(decoded)
      next();
  })

}

console.log(process.env.user_DB)

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.user_DB}:${process.env.user_Key}@cluster0.wn8gk0s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db('Cars-doctors')
    const servicescollection = database.collection('services')
    const bookingcollection = database.collection('booking')
 // Authrelated
    app.post('/jwt',logger,async(req,res) => {
         const user = req.body;
         const token= jwt.sign(user,process.env.Access_Token_SECRET,{expiresIn:'1h'})
         res.cookie('token',token,{
          httpOnly:true,
          secure:false,
         }) 
         res.send({success:true})
    })
    //services related 
    app.get('/services',logger,async(req,res) => {
      const  course = servicescollection.find();
      const result = await course.toArray();
      res.send(result);
    })
    app.get('/services/:id',async(req,res) => {
      const id = req.params.id
      const query = { _id:new ObjectId(id)}
      const options = {
        // Include only the `title` and `imdb` fields in each returned document
        projection: {title:1,price:1,service_id:1,img:1 },
      };
      const result = await servicescollection.findOne(query,options)
      res.send(result)
    })

    //booking

    app.post('/bookings',async(req,res) => {
      const booking =req.body
      const result = await bookingcollection.insertOne(booking);
       res.send(result)

    })
    app.get('/bookings',logger,verifyToken,async(req,res) => {
      console.log(req.query)
      // console.log(req.cookies.token)
      console.log("HHHHHHHHHHHHHHHHH",req.user)
      if(req.user.email !== req.query.email){
        return res.status(401).send({message:"forbidden acess"})
      }
      let query={};
      if (req.query?.email){
         query= {email: req.query.email}
      }
      const course = bookingcollection.find(query)
      const result = await course.toArray();
        res.send(result)
       
    })

    app.delete('/booingds/:id',async(req,res) => {
        const id = req.params.id
        const query = {_id:new ObjectId(id)}
        const result = await bookingcollection.deleteOne(query);
        res.send(result)
    })

    app.patch('/bookings/:id',async(req,res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const udateBooking = req.body;
        const updatedoc = {
          $set: {
            status: udateBooking.status
          }
        }
        const result = await bookingcollection.updateOne(filter,updatedoc)
        res.send(result)
        console.log(udateBooking)

    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) => {
    res.send("doctor is runding")
})

app.listen(port,() => {
    console.log("your server is runig 5000")
})