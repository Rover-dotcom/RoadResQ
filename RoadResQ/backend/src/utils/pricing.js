function calculatePrice(distanceKm) {
  const base = 25000; // QR 250
  const perKm = 500;  // QR 5

  return base + (distanceKm * perKm);
}

module.exports = calculatePrice;
