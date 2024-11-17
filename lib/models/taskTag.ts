import mongoose from 'mongoose';

const taskTagSchema = new mongoose.Schema({
  tagID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tag",
  },
  taskID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
});

export default mongoose.models.TaskTag || mongoose.model("TaskTag", taskTagSchema);