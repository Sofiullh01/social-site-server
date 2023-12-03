const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

require("dotenv").config();

// port
const port = process.env.PORT || 5000;
// middleweres
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.upyz80t.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("lastAssignment").collection("users");
    const postCollection = client.db("lastAssignment").collection("post");

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // middlewer
    const varifyToken = (req, res, next) => {
      console.log("inside varifytoken", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.roal === "admin";
      if (isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    // user api
    app.post("/users", varifyToken, async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // creat admin api
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          roal: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // get admin
    app.get(
      "/users/admin/:email",
      varifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        // if(email !== req.decoded.email){
        //   return res.status(403).send({message:'unauthorized access'})
        // };
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.roal === "admin";
        }
        res.send({ admin });
      }
    );
    // use verify admin
    
    // post related api
    app.post("/post", async (req, res) => {
      const postData = req.body;
      const result = await postCollection.insertOne(postData);
      res.send(result);
    });
    app.get("/post", async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    });
    // update upVote
    app.patch("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await postCollection.findOne(query);
      const updateDoc = {
        $set: {
          upVote: data.upVote + 1,
        },
      };
      const result = await postCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // update downVote
    app.patch("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await postCollection.findOne(query);
      const updateDoc = {
        $set: {
          downVote: data.downVote + 1,
        },
      };
      const result = await postCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Okey Server");
});
app.listen(port, () => {
  console.log(`Server is runing on ${port}`);
});
