const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
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
