const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Enable CORS so your front-end (index.html) can send requests without cross-origin blocks
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure 'uploads' directory exists automatically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Storage Engine for Multer (Saves uploaded files to /uploads folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Appends timestamp to prevent overwriting files with identical names
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Upload configurations (10MB limit per file)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// In-memory array to store application entries temporarily
const applications = [];

// ==================== SACRAMENTAL ENDPOINTS ==================== //

// 1. BAPTISM APPLICATION ENDPOINT
app.post('/api/apply/baptism', upload.array('documents'), (req, res) => {
    try {
        const formData = req.body;
        const uploadedFiles = req.files ? req.files.map(f => f.filename) : [];

        const newRecord = {
            id: 'BAP-' + Date.now(),
            serviceType: 'Baptism',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        // Saves array to local JSON file so data isn't lost on server restart
        fs.writeFileSync(path.join(__dirname, 'applications.json'), JSON.stringify(applications, null, 2));
        console.log('--- NEW BAPTISM APPLICATION RECEIVED ---');
        console.log(newRecord);

        res.status(200).json({
            success: true,
            message: 'Baptism application submitted successfully!',
            referenceId: newRecord.id
        });
    } catch (error) {
        console.error('Error processing Baptism request:', error);
        res.status(500).json({ success: false, message: 'Server Error processing application.' });
    }
});

// 2. WEDDING APPLICATION ENDPOINT
app.post('/api/apply/wedding', upload.array('documents'), (req, res) => {
    try {
        const formData = req.body;
        const uploadedFiles = req.files ? req.files.map(f => f.filename) : [];

        const newRecord = {
            id: 'WED-' + Date.now(),
            serviceType: 'Wedding',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        console.log('--- NEW WEDDING APPLICATION RECEIVED ---');
        console.log(newRecord);

        res.status(200).json({
            success: true,
            message: 'Wedding application submitted successfully!',
            referenceId: newRecord.id
        });
    } catch (error) {
        console.error('Error processing Wedding request:', error);
        res.status(500).json({ success: false, message: 'Server Error processing application.' });
    }
});

// 3. FUNERAL APPLICATION ENDPOINT
app.post('/api/apply/funeral', upload.array('documents'), (req, res) => {
    try {
        const formData = req.body;
        const uploadedFiles = req.files ? req.files.map(f => f.filename) : [];

        const newRecord = {
            id: 'FUN-' + Date.now(),
            serviceType: 'Funeral',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        console.log('--- NEW FUNERAL REQUEST RECEIVED ---');
        console.log(newRecord);

        res.status(200).json({
            success: true,
            message: 'Funeral request submitted successfully!',
            referenceId: newRecord.id
        });
    } catch (error) {
        console.error('Error processing Funeral request:', error);
        res.status(500).json({ success: false, message: 'Server Error processing application.' });
    }
});

// ==================== ADMIN ENDPOINT ==================== //

// Fetch all submitted applications (Useful for building your future Parish Staff Dashboard)
app.get('/api/admin/applications', (req, res) => {
    res.status(200).json({
        success: true,
        totalRecords: applications.length,
        data: applications
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Parish Backend Server running at http://localhost:${PORT}`);
    console.log(`Ready to accept Sacramental Application requests...`);
    console.log(`====================================================`);
});