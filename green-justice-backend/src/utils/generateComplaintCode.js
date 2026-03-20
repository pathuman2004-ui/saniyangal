function generateComplaintCode() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `GJ-${Date.now()}-${random}`;
}

module.exports = generateComplaintCode;
