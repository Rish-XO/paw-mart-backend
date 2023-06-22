if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

// psql connection
pool.connect();

// base middlewares
app.use(cors());
app.use(express.json());

// home page
app.get("/", (req, res) => {
  res.send("yoyy");
});

// create a post
app.post("/posts/new", async (req, res) => {
  try {
    const { category, breed, price, description } = req.body;
    const post = await pool.query(
      "INSERT INTO posts (category, breed, price, description) VALUES ($1,$2,$3,$4) RETURNING *",
      [category, breed, price, description]
    );
    console.log(post.rows[0]);
    res.json(post.rows[0]);
  } catch (error) {
    console.log(error.message);
  }
});

// get all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await pool.query("SELECT * FROM posts");
    res.json(posts.rows);
  } catch (error) {
    console.log(error.message);
  }
});

// get a post
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [
      id,
    ]);
    res.json(post.rows[0]);
  } catch (error) {}
});

// update a post
app.put("/posts/:id/edit", async (req, res) => {
  const { id } = req.params;
  const { category, breed, price, description } = req.body;
  try {
    const editPost = await pool.query(
      "UPDATE posts SET category = $1, breed = $2, price = $3, description =$4 WHERE post_id = $5 RETURNING *" , [category, breed, price, description, id]
    );
    res.json(editPost.rows[o])
  } catch (error) {}
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
