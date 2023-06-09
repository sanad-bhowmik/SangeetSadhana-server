const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i3vn5zp.mongodb.net/?retryWrites=true&w=majority`;

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

        const classesCollection = client.db('musicSchool').collection('classes');
        const teachersCollection = client.db('musicSchool').collection('teachers');
        const usersCollection = client.db('musicSchool').collection('users');

        //user collection
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })


        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
              $set: {
                role: 'instructor'
              }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
          });
          
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        });
        //user collection

        // class collection
        app.get('/classes', async (req, res) => {
            const cursor = classesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        // class collection

        // teachers collection
        app.get('/teachers', async (req, res) => {
            const cursor = teachersCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        // teachers collection

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Music is running')
})

app.listen(port, () => {
    console.log(`Music server ir running on port ${port}`);
})