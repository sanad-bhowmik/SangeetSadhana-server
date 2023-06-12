const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    //bearer token
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


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
        const myclsCollection = client.db('musicSchool').collection('mycls');
        const paymentCollection = client.db('musicSchool').collection('payment');
        const addclsCollection = client.db('musicSchool').collection('addcls');


        // addcls
        app.post('/addcls', async (req, res) => {
            const user = req.body;
            const result = await addclsCollection.insertOne(user);
            res.send(result)
        });

        app.get('/addcls', async (req, res) => {
            const cursor = addclsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });


        // Fetch a single class
        app.get('/addcls/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await addclsCollection.findOne(filter);
            res.send(result);
        });

        app.patch('/addcls/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: id };
            const updateDoc = {
              $set: req.body, // Use req.body directly as the update document
            };
          
            try {
              const existingDoc = await addclsCollection.findOne(filter);
              if (!existingDoc) {
                return res.status(404).send({ error: 'Class not found.' });
              }
          
              const result = await addclsCollection.updateOne(filter, updateDoc);
              res.send(result);
            } catch (error) {
              console.log('Error updating class:', error);
              res.status(500).send({ error: 'Failed to update class. Please try again.' });
            }
          });
          
          
        // addcls


        //mycls
        app.post('/mycls', async (req, res) => {
            const user = req.body;
            const result = await myclsCollection.insertOne(user);
            res.send(result)
        });

        app.get('/mycls', async (req, res) => {
            const cursor = myclsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });

        // app.delete('/mycls/:id', async (req, res) => {
        //     const classId = req.params.classId;

        //     try {
        //         const result = await myclsCollection.deleteOne({ classId: classId });
        //         res.send(result);
        //     } catch (error) {
        //         console.log('Error deleting class:', error);
        //         res.status(500).send({ error: 'Failed to delete class. Please try again.' });
        //     }
        // });

        app.delete('/mycls/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: id };
            const result = await myclsCollection.deleteOne(filter);
            res.send(result);
        });
        //mycls

        //payment
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            res.send(result)
        });

        app.get('/payments', async (req, res) => {
            const cursor = paymentCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        //payment
        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })
        //jwt
        //user collection
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });
        // admin
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })

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
        //instructor
        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
            res.send(result);
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


        // delete user
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });
        // delete user

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
        });

        app.post('/teachers', async (req, res) => {
            const classData = req.body;
            const result = await teachersCollection.insertOne(classData);
            res.send(result);
        });
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