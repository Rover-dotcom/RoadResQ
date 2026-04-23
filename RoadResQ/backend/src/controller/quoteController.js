const Quote = require("../models/Quote");

exports.createQuote = async (req, res) => {
  const quote = await Quote.create(req.body);
  res.json(quote);
};

exports.getQuotes = async (req, res) => {
  const quotes = await Quote.find({ jobId: req.params.id });
  res.json(quotes);
};
