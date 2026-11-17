"use strict";

const origin = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/$/, "");

module.exports = {
  name: "AeroRUL REST API",
  version: "1.0.0",
  description:
    "AeroRUL Public, Authentication, Supplier, Buyer and FD002 RUL APIs. RUL prediction requires an authenticated Buyer session.",
  url: origin,
  sampleUrl: origin,
};
