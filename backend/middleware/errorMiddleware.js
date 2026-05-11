function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route introuvable" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Erreur serveur",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
