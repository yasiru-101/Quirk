const requirePlatformAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      errorCode: 401,
      message: 'Not authorized. Authentication required before authorization.',
    });
  }

  if (req.user.isPlatformAdmin) return next();

  return res.status(403).json({
    errorCode: 403,
    message: 'Access denied. Platform administrator access is required.',
  });
};

module.exports = requirePlatformAdmin;
