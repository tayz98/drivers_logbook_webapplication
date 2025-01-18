const Trip = require("../models/trip");

async function mergeTrips(tripIds, newTripData) {
  const tripsToMerge = await Trip.find({ _id: { $in: tripIds } });

  if (tripsToMerge.length !== tripIds.length) {
    throw new Error("Some trips not found");
  }

  const mergedTrip = new Trip({
    ...newTripData,
    startLocation: tripsToMerge[0].startLocation,
    endLocation: tripsToMerge[tripsToMerge.length - 1].endLocation,
    startDate: tripsToMerge[0].startDate,
    endDate: tripsToMerge[tripsToMerge.length - 1].endDate,
  });

  await mergedTrip.save();

  // Update old trips to reference the new trip
  await Trip.updateMany(
    { _id: { $in: tripIds } },
    { mergedInto: mergedTrip._id }
  );

  return mergedTrip;
}

module.exports = { mergeTrips };
