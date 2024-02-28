const express = require('express');
const router = express.Router();
const Events = require("../models/events")

/* GET home page. */
router.get('/', async function(req, res, next) {
  const eventsList = await Events.find({}).sort("-date").limit(3).exec();
  res.render('index', {
    events: eventsList,
  });
});

router.get("/team",function(req,res,next){
  res.render("team");
});

router.get("/contact",function(req,res,next){
  req.session.darkMode = true;
  res.locals.darkMode = req.session.darkMode;
  res.render("contact")
})

router.get("/about", function(req,res,next) {
  res.render("about");
});

router.get("/comingsoon",function(req,res,next){
  res.render("inprogress");
});

module.exports = router;
