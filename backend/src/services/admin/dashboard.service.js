"use strict";

const dashboardRepository = require("./dashboard.repository");

async function getSummary() {
  return await dashboardRepository.getSummary();
}

module.exports = {
  getSummary,
};
