const Trip = require("../models/trip");
const formatDate = require("../utility");

async function mergeTrips(trips) {
  const timestamp = formatDate(new Date());

  const mergedTripNotes = trips.reduce((acc, trip) => {
    return acc.concat(trip.tripNotes);
  }, []);

  const mergedTripIds = trips.map((trip) => trip._id).join(" & ");
  mergedTripNotes.push(
    `Die Fahrten mit den IDs ${mergedTripIds} wurden am ${timestamp} zusammengeführt.`
  );

  const firstTrip = trips.reduce((earliest, trip) => {
    return trip.startTimestamp < earliest.startTimestamp ? trip : earliest;
  }, trips[0]);

  const lastTrip = trips.reduce((latest, trip) => {
    return trip.endTimestamp > latest.endTimestamp ? trip : latest;
  }, trips[0]);

  const mergedTrip = new Trip({
    startLocation: firstTrip.startLocation,
    endLocation: lastTrip.endLocation,
    startDate: firstTrip.startDate,
    endDate: lastTrip.endDate,
    tripNotes: mergedTripNotes,
  });

  await mergedTrip.save();

  const tripIds = trips.map((trip) => trip._id);
  await Trip.updateMany(
    { _id: { $in: tripIds } },
    { replacedByTripId: mergedTrip._id },
    { markAsDeleted: true }
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
