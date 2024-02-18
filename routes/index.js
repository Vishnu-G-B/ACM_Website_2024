const express = require('express');
const router = express.Router();
const Events = require("../models/events")

/* GET home page. */
router.get('/', async function(req, res, next) {
  const eventsList = await Events.find({}).sort("-date").limit(3).exec();
  console.log(eventsList);
  res.render('index', {
    events: eventsList,
  });
});

router.get("/team",function(req,res,next){
  res.render("team");
});

router.get("/contact",function(req,res,next){
  res.render("contact")
})

router.get("/comingsoon",function(req,res,next){
  res.render("inprogress");
});

module.exports = router;
