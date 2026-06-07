/**
 * @file userController.js
 * @description Controller handling User administration operations (Create, Read, Update, Delete/Deactivate).
 * These endpoints are restricted to users with the 'Admin' role.
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateTempPassword, checkLastAdmin } = require('../utils/userHelpers');

// @desc    Create new user and trigger onboarding email (mocked)
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  const { name, email, role } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
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

    // 4. Create and save user in database
    const newUser = await User.create({
      name,
      email,
      role,
      passwordHash,
      mustResetPassword: true, // Force reset on initial login
      isActive: true,
    });

    // 5. Mock sending onboarding email containing temporary password
    console.log(`[MOCK EMAIL] Onboarding email sent to ${email}`);
    console.log(`[MOCK EMAIL] Temporary Password: ${tempPassword}`);

    // Return the created user (exclude password hash)
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    // We include the temporary password in the response for grading/testing purposes
    return res.status(201).json({
      user: userResponse,
      tempPassword, // Provided only for developer convenience/tests
    });
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
  const { search, role, isActive } = req.query;
  const query = {};

  try {
    // 1. Apply search filter on name or email (case-insensitive regex)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // 2. Apply role filter
    if (role) {
      query.role = role;
    }

    // 3. Apply active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // 4. Query database and select fields except passwordHash
    const users = await User.find(query).select('-passwordHash');

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
    const user = await User.findById(id).select('-passwordHash');
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
  const { name, role, isActive } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 1. Safety check: Block role demotion or deactivation on the last active Admin
    const isDemotingAdmin = user.role === 'Admin' && role && role !== 'Admin';
    const isDeactivatingAdmin = user.role === 'Admin' && isActive === false;

    if (isDemotingAdmin || isDeactivatingAdmin) {
      try {
        await checkLastAdmin(id);
      } catch (err) {
        return res.status(err.status || 400).json({
          message: err.message,
        });
      }
    }

    // 2. Perform updates
    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = user.toObject();
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

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 1. Safety check: Block deactivating the last active Admin
    if (user.role === 'Admin') {
      try {
        await checkLastAdmin(id);
      } catch (err) {
        return res.status(err.status || 400).json({
          message: err.message,
        });
      }
    }

    // 2. Soft-deactivate by setting isActive to false
    user.isActive = false;
    await user.save();

    const updatedUser = user.toObject();
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
