const Trip = require("../models/trip");
const formatDate = require("../utils/formatDate");

async function mergeTrips(trips) {
  if (trips.length !== 2) {
    throw new Error("Exactly two trips must be provided for merging.");
  }

  const [trip1, trip2] = trips;
  const timestamp = formatDate(new Date());

  const mergedTripNotes = [
    ...trip1.tripNotes,
    ...trip2.tripNotes,
    `Die Fahrten mit den IDs ${trip1._id} & ${trip2._id} wurden am ${timestamp} zusammengeführt.`,
  ];

  const mergedTrip = new Trip({
    startLocation: trip1.startLocation,
    endLocation: trip2.endLocation,
    startDate: trip1.startDate,
    endDate: trip2.endDate,
    tripNotes: mergedTripNotes,
  });

  await mergedTrip.save();

  await Trip.updateMany(
    { _id: { $in: [trip1._id, trip2._id] } },
    { replacedByTripId: mergedTrip._id }
  );
  return mergedTrip;
}

/**
 * @param {String} fromDateStr - User-selected start date (ISO 8601 string).
 * @param {String} toDateStr   - User-selected end date (ISO 8601 string).
 */
async function getTripsWithinPeriod(fromDateStr, toDateStr) {
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);

  const tripsForExport = await Trip.aggregate([
    {
      $addFields: {
        startTimestampDate: { $toDate: "$startTimestamp" },
        endTimestampDate: { $toDate: "$endTimestamp" },
      },
    },

    {
      $match: {
        startTimestampDate: { $gte: fromDate, $lte: toDate },
      },
    },

    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicleData",
      },
    },
    {
      $unwind: "$vehicleData",
    },

    {
      $project: {
        // Conditionally remove start/end locations if category is "private" or "commute"
        startLocation: {
          $cond: [
            {
              $or: [
                { $eq: ["$tripCategory", "private"] },
                { $eq: ["$tripCategory", "commute"] },
              ],
            },
            // If condition is true, remove the field entirely
            "$$REMOVE",
            // Otherwise, keep the original field
            "$startLocation",
          ],
        },
        endLocation: {
          $cond: [
            {
              $or: [
                { $eq: ["$tripCategory", "private"] },
                { $eq: ["$tripCategory", "commute"] },
              ],
            },
            "$$REMOVE",
            "$endLocation",
          ],
        },

        // Always include these fields
        startTimestamp: 1,
        endTimestamp: 1,
        startMileage: 1,
        endMileage: 1,
        tripCategory: 1,
        tripPurpose: 1,
        tripNotes: 1,
        detourNote: 1,
        // Compute kilometers
        kilometers: { $subtract: ["$endMileage", "$startMileage"] },
        // Pull out licensePlate from the joined vehicle data
        licensePlate: "$vehicleData.licensePlate",
        // Optionally exclude any internal fields like _id or __v if not needed
        _id: 0,
      },
    },
  ]);

  return tripsForExport;
}

module.exports = { mergeTrips };
