const { Movie, validate } = require("../models/movie");
const { Genre } = require("../models/genre");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const moment = require("moment");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const multer = require("multer");

router.get("/", async (req, res) => {
  const movies = await Movie.find()
    .select("-__v")
    .sort("name");
  res.send(movies);
});
const storage = multer.diskStorage({
  destination: "../videos",
  filename: (req, file, cb) => {
    const filename = `will be changed`
    cb(null, filename)
  },
})

const upload = multer({ storage })

router.post(
  "/",
  [
    auth,
    (req, res, next) => {
      storage.filename = (req, file, cb) => {
        const filename = `${req.body.title}.${path.extname(file.originalname)}`
        cb(null, filename)
      }
      next()
    },
    upload.single("video"),
  ],
  async (req, res) => {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const genre = await Genre.findById(req.body.genreId)
    if (!genre) return res.status(400).send("Invalid genre.")

    const movie = new Movie({
      _id : mongoose.Types.ObjectId(),
      title: req.body.title,
      genre: {
        _id: genre._id,
        name: genre.name,
      },
      numberInStock: req.body.numberInStock,
      dailyRentalRate: req.body.dailyRentalRate,
      publishDate: moment().toJSON(),
      video :`${req.body.title}.${path.extname(file.originalname)}`
    });

    await movie.save()
    res.send(movie)
  }
)


router.put("/:id", [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      genre: {
        _id: genre._id,
        name: genre.name
      },
      numberInStock: req.body.numberInStock,
      dailyRentalRate: req.body.dailyRentalRate
    },
    { new: true }
  );

  if (!movie)
    return res.status(404).send("The movie with the given ID was not found.");

  res.send(movie);
});

router.delete("/:id", [auth, admin], async (req, res) => {
  const movie = await Movie.findByIdAndRemove(req.params.id);

  if (!movie)
    return res.status(404).send("The movie with the given ID was not found.");

  res.send(movie);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const movie = await Movie.findById(req.params.id).select("-__v");

  if (!movie)
    return res.status(404).send("The movie with the given ID was not found.");

  res.send(movie);
});

module.exports = router;
