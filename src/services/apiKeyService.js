const { db, mongoose } = require("../mongodb");
const crypto = require("crypto");

function generateApiKey() {
  return crypto.randomBytes(32).toString("hex");
}

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 365 },
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

async function createLogBookApiKey() {
  const key = generateApiKey();
  const description = "driver logbook";
  const apiKey = new ApiKey({ key, description });
  return await apiKey.save();
}

(async () => {
  try {
    db.once("open", async () => {
      console.log("Connected to MongoDB");

      const apiKey = await createLogBookApiKey("Test API Key");
      console.log("Generated API Key:", apiKey);

      mongoose.connection.close();
    });
  } catch (err) {
    console.error("Error:", err.message);
    mongoose.connection.close();
  }
})();
