const mongoose = require('mongoose');
const Job = require('./models/Job'); // Ensure path is correct

const MONGO_URI = "mongodb://127.0.0.1:27017/cleanup_playground";

const seedPlayground = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Playground DB...");

    // Clear old test data
    await Job.deleteMany({});

    // Create a fresh test job
    const testJob = await Job.create({
      _id: "6633a1b2c3d4e5f67890abcd", // Matches your Bruno variable
      customerName: "Blackburn Logistics Test",
      location: "Mesaieed Industrial Zone",
      status: "active",
      photos: ["test-image-url.jpg"]
    });

    console.log("Playground ready! Job ID:", testJob._id);
    process.exit();
  } catch (err) {
    console.error("Seed Error:", err);
    process.exit(1);
  }
};

seedPlayground();