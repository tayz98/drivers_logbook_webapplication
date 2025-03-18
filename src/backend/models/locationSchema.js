const mongoose = require("mongoose");
const locationSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    postalCode: {
      type: String,
      required: false,
    },
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

locationSchema.virtual("formattedAddress").get(function () {
  return `${this.street}, ${this.postalCode} ${this.city}`;
});

module.exports = locationSchema;
