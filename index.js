const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const http = require("http")
const socketIO = require("socket.io");

app.use(cors());


const server = http.createServer(app)
    ;


const io = socketIO(server, {
    cors: {
        origin: "https://simple-socket-io-crud.web.app",
        methods: ["GET", "POST", "DELETE", "PUT"]
    },
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qqdj2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemsCollection = client.db('simpleCrud').collection('items')
        io.on("connection", (socket) => {
            socket.on("get_items", async () => {
                const items = await itemsCollection.find().toArray();
                io.emit("get_items", items);
            });

            socket.on("edit_item", async (data) => {
                const id = data.id;
                const item = {
                    title: data.title,
                    description: data.description
                }
                const filter = { _id: ObjectId(id) };
                const option = { upsert: true };
                const updateDoc = {
                    $set: item,
                };
                await itemsCollection.updateOne(filter, updateDoc, option);
                const items = await itemsCollection.find().toArray();
                io.emit("get_items", items);
            });

            socket.on("add_item", async (data) => {
                const item = {
                    title: data.title,
                    description: data.description
                }
                await itemsCollection.insertOne(item);
                const items = await itemsCollection.find().toArray();
                io.emit("get_items", items);
            });

            socket.on("delete_item", async (data) => {
                const id = data.id;
                const filter = { _id: ObjectId(id) };
                await itemsCollection.deleteOne(filter);
                const items = await itemsCollection.find().toArray();
                io.emit("get_items", items);
            });
        })
    }
    finally { }
}
run().catch(console.dir)

server.listen(5000, () => {
    console.log("Server is running");
})