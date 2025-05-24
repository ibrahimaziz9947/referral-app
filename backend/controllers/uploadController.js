const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists or create it
        const uploadPath = path.join(__dirname, '../uploads/'); 
        require('fs').mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter for image files (optional)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter 
}).single('proofImage'); // Expecting a single file named 'proofImage'

// Upload handler
exports.uploadProof = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
             return res.status(400).json({ message: err.message });
        }

        // Everything went fine.
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Return the path or URL of the uploaded file
        // Assuming the server serves the 'uploads' directory statically
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ 
            message: 'File uploaded successfully', 
            filePath: req.file.path, // Server path
            fileUrl: fileUrl        // URL accessible by the client
        });
    });
}; 