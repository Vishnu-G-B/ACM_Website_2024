const express = require('express');
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const passport = require("passport");
const crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
const { body, validationResult } = require("express-validator");
const { error } = require('console');

router.get('/', function (req, res, next) {
  res.render("sign-up");
});

router.get("/sign-up", function (req, res, next) {
  res.render("sign-up", {
    name: undefined,
    username: undefined,
    errors: undefined
  });
});

router.get("/login", function (req, res, next) {
  res.render("login", {
    username: undefined,
    errors: undefined,
  });
});

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    console.log(user, info)
    if (err) { return next(err); }
    if (!user) {
      return res.render("login", {
        username: user.username,
        errors: info.message,
      });
    }
    req.login(user, function (err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
}
);

router.post("/sign-up", [
  body("username", "Must be your Manipal Learner Email!")
    .notEmpty()
    .escape()
    .trim()
    .isEmail()
    .custom(async (value) => {
      submittedDomain = value.split("@");
      if (!submittedDomain.includes("learner.manipal.edu")) {
        throw new Error("Must be your Manipal Learner Email!");
      }
    }),
  body("name", "Invalid Name")
    .notEmpty()
    .escape()
    .trim(),
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      console.log(errors.array().at(0));
      if (!errors.isEmpty()) {
        res.render("sign-up", {
          name: req.body.name ?? "",
          username: req.body.username ?? "",
          errors: errors.array().at(0),
        });
        return;
      }
      // console.log(req.body.name);
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          throw err;
        } else {
          const existingUser = await User.findOne({ username: req.body.username });
          console.log(existingUser);
          if (existingUser) {
            console.log("User already exists");
            res.render("sign-up", {
              name: req.body.name ?? "",
              username: req.body.username ?? "",
              errors: {msg:"This email is already in use, if you have forgotten your password please contact us through the number on the contact page"},
            });
            return;
          }
          const user = new User({
            name: req.body.name,
            username: req.body.username,
            password: hashedPassword,
          });
          const result = await user.save();
          req.login(user, (err) => {
            if (err) {
              console.error(err);
              return next(err);
            }
            return res.redirect("/");
          });
        }
      })
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }
]);

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
