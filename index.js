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
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const { Socket } = require("socket.io");
const moment = require("moment");

const io = require("socket.io")(3001, { 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
});

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
    const {
      category,
      breed,
      price,
      description,
      user_id,
      imageUrlsFromServer,
    } = req.body;
    // console.log("urls from frontend", imageUrlsFromServer);
    const post = await pool.query(
      "INSERT INTO posts (category, breed, price, description, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [category, breed, price, description, user_id]
    );
    // console.log(post.rows[0]);
    const post_id = post.rows[0].post_id;

    // putting urls in image table
    const insertImagePromises = imageUrlsFromServer.map(async (url) => {
      const postImage = await pool.query(
        "INSERT INTO image (url, post_id) VALUES ($1,$2) RETURNING *",
        [url, post_id]
      );
      // console.log("inseted images", postImage.rows[0]);
      return postImage.rows[0];
    });

    const insertedImages = await Promise.all(insertImagePromises);

    res.json(post.rows[0]);
  } catch (error) {
    console.log(error.message);
  }
});

// get all posts
app.get("/posts", async (req, res) => {
  try {
    const query = `
      SELECT posts.*, image.url AS first_url
      FROM posts
      LEFT JOIN (
        SELECT DISTINCT ON (post_id) *
        FROM image
        ORDER BY post_id, image_id
      ) AS image ON posts.post_id = image.post_id
    `;
    const result = await pool.query(query);
    const posts = result.rows.map((row) => {
      return {
        ...row,
        first_url: row.first_url || null, // Set null if first_url is undefined
      };
    });
    // console.log(posts);
    res.json(posts);
  } catch (error) {
    console.log(error.message);
  }
});

// get a person's posts
app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
  SELECT posts.*, image.url AS first_url
  FROM posts
  LEFT JOIN (
    SELECT DISTINCT ON (post_id) *
    FROM image
    ORDER BY post_id, image_id
  ) AS image ON posts.post_id = image.post_id
  WHERE posts.user_id = $1
`;
 const result = await pool.query(query, [id])
 console.log('rrrrrrrrrrrrrraaa'+result.rows);
 res.json(result.rows)
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
    const images = await pool.query(
      "SELECT * FROM image WHERE post_id = $1 ORDER BY image_id ASC",
      [id]
    );
    const user_id = post.rows[0].user_id;
    const owner = await pool.query(
      "SELECT firstname, lastname FROM users WHERE user_id = $1",
      [user_id]
    );
    // console.log("urls from tableeee", images.rows);
    res.json({ post: post.rows[0], urls: images.rows, owner: owner.rows[0] });
  } catch (error) {
    console.log(error.message);
  }
});

// update a post
app.put("/posts/:id/edit", async (req, res) => {
  const { id } = req.params;
  const { category, breed, price, description } = req.body;
  const { imageUrls } = req.body;
  const { imageUrlsFromServer } = req.body;
  console.log("images from frontend", imageUrls);
  try {
    const editPost = await pool.query(
      "UPDATE posts SET category = $1, breed = $2, price = $3, description =$4 WHERE post_id = $5 RETURNING *",
      [category, breed, price, description, id]
    );

    //delete image urls from table
    if (imageUrls && imageUrls.length > 0) {
      const existingImages = imageUrls.map((id) => id.image_id);

      //creating custom placeholder for existingImages for query
      const placeholders = existingImages.map((_, index) => `$${index + 2}`);

      const placeholdersString = placeholders.join(", ");

      // console.log("existing images", existingImages, placeholders );
      await pool.query(
        `DELETE FROM image WHERE post_id = $1 AND image_id NOT IN (${placeholdersString})`,
        [id, ...existingImages]
      );
    }

    if (imageUrls && imageUrls.length === 0) {
      await pool.query("DELETE FROM image WHERE post_id = $1", [id]);
    }

    // saving new image uploads
    if (imageUrlsFromServer) {
      const insertImagePromises = imageUrlsFromServer.map(async (url) => {
        const postImage = await pool.query(
          "INSERT INTO image (url, post_id) VALUES ($1,$2) RETURNING *",
          [url, id]
        );
        return postImage.rows[0];
      });
      const insertedImages = await Promise.all(insertImagePromises);
    }
    res.json(editPost.rows[0]);
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ error: "An error occurred while updating the post." });
  }
});

//register and login
app.use("/", authRouter);

// aws upload
const region = "eu-north-1";
const bucketName = "pawmartbucket";
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESSKEY;
const baseURL = process.env.BUCKET_STORAGE_URL;

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
  region,
  signatureVersion: "v4",

  // apiVersion: '2006-03-01', // Specify the desired S3 API version
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      // Generate a unique key for each uploaded file
      const uniqueKey = `${Date.now()}_${file.originalname}`;
      cb(null, `${uniqueKey}`); // Specify the path in your bucket
    },
  }),
  limits: { fileSize: 52428800 }, // 50MB file size limit
});

app.post("/uploadimages", upload.array("image"), (req, res) => {
  try {
    const imageUrls = req.files.map((file) => file.location);
    console.log(imageUrls);
    res.json({ imageUrls: imageUrls });
  } catch (error) {}
});

// chat endpoints

// Express route for creating a room
app.post("/roomId", async (req, res) => {
  const { ownerID, user_id, post_id } = req.body;

  try {
    // Check if a matching room already exists
    const existingRoomQuery = await pool.query(
      "SELECT room_id FROM roommembers WHERE user_id IN ($1, $2) AND EXISTS (SELECT 1 FROM rooms WHERE post_id = $3 AND rooms.room_id = roommembers.room_id)",
      [ownerID, user_id, post_id]
    );

    if (existingRoomQuery.rows.length > 0) {
      // Return the existing room ID
      const roomID = existingRoomQuery.rows[0].room_id;
      return res.status(200).json({ roomID });
    }

    // Create a new row in the room table if room doesn't exist
    const roomQuery = await pool.query(
      "INSERT INTO rooms (post_id) VALUES ($1) RETURNING *",
      [post_id]
    );

    const roomID = roomQuery.rows[0].room_id;

    // Save ownerID and user_id in the roommembers table
    await pool.query(
      "INSERT INTO roommembers (room_id, user_id) VALUES ($1, $2)",
      [roomID, ownerID]
    );
    await pool.query(
      "INSERT INTO roommembers (room_id, user_id) VALUES ($1, $2)",
      [roomID, user_id]
    );

    res.status(200).json({ roomID });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ error: "An error occurred while creating the room." });
  }
});

//save a message
app.post("/saveMessage", async (req, res) => {
  const { content, user_id, room_id, created_at } = req.body;
  try {
    // saving the message to table
    await pool.query(
      "INSERT INTO messages (room_id, user_id, content, created_at) VALUES ($1,$2,$3,$4)",
      [room_id, user_id, content, created_at]
    );

    // updating the lst msg in room table
    await pool.query(
      "UPDATE rooms SET last_message = $1, last_time = $2 WHERE room_id = $3",
      [content, created_at, room_id]
    );
    console.log("success");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occured while sending message" });
  }
});

// get all chats
app.get("/getAllChats", async (req, res) => {
  try {
    const chatRooms = await pool.query(`
    SELECT DISTINCT ON (rooms.room_id)
           rooms.*, 
           posts.*, 
           users1.user_id AS user1_id,
           users1.firstname AS user1_firstname,
           users1.lastname AS user1_lastname,
           users2.user_id AS user2_id,
           users2.firstname AS user2_firstname,
           users2.lastname AS user2_lastname,
           image.url
    FROM rooms
    JOIN posts ON rooms.post_id = posts.post_id
    JOIN roommembers rm1 ON rooms.room_id = rm1.room_id
    JOIN users users1 ON rm1.user_id = users1.user_id
    JOIN roommembers rm2 ON rooms.room_id = rm2.room_id AND rm1.user_id <> rm2.user_id
    JOIN users users2 ON rm2.user_id = users2.user_id
    JOIN (
      SELECT post_id, MIN(url) AS url
      FROM image
      GROUP BY post_id
    ) image ON rooms.post_id = image.post_id
     WHERE rooms.last_message IS NOT NULL
    GROUP BY rooms.room_id, 
             posts.post_id, 
             users1.user_id,
             users1.firstname,
             users1.lastname,
             users2.user_id,
             users2.firstname,
             users2.lastname,
             image.url
  `);

    const sortedChatRooms = chatRooms.rows.sort((a, b) => {
      const dateA = moment(a.last_time);
      const dateB = moment(b.last_time);
      return dateB.diff(dateA);
    });
    // console.log(chatRooms.rows);
    res.status(200).json(sortedChatRooms);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "server issue, try again" });
  }
});

//get a chat
app.get("/getMessages/:roomID", async (req, res) => {
  const roomID = req.params.roomID;
  const chat = await pool.query(
    "SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC",
    [roomID]
  );
  console.log("ppppppppppppppppppppppp", chat.rows);
  res.status(200).json(chat.rows);
});

// chat
let currentRoom = null;
io.on("connection", (socket) => {
  // joining a room
  socket.on("joinRoom", ({ roomID }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      console.log("leaving the room");
    }
    socket.join(roomID);
    console.log("joining a room");
    currentRoom = roomID;
    console.log("the current room", currentRoom);
    const clients = io.sockets.adapter.rooms.get(roomID);
    console.log(clients, "cccccccccccccccccccccccccccccc");
  });

  socket.on("chatMessage", ({ roomID, message }) => {
    // console.log(roomID, message, "*****************************s");
    io.to(roomID).emit("chatMessage", message);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    console.log("socket Closed :::::::::::");
    currentRoom = null;
  });
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
