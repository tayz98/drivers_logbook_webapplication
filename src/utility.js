const formatDate = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}.${month}.${year} | ${hours}:${minutes}:${seconds}`;
};

// only needed when we want to calculate the distance between two locations based on their coordinates
// but since we have the startKm and endKm in the trip object, we don't need this function now.
// we could implement a logic that checks if a trip has a missing endKm, to use this function to calculate the distance
function calculateTripDistance(trip) {
  if (!trip.startLocation || !trip.endLocation) {
    throw new Error("Trip must have both a start and end location.");
  }

  const startCoords = {
    lat: trip.startLocation.latitude,
    lon: trip.startLocation.longitude,
  };

  const endCoords = {
    lat: trip.endLocation.latitude,
    lon: trip.endLocation.longtitude,
  };

  // Calculate and return the distance in kilometers
  return haversineDistance(startCoords, endCoords);
}

// Haversine formula to calculate the great-circle distance between two points (in kilometers)
function haversineDistance(coords1, coords2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const lat1 = coords1.lat;
  const lon1 = coords1.lon;
  const lat2 = coords2.lat;
  const lon2 = coords2.lon;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  formatDate,
  haversineDistance,
  calculateTripDistance,
};
