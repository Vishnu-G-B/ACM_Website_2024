const express = require('express');
const router = express.Router();
const User = require("../models/user");
const Events = require("../models/events");
const asyncHandler = require("express-async-handler");
const user = require('../models/user');

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

router.get("/", async function (req, res, next) {
    const eventsList = await Events.find({}).exec();
    // console.log(eventsList);
    eventsList.forEach((event, index) => {
        console.log(event.name, event.over);
    });
    res.render("events", { events: eventsList });
});

router.get("/:eventID", async function (req, res, next) {
    const eventID = req.params.eventID;
    const currUser = res.locals.currentUser;
    const event = await Events.findById(eventID);
    if(currUser){
        let uniqueCode;
        console.log(currUser);
        for (let obj of currUser.attendedEvents){
            if(obj.eventId.toString()==eventID){
                uniqueCode = obj.uniqueCode;
                break;
            }
        }
        if(uniqueCode){
            return res.render("event",{
                eventID: eventID,
                userUniqueCode:uniqueCode,
                eventInfo: event,
            });
        }
    }
    console.log(eventID);
    return res.render("event", {
        eventID: eventID,
        userUniqueCode:undefined,
        eventInfo: event,
    });
});


// Eventually REWRITE this, it is very much shitty and not optimal
// Specifically fk around with the mongo calls to reduce server load.
// Also find better ways to match event ids and user ids instead of running loops 5-6 times. 
router.get("/register/:eventID", async function (req, res, next) {
    const eventID = req.params.eventID;
    const currUser = res.locals.currentUser;
    // console.log(currUser);
    if (!currUser) {
        console.log("user is logged out redirecting to the login page");
        return res.render("login", {
            username: undefined,
            errors: "You must be logged in to register for this event",
        });
    } else {
        try {
            const event = await Events.findById(eventID,"registeredUsers");
            const updateUser = await User.findById(currUser._id);
            if (!event) {
                console.error("Event not found");
                return res.redirect("/");
            } else {
                // console.log(event);
                const userID = (currUser._id).toString();
                const userRegistered = event.registeredUsers.some(id => id.toString()===userID);
                if(userRegistered){
                    console.log("The current user is already registered redirecting to event page and passing the unique code");
                    let uniqueCode;
                    for(let obj of updateUser.attendedEvents){
                        if(obj.eventId.toString() === eventID){
                            uniqueCode = obj.uniqueCode;
                            break;
                        }
                    }
                    return res.render("event",{
                        eventID:eventID,
                        userUniqueCode: uniqueCode,
                        eventInfo: event,
                    });
                }

                // updating the event array with the user ID
                event.registeredUsers.push(currUser._id);
                try {
                    await event.save();
                    console.log("user added to the event register");

                } catch (error) {
                    console.error(error);
                    res.render("login", {
                        username: undefined,
                        errors: "There was a problem registering for the event please login again",
                    })
                }
                // updating the user with the event id and unique code, plan to check attendance =>
                // to confirm attendance change the unique code to 1
                // If a person has not attended change tot code to 0
                let userCode = randomInt(1000, 10000);// never set the bottom bound to less that 10, don't fk with <10.
                let retryCount = 0;
                let maxRetry = 5;

                while(retryCount < maxRetry){
                    try {
                        updateUser.attendedEvents.push({
                            eventId: event._id,
                            uniqueCode: userCode,
                        });
                        await updateUser.save();
                        console.log("user updated with event registered and unique code generated");
                        console.log("Registration Process Complete!");
                        return res.render("event",{
                            eventID:eventID,
                            userUniqueCode:userCode,
                            eventInfo: event,
                        });
                        break;
                    } catch (error) {
                        if(error.code === 11000){
                            console.log("duplicate unique code which is bad. Retrying . . .");
                            userCode = randomInt(1000,10000);
                            retryCount++;
                        } else {
                            console.error(error);
                            return res.render("login",{
                                username:undefined,
                                errors:"There was a problem registering for the event. Please try again. If this issue persists please contact us.",
                            })
                        }
                    }
                }
                if(retryCount === maxRetry){
                    console.log("Max retries reached, Unable to generate a unique code!");
                    return res.render("login",{
                        username:undefined,
                        errors: "Unable to generate unique ID please contact us directly",
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
})

module.exports = router;