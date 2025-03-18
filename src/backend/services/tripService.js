const Trip = require("../models/tripSchema");
const { formatDate } = require("../utility");

function buildTripQuery(userRole, user) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  //const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
/**
 * Merges multiple trips into a single consolidated trip record.
 *
 * The function selects the earliest start time and the latest end time from the provided trips,
 * consolidates their relevant information, and creates a new trip entry in the database.
 * The original trips are marked as deleted and linked to the newly created trip.
 *
 * @async
 * @function mergeTrips
 * @param {Array.<Object>} trips - An array of trip objects to be merged.
 * @throws {Error} If less than two trips are provided.
 * @returns {Promise<Object>} - A promise resolving to the newly created merged trip.
 *
 */
async function mergeTrips(trips) {
  // Get the current timestamp formatted as a readable date string
  const timestamp = formatDate(new Date());
  // Ensure at least two trips are provided for merging
  if (trips.length < 2) {
    throw new Error("At least two trips are required to merge.");
  }
  // Initialize an array to store the merged trip notes

  const mergedTripNotes = [];
  // Generate a string representation of all trip IDs being merged
  const mergedTripIds = trips.map((trip) => trip._id).join(" & ");
  // Add a note indicating which trips were merged and when
  mergedTripNotes.push(
    `Die Fahrten mit den IDs ${mergedTripIds} wurden am ${timestamp} zusammengeführt.`
  );
  /**
   * Identify the trip with the earliest start time.
   * This will determine the start location and timestamp of the merged trip.
   */
  const firstTrip = trips.reduce((earliest, trip) => {
    return trip.startTimestamp < earliest.startTimestamp ? trip : earliest;
  }, trips[0]);

  /**
   * Identify the trip with the latest end time.
   * This will determine the end location and timestamp of the merged trip.
   */
  const lastTrip = trips.reduce((latest, trip) => {
    return trip.endTimestamp > latest.endTimestamp ? trip : latest;
  }, trips[0]);
  /**
   * Determine the trip category:
   * - If all trips share the same category, keep it.
   * - Otherwise, default to "business".
   */
  const tripCategory = trips.every(
    (trip) => trip.tripCategory === trips[0].tripCategory
  )
    ? trips[0].tripCategory
    : "business";
  /**
   * Create the new merged trip with combined details.
   */
  const mergedTrip = new Trip({
    startLocation: firstTrip.startLocation, // Location where the first trip started
    endLocation: lastTrip.endLocation, // Location where the last trip ended
    startTimestamp: firstTrip.startTimestamp, // Earliest trip start time
    endTimestamp: lastTrip.endTimestamp, // Latest trip end time
    tripCategory: tripCategory, // Final trip category
    tripNotes: mergedTripNotes, // Notes indicating the merged trip history
    tripStatus: "completed", // Mark trip as completed
    vehicleId: firstTrip.vehicleId, // Retain vehicle ID from the first trip
    recorded: false, // Mark as unrecorded for further validation
    checked: false, // Mark as unchecked for later verification
    startMileage: firstTrip.startMileage, // Odometer reading at the start
    endMileage: lastTrip.endMileage, //Odometer reading at the end
  });

  // Save the newly created merged trip in the database
  await mergedTrip.save();
  // Extract the IDs of the original trips that are being replaced
  const tripIds = trips.map((trip) => trip._id);
  /**
   * Update the original trips:
   * - Mark them as deleted.
   * - Link them to the newly created merged trip.
   * - Add a note indicating the trip was replaced.
   */
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
 * Generates report data by aggregating trip records from the database within a given date range.
 * The data includes trip details, vehicle information, and specific formatting rules for certain fields.
 *
 * @param {String} fromDateStr - User-selected start date in ISO 8601 format (e.g., "2024-01-01T00:00:00Z").
 * @param {String} toDateStr   - User-selected end date in ISO 8601 format (e.g., "2024-01-31T23:59:59Z").
 * @returns {Promise<Array>} - An array of processed trip records ready for report generation.
 */
async function generateReportData(fromDateStr, toDateStr) {
  // Convert string input dates to Date objects
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);

  // Aggregate trip data based on the selected date range
  const tripsForExport = await Trip.aggregate([
    /**
     * Stage 1: Convert stored timestamps into Date objects.
     * MongoDB stores timestamps as strings or numbers, so we convert them for proper filtering.
     */
    {
      $addFields: {
        startTimestampDate: { $toDate: "$startTimestamp" },
        endTimestampDate: { $toDate: "$endTimestamp" },
      },
    },

    /**
     * Stage 2: Filter trips within the specified date range.
     * Only trips with a start date between fromDate and toDate will be included.
     */
    {
      $match: {
        startTimestampDate: { $gte: fromDate, $lte: toDate },
      },
    },

    /**
     * Stage 3: Join the vehicles collection to retrieve vehicle details.
     * This lookup operation matches the vehicleId in the trips collection with _id in the vehicles collection.
     * The matched vehicle data is stored in an array under "vehicleData".
     */
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicleData",
      },
    },
    /**
     * Stage 4: Unwind the joined vehicle data array.
     * Since we expect each trip to have only one associated vehicle, we flatten the array structure.
     */
    {
      $unwind: "$vehicleData",
    },
    /**
     * Stage 5: Project the final structure of the exported data.
     * This stage selects relevant fields and applies conditional logic to mask certain fields.
     */
    {
      $project: {
        /**
         * Conditionally remove start and end locations if the trip category is "private" or "commute".
         * - If the trip is private/commute, the location data is entirely removed (`$$REMOVE`).
         * - Otherwise, the location is formatted as "Street, PostalCode City".
         */
        startLocation: {
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

        /**
         * Always include these fields in the report output.
         */
        Date: {
          $dateToString: { format: "%d.%m.%Y", date: "$startTimestamp" },
        },
        tripCategory: 1, // Category of the trip (e.g., "business", "private", "commute").
        tripPurpose: 1, // Purpose of the trip (user-defined).
        tripNotes: 1, // Additional notes about the trip.
        markAsDeleted: 1, // Flag to indicate if the trip has been marked for deletion.
        clientCompany: 1, // Name of the company associated with the trip (if applicable).
        client: 1, // Name of the client associated with the trip.
        detourNote: 1, // Specific note describing any detours taken during the trip.
        startMileage: 1, // Odometer reading at the start of the trip.
        endMileage: 1, // Odometer reading at the end of the trip.
        /**
         * Compute the total distance traveled in kilometers.
         * This is calculated by subtracting the starting mileage from the ending mileage.
         */
        kilometers: { $subtract: ["$endMileage", "$startMileage"] },
        /**
         * Extract the license plate from the joined vehicle data.
         * This allows us to display vehicle information in the report.
         */
        licensePlate: "$vehicleData.licensePlate",
        /**
         * Optionally include or exclude internal fields.
         * `_id` is needed for the consecutive trip number
         */
        _id: 1,
      },
    },
  ]);
  // Return the processed trip data for report generation.
  return tripsForExport;
}

module.exports = { mergeTrips, buildTripQuery, generateReportData };
