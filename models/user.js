const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true, maxLength: 100 },
    username: { type: String, required: true, maxLength: 100 },
    password: { type: String, required: true },
    attendedEvents: {
        type: [{
            eventId: { type: Schema.Types.ObjectId, ref: "Event" },
            uniqueCode: { type: Number, unique: true, sparse: true },
        }],
        default: [],
    },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});

// UserSchema.set('toObject', { default: { attendedEvents: [] } });
// UserSchema.set('toJSON', { default: { attendedEvents: [] } });



module.exports = mongoose.model("User", UserSchema);