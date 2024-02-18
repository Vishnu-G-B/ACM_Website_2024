const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    name: { type: String, required: true, maxLength: 255 },
    description: { type: String, maxLength: 1000 },
    date: { type: Date, required: true },
    registeredUsers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    attendedUsers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});


EventSchema.virtual('url').get(function () {
    return `/events/${this._id}`;
});

EventSchema.virtual('imagepath').get(function () {
    try {
        nameList = this.name.split(" ");
        if (nameList.length >= 2) {
            eventName = nameList.join("_");
            return `/images/Events/${eventName}.png`;
        }
        return `/images/Events/${this.name}.png`;
    } catch (error) {
        return "image path var not being generated. Virtual not defined!";
    }
});

EventSchema.virtual('over').get(function () {
    const today = new Date();
    if (today > this.date) {
        return true
    } else if (today < this.date) {
        return false
    } else {
        return false;
    }
});

module.exports = mongoose.model("Events", EventSchema);