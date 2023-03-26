const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

require("dotenv").config();

// connects to MDB
mongoose.connect(process.env.MONGO_URI, {
  useNewURLParser: true,
  useUnifiedTopology: true,
});

// check if connection succeeded
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);

// parses the request body
app.use(express.urlencoded({ extendent: true }));

// enables cores
app.use(cors());

// add public directory with all assets
app.use(express.static("public"));

// routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const user = new User({ username: req.body.username, log: [] });

  user
    .save()
    .then((doc) => {
      res.json({ username: doc.username, _id: doc._id });
    })
    .catch((err) => {
      res.json({ err: err });
    });
});

app.get("/api/users", async (req, res) => {
  const allUsers = await User.find({});
  res.json(
    allUsers.map((item) => ({ username: item.username, _id: item._id }))
  );
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await User.findById(req.params._id);

  if (req.query.from) {
    const from = new Date(req.query.from);
    const to = req.query.to ? new Date(req.query.to) : null;

    const exercises = user.log.filter((item) => {
      if (to) return new Date(item.date) > from && new Date(item.date) < to;
      return new Date(item.date) > from;
    });

    res.json({
      username: user.username,
      _id: user._id,
      count: user.log.length,
      log: req.query.limit ? exercises.slice(0, req.query.limit) : exercises,
    });
  } else if (req.query.to) {
    const to = req.query.to ? new Date(req.query.to) : null;

    const exercises = user.log.filter((item) => {
      return new Date(item.date) < to;
    });

    res.json({
      username: user.username,
      _id: user._id,
      count: user.log.length,
      log: req.query.limit ? exercises.slice(0, req.query.limit) : exercises,
    });
  } else if (req.query.limit) {
    res.json({
      username: user.username,
      _id: user._id,
      count: user.log.length,
      log: req.query.limit ? user.log.slice(0, req.query.limit) : user.log,
    });
  } else {
    res.json({
      username: user.username,
      _id: user._id,
      count: user.log.length,
      log: user.log,
    });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findById(req.params._id);
  const exercises = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
  };

  user.log.push(exercises);
  user
    .save()
    .then(() => {
      res.json({
        ...exercises,
        username: user.username,
        _id: user._id,
      });
    })
    .catch((err) => {
      res.json({ err: err });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
