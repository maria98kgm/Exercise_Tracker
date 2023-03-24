const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

app.use(bodyParser.urlencoded({ extendent: false }));
app.use(cors());
app.use(express.static("public"));

const users = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  res.json(
    users.map((item) => ({
      username: item.username,
      _id: item._id,
    }))
  );
});

app.post("/api/users", (req, res) => {
  users.push({ username: req.body.username, _id: users.length + 1, log: [] });
  res.json({ username: req.body.username, _id: users.length });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const ind = users.findIndex((item) => item._id == req.params._id);
  const exercises = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
  };

  users[ind].log.push(exercises);

  res.json({
    ...exercises,
    username: users[ind].username,
    _id: users[ind]._id,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const user = users.find((item) => item._id == req.params._id);

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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// http://localhost:3000/api/users/1/logs?from=2010-01-01&to=2020-01-01&limit=2
