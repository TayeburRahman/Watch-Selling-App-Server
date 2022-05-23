const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const ObjectID = require("mongodb").ObjectId;
require("dotenv").config();
const app = express();
var admin = require("firebase-admin");
const port = process.env.PORT || 5000;

// Firebase Admin SDK configuration
var serviceAccount = require("./watch-selling-app-firebase-adminsdk-9i32f-0ab5357a6f.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yjiyu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//* JWT VERIFIED FUNCTION
async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split('Bearer ')[1] 
      try {
          const deCodedUser = await admin.auth().verifyIdToken(idToken) 
          req.deCodedUserEmail = deCodedUser.email
      }
      catch {

      }
  }
  next()
}

//* DATABASE CONNECTION 
async function run() {
  await client.connect();
  const database = client.db("SmartWatch");
  const productsCollection = database.collection("AllProduct");
  const oderCollection = database.collection("AllOder");
  const usersCollection = database.collection("users");
  const reviewCollection = database.collection("review");

  // POST API
  app.post("/addProducts", async (req, res) => {
    const service = req.body;
    const result = await productsCollection.insertOne(service);
    res.json(result);
  });

  // GET API
  app.get("/product", async (req, res) => {
    const cursor = productsCollection.find({});
    const services = await cursor.toArray();
    res.send(services);
  });
  // Update Product 
    app.put("/updateProduct/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = { _id: ObjectID(id) };
      const options = { upseert: true };
      const updateDoc = {
        $set: {
          name: update.name,
          oldPrice: update.oldPrice,
          updatePrice: update.updatePrice,
          // rating: update.rating,
          // vendor: update.vendor,
          // category: update.category,
          // img: update.img,
          description: update.description,
        },
      };
      const result = await productsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });


  // POST API user OderPlc
  app.post("/booking", async (req, res) => {
    const oder = req.body;
    const result = await oderCollection.insertOne(oder);
    res.json(result);
  });

  // GET AllOder
  app.get("/allOder", async (req, res) => {
    const cursor = oderCollection.find({});
    const allOder = await cursor.toArray();
    res.send(allOder);
  });

  // GET user OderPlc
  app.get("/userOder/:email",verifyToken, async (req, res) => { 
    let query = {}
    const email = req.params.email  
    if(req.deCodedUserEmail === email){
      query = {userEmail: email}
      const result = await oderCollection.find(query).toArray();
      res.send(result);
    }else{
      res.status(401).json({message: 'user not authorized'})
    }
     
  });

  // DELETE Orders~
  app.delete("/userOder/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectID(id) };
    const result = await oderCollection.deleteOne(query);
    res.json(result);
  });

  // Update Orders
  app.put("/updateOrder/:id", async (req, res) => {
    const id = req.params.id;
    const update = req.body;
    const filter = { _id: ObjectID(id) };
    const options = { upseert: true };
    const updateDoc = {
      $set: {
        state: update.state,
      },
    };
    const result = await oderCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  });

  // user data save database [name , email]
  app.post("/users", async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.json(result);
  });

  // user data save database [name , email] google login
  app.put("/users", async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const options = { upsert: true };
    const updateDoc = { $set: user };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    res.json(result);
  });

  // admin crate
  app.put("/users/admin", async (req, res) => {
    const user = req.body;
    console.log("put", user);
    const email = { email: user.email };
    const updateDoc = { $set: { role: "admin" } };
    const result = await usersCollection.updateOne(email, updateDoc);
    res.json(result);
  });

  // GET API [fast on admin chack & admin Make new admin]
  app.get("/users/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if (user?.role == "admin") {
      isAdmin = true;
    }
    res.json({ admin: isAdmin });
  });

  // POST API [Review]
  app.post("/review", async (req, res) => {
    const review = req.body;
    const result = await reviewCollection.insertOne(review);
    res.json(result);
  });

  // GET API  [Review]
  app.get("/review", async (req, res) => {
    const cursor = reviewCollection.find({});
    const services = await cursor.toArray();
    res.send(services);
  });

  // DELETE Orders~
  app.delete("/deleteProduct/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectID(id) };
    const result = await productsCollection.deleteOne(query);
    console.log("hjg", result);
    res.json(result);
  });

  app.get("/users/:email", async (req, res) => {});
  try {
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Genius Server");
});

app.listen(port, () => {
  console.log(`running genius server ${process.env.PORT}`);
});
