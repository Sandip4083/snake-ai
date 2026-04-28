const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://sandipcloud26_db_user:PYFvSvBZsa98SfZD@cluster0.lnrfqqu.mongodb.net/snakeai";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db("snakeai");
    const docs = await db.collection("scores").find({}).limit(1).toArray();
    console.log("Docs:", docs);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
