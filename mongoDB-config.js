require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function runDB() {
    try {
      // Connect the client to the server
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      return true; 
    } catch (error) {
      console.error("MongoDB connection or operation failed:", error);
      throw error; // זורק את השגיאה מחדש כדי שהקוד הקורא יוכל לטפל בה
    } 
  }


const runDbInstance =  runDB();



module.exports = {
    runDB,
    runDbInstance
}