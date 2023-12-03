const express = require("express");
const cors = require("cors");
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

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // post related api
    app.post("/post", async (req, res) => {
      const postData = req.body;
      const result = await postCollection.insertOne(postData);
      res.send(result);
    });
    app.get('/post',async(req,res)=>{
      const result = await postCollection.find().toArray();
      res.send(result)
  })
  // update upVote
  app.patch('/post/:id', async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const data = await postCollection.findOne(query)
      const updateDoc = {
        $set: {
          upVote: data.upVote + 1
        },
      }
      const result = await postCollection.updateOne(query,updateDoc);
      res.send(result)
  });
  // update downVote
  app.patch('/post/:id', async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const data = await postCollection.findOne(query)
      const updateDoc = {
        $set: {
          downVote: data.downVote + 1
        },
      }
      const result = await postCollection.updateOne(query,updateDoc);
      res.send(result)
  });
    

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
