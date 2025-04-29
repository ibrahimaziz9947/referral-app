const Task = require('../models/task');
const TaskSubmission = require('../models/taskSubmission');
const User = require('../models/user');

// Admin: Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, image, reward } = req.body;
        const task = new Task({
            title,
            description,
            image,
            reward,
            createdBy: req.user._id
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin: Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('createdBy', 'name email');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Update a task
exports.updateTask = async (req, res) => {
    try {
        const { title, description, image, reward, status } = req.body;
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (image) task.image = image;
        if (reward) task.reward = reward;
        if (status) task.status = status;

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin: Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await task.remove();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User: Submit a task completion
exports.submitTask = async (req, res) => {
    try {
        const { taskId, submissionDetails } = req.body;
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.status !== 'active') {
            return res.status(400).json({ message: 'Task is not active' });
        }

        const submission = new TaskSubmission({
            task: taskId,
            user: req.user._id,
            submissionDetails
        });

        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin: Review task submission
exports.reviewSubmission = async (req, res) => {
    try {
        const { status } = req.body;
        const submission = await TaskSubmission.findById(req.params.id)
            .populate('task')
            .populate('user');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.status !== 'pending') {
            return res.status(400).json({ message: 'Submission has already been reviewed' });
        }

        submission.status = status;
        submission.reviewedBy = req.user._id;
        submission.reviewedAt = new Date();

        if (status === 'approved') {
            // Update user's wallet
            const user = await User.findById(submission.user._id);
            user.wallet += submission.task.reward;
            await user.save();
        }

        await submission.save();
        res.json(submission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// User: Get their task submissions
exports.getUserSubmissions = async (req, res) => {
    try {
        const submissions = await TaskSubmission.find({ user: req.user._id })
            .populate('task')
            .sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all task submissions
exports.getAllSubmissions = async (req, res) => {
    try {
        const submissions = await TaskSubmission.find()
            .populate('task')
            .populate('user', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 