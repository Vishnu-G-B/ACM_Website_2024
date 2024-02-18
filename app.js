const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bcrypt = require("bcryptjs");
const session = require("express-session");
const passport = require("passport");
const crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user")
const compression = require("compression");
require('dotenv').config();
// Not using helmet as I don't have a whitelist of URL's to allow since there are a lot of imports in the ejs files.
// const helmet = require('helmet');


const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');

const app = express();

const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_URI;
const passport_secret = process.env.PASSPORT_SECRET;

main().catch((err) => {
  console.log(err);
});
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
//

passport.use(new LocalStrategy(async function verify(username, password, done) {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      console.log("user problem, did not find the user");
      return done(null, false, { message: "No such email is registered!" });
    };
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("password problem password mismatch");
      return done(null, false, { message: "Incorrect Password!" })
    };
    console.log("no problem should login");
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
app.use(session({ secret: passport_secret, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use((req,res,next) => {
  if(req.session.darkMode === undefined){
    req.session.darkMode = false;
  };
  res.locals.darkMode = req.session.darkMode;
  console.log(res.locals.darkMode);
  next();
});

app.post("/toggleTheme",(req,res,next) => {
  req.session.darkMode = !req.session.darkMode;
  res.json({darkMode:req.session.darkMode})
});

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/events', eventsRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;