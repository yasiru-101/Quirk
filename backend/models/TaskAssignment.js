const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index to prevent duplicate user assignments to the same task
taskAssignmentSchema.index({ taskId: 1, userId: 1 }, { unique: true });
taskAssignmentSchema.index({ userId: 1 }); // Index for finding tasks assigned to a specific user

const TaskAssignment = mongoose.model('TaskAssignment', taskAssignmentSchema);

module.exports = TaskAssignment;
