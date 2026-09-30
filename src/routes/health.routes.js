const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  /* #swagger.tags = ['Health'] */
  /* #swagger.summary = 'Check API health' */
  res.status(200).json({
    status: "ok",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;