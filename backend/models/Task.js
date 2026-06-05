const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // If dueDate is modified or new, ensure it is in the future/present
          if (value && this.isModified('dueDate')) {
            return value.getTime() >= Date.now() - 60000; // Allow 1-minute grace period
          }
          return true;
        },
        message: 'Due date must be in the future',
      },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
