const prisma = require('../config/db');

const requirePlatformAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      errorCode: 401,
      message: 'Not authorized. Authentication required before authorization.',
    });
  }

  if (req.user.isPlatformAdmin) return next();

  try {
    // Look for ANY platform admin, active or not. Once the system has ever had a
    // platform admin it is considered bootstrapped, so deactivating the sole admin
    // does not silently re-open this bridge and hand every tenant Admin platform
    // access. Recovery from a deactivated sole admin is an explicit DB/seed action.
    const platformAdminExists = await prisma.user.findFirst({
      where: { isPlatformAdmin: true },
      select: { id: true },
    });

    // Bootstrap bridge for databases created before the platform-admin flag.
    if (!platformAdminExists && req.user.role === 'Admin') return next();

    return res.status(403).json({
      errorCode: 403,
      message: 'Access denied. Platform administrator access is required.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = requirePlatformAdmin;
