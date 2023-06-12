if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

// psql connection
pool.connect();

app.use(cors());
app.use(express.json());

// home page
app.get("/", (req, res) => {
  res.send("yoyy");
});

// create a post
app.post("/posts/new", async (req, res) => {
  const { category, breed, price, description } = req.body;
  const post = await pool.query(
    "INSERT INTO posts (category, breed, price, description) VALUES ('DOG','PERSIAN','123', 'BOI') RETURNING *"
  );
  console.log(post.rows[0]);
  res.json(post.rows[0])
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
