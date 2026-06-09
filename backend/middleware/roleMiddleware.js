const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role của bạn (${req.user?.role}) không được phép thực hiện hành động này.`,
      });
    }
    next();
  };
};

module.exports = { authorize };
