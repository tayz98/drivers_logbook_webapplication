const Trip = require("../models/tripSchema");
const { formatDate } = require("../utility");

function buildTripQuery(userRole, user) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let query = {
    startTimestamp: { $gte: thirtyDaysAgo },
    $or: [{ markAsDeleted: false }, { markAsDeleted: { $exists: false } }],
  };

  switch (userRole) {
    case "dispatcher":
      query.tripCategory = "business";
      break;
    case "manager":
      query.vehicleId = user.vehicleId;
      break;
    case "admin":
      query = {};
      break;
    default:
      console.error("Unknown user role:", userRole);
      break;
  }

  return query;
}

async function mergeTrips(trips) {
  const timestamp = formatDate(new Date());

  if (trips.length < 2) {
    throw new Error("At least two trips are required to merge.");
  }

  // const mergedTripNotes = trips.reduce((acc, trip) => {
  //   return acc.concat(trip.tripNotes);
  // }, []);

  const mergedTripNotes = [];

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

  const tripCategory = trips.every(
    (trip) => trip.tripCategory === trips[0].tripCategory
  )
    ? trips[0].tripCategory
    : "business";

  const mergedTrip = new Trip({
    startLocation: firstTrip.startLocation,
    endLocation: lastTrip.endLocation,
    startTimestamp: firstTrip.startTimestamp,
    endTimestamp: lastTrip.endTimestamp,
    tripCategory: tripCategory,
    tripNotes: mergedTripNotes,
    tripStatus: "completed",
    vehicleId: firstTrip.vehicleId,
    recorded: false,
    checked: false,
    startMileage: firstTrip.startMileage,
    endMileage: lastTrip.endMileage,
  });

  await mergedTrip.save();

  const tripIds = trips.map((trip) => trip._id);
  await Trip.updateMany(
    { _id: { $in: tripIds } },
    {
      replacedByTripId: mergedTrip._id,
      markAsDeleted: true,
      tripNotes: `Fahrt wurde durch ID: ${mergedTrip._id} ersetzt.`,
    }
  );

  return mergedTrip;
}

/**
 * @param {String} fromDateStr - User-selected start date (ISO 8601 string).
 * @param {String} toDateStr   - User-selected end date (ISO 8601 string).
 */
async function generateReportData(fromDateStr, toDateStr) {
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
            {
              $concat: [
                "$startLocation.street",
                ", ",
                { $toString: "$startLocation.postalCode" },
                " ",
                "$startLocation.city",
              ],
            },
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
            {
              $concat: [
                "$endLocation.street",
                ", ",
                { $toString: "$endLocation.postalCode" },
                " ",
                "$endLocation.city",
              ],
            },
          ],
        },

        // Always include these fields
        Date: {
          $dateToString: { format: "%d.%m.%Y", date: "$startTimestamp" },
        },
        startMileage: 1,
        endMileage: 1,
        tripCategory: 1,
        tripPurpose: 1,
        tripNotes: 1,
        markAsDeleted: 1,
        clientCompany: 1,
        client: 1,
        detourNote: 1,
        // Compute kilometers
        kilometers: { $subtract: ["$endMileage", "$startMileage"] },
        // Pull out licensePlate from the joined vehicle data
        licensePlate: "$vehicleData.licensePlate",
        // Optionally exclude any internal fields like _id or __v if not needed
        _id: 1,
      },
    },
  ]);

  return tripsForExport;
}

module.exports = { mergeTrips, buildTripQuery, generateReportData };
