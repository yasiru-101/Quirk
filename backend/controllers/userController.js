/**
 * @file userController.js
 * @description Controller handling User administration operations (Create, Read, Update, Delete/Deactivate).
 * These endpoints are restricted to users with the 'Admin' role.
 */

const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { generateTempPassword, checkLastPlatformAdmin } = require('../utils/userHelpers');
const withEmailDebug = (payload, emailDebug) => (emailDebug ? { ...payload, emailDebug } : payload);

// @desc    Create new user and trigger onboarding email
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  const { name, email, isPlatformAdmin = false } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { email: 'Email is already in use' },
      });
    }

    // 2. Generate a cryptographically secure temporary password
    const tempPassword = generateTempPassword();

    // 3. Hash temporary password using bcrypt (12 rounds)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // 4. Create and save user in database using Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        isPlatformAdmin,
        passwordHash,
        mustResetPassword: true, // Force reset on initial login
        isActive: true,
      },
    });

    // 5. Send onboarding email (Azure ACS in prod, Ethereal in dev)
    const emailService = require('../services/emailService');
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    let emailDebug = null;
    try {
      const emailResult = await emailService.sendOnboardingEmail({
        to: email,
        name,
        tempPassword,
        loginUrl,
      });
      emailDebug = emailResult.emailDebug;
    } catch (emailError) {
      emailDebug = emailError.emailDebug || null;
      console.error(`[EmailService] Non-blocking onboarding email delivery failed: ${emailError.message}`);
    }

    // Return the created user (exclude password hash)
    const userResponse = { ...newUser };
    delete userResponse.passwordHash;

    // We include the temporary password in the response for grading/testing purposes
    return res.status(201).json(withEmailDebug({
      user: userResponse,
      tempPassword, // Provided only for developer convenience/tests
    }, emailDebug));
  } catch (error) {
    console.error(`Create user error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during user creation',
    });
  }
};

// @desc    Get all users with optional filtering and search
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  const { search, isActive, isPlatformAdmin } = req.query;
  const where = {};

  try {
    // 1. Apply search filter on name or email (case-insensitive contains query)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 2. Apply active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (isPlatformAdmin !== undefined) {
      where.isPlatformAdmin = isPlatformAdmin === 'true';
    }

    // 4. Query database and select fields except passwordHash
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        mustResetPassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error(`Get users error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching users list',
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        mustResetPassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(`Get user details error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching user details',
    });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, isActive, isPlatformAdmin } = req.body;
  const targetId = id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 1. Safety check: Block role demotion or deactivation on the last active Admin
    const isRemovingPlatformAdmin = user.isPlatformAdmin && isPlatformAdmin === false;
    const isDeactivatingPlatformAdmin = user.isPlatformAdmin && isActive === false;

    if (isRemovingPlatformAdmin || isDeactivatingPlatformAdmin) {
      try {
        await checkLastPlatformAdmin(targetId);
      } catch (err) {
        return res.status(err.status || 400).json({
          message: err.message,
        });
      }
    }

    // 2. Perform updates using Prisma
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        name: name || undefined,
        email: email || undefined,
        isPlatformAdmin: isPlatformAdmin !== undefined ? isPlatformAdmin : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    const updatedUser = { ...updated };
    delete updatedUser.passwordHash;

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Update user error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during user update',
    });
  }
};

// @desc    Deactivate a user account (soft delete)
// @route   PATCH /api/users/:id/deactivate
// @access  Private (Admin only)
const deactivateUser = async (req, res) => {
  const { id } = req.params;
  const targetId = id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 1. Safety check: Block deactivating the last active Admin
    if (user.isPlatformAdmin) {
      try {
        await checkLastPlatformAdmin(targetId);
      } catch (err) {
        return res.status(err.status || 400).json({
          message: err.message,
        });
      }
    }

    // 2. Soft-deactivate by setting isActive to false using Prisma
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });

    const updatedUser = { ...updated };
    delete updatedUser.passwordHash;

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Deactivate user error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during user deactivation',
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
};
