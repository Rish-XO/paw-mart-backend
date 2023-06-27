if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const authRouter = require("./routes/Auth");
const authorization = require("./middleware/authorization");
const multer = require("multer");
const AWS = require('aws-sdk')
const multerS3 = require('multer-s3');

// psql connection
pool.connect();

// base middlewares
app.use(cors());
app.use(express.json());

// home page
app.get("/", (req, res) => { 
  res.send("yoyy");
});

// create a post,, remember to check middlewares issues in future
app.post("/posts/new", async (req, res) => {
  try {
    const { category, breed, price, description, user_id } = req.body;
    const post = await pool.query(
      "INSERT INTO posts (category, breed, price, description, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [category, breed, price, description, user_id]
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

// get a post,
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
      "UPDATE posts SET category = $1, breed = $2, price = $3, description =$4 WHERE post_id = $5 RETURNING *",
      [category, breed, price, description, id]
    );
    res.json(editPost.rows[o]);
  } catch (error) {}
});

//register and login
app.use("/", authRouter);

// aws upload
const region = "eu-north-1";
const bucketName = "pawmartbucket";
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESSKEY;
const baseURL = process.env.BUCKET_STORAGE_URL

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
  region,
  signatureVersion: 'v4'

  // apiVersion: '2006-03-01', // Specify the desired S3 API version
});


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      // Generate a unique key for each uploaded file
      const uniqueKey = `${Date.now()}_${file.originalname}`;
      cb(null, `pawmart-images/${uniqueKey}`); // Specify the path in your bucket
    },
  }),
  limits: { fileSize: 52428800 }, // 50MB file size limit
});

app.post('/uploadimages',upload.array('image'),(req, res) => {

try {
  const imageUrls = req.files.map((file) => file.location);
 console.log(imageUrls);
  res.json({imageUrls:imageUrls})
} catch (error) {
  
}

})

app.listen(5000, () => {
  console.log("listening on 5000");
});
