"use strict";

const companiesService = require("./companies.service");

async function getCompanies(req, res) {
  try {
    const data = await companiesService.listCompanies(req.query);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const code = error.code || "ADMIN_COMPANIES_FETCH_FAILED";
    const message =
      statusCode === 500
        ? "Failed to fetch buyer companies."
        : error.message;

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}

async function getCompanyById(req, res) {
  try {
    const data = await companiesService.getCompanyDetail(
      req.params.companyId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const code = error.code || "ADMIN_COMPANY_DETAIL_FETCH_FAILED";
    const message =
      statusCode === 500
        ? "Failed to fetch buyer company details."
        : error.message;

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}

module.exports = {
  getCompanies,
  getCompanyById,
};

