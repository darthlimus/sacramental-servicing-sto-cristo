const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// File paths
const USERS_FILE_PATH = path.join(__dirname, 'users.json');
const APPS_FILE_PATH = path.join(__dirname, 'applications.json');

// ==================== PERSISTENCE HELPERS ==================== //

// Load existing users
let users = [];
if (fs.existsSync(USERS_FILE_PATH)) {
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
    } catch (err) {
        console.error('Error reading users.json:', err);
    }
}

const saveUsersToJSON = () => {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
};

// Load existing applications
let applications = [];
if (fs.existsSync(APPS_FILE_PATH)) {
    try {
        applications = JSON.parse(fs.readFileSync(APPS_FILE_PATH, 'utf8'));
    } catch (err) {
        console.error('Error reading applications.json:', err);
    }
}

const saveDataToJSON = () => {
    fs.writeFileSync(APPS_FILE_PATH, JSON.stringify(applications, null, 2));
};

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== AUTHENTICATION ENDPOINTS ==================== //

// 1. REGISTER USER
app.post('/api/register', (req, res) => {
    const { fullName, email, password } = req.body;

    if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const newUser = {
        id: 'USR-' + Date.now(),
        fullName,
        email,
        password // Note: Hash passwords using bcrypt in production
    };

    users.push(newUser);
    saveUsersToJSON();

    res.status(200).json({ success: true, message: 'Account created successfully!', user: newUser });
});

// 2. LOGIN USER
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    res.status(200).json({
        success: true,
        message: 'Login successful!',
        user: { id: user.id, fullName: user.fullName, email: user.email }
    });
});

// 3. FETCH USER'S OWN APPLICATIONS
app.get('/api/user/applications/:userId', (req, res) => {
    const { userId } = req.params;
    const userApps = applications.filter(a => a.userId === userId);
    res.status(200).json({ success: true, data: userApps });
});

// ==================== SACRAMENTAL ENDPOINTS ==================== //

// 1. BAPTISM APPLICATION ENDPOINT
app.post('/api/apply/baptism', upload.array('documents'), (req, res) => {
    try {
        const formData = req.body;
        const uploadedFiles = req.files ? req.files.map(f => f.filename) : [];

        const newRecord = {
            id: 'BAP-' + Date.now(),
            userId: formData.userId || 'GUEST',
            serviceType: 'Baptism',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            adminNote: '',
            isArchived: false,
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        saveDataToJSON();

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
            userId: formData.userId || 'GUEST',
            serviceType: 'Wedding',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            adminNote: '',
            isArchived: false,
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        saveDataToJSON();

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
            userId: formData.userId || 'GUEST',
            serviceType: 'Funeral',
            applicantData: formData,
            attachedFiles: uploadedFiles,
            status: 'Pending Verification',
            adminNote: '',
            isArchived: false,
            submittedAt: new Date().toISOString()
        };

        applications.push(newRecord);
        saveDataToJSON();

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

// ==================== ADMIN ENDPOINTS ==================== //

// Fetch all submitted applications
app.get('/api/admin/applications', (req, res) => {
    res.status(200).json({
        success: true,
        totalRecords: applications.length,
        data: applications
    });
});

// Update Application Status & Admin Note
app.patch('/api/admin/applications/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const appRecord = applications.find(a => a.id === id);

    if (appRecord) {
        appRecord.status = status;
        if (adminNote !== undefined) {
            appRecord.adminNote = adminNote;
        }
        saveDataToJSON();
        res.json({ success: true, message: 'Status updated successfully' });
    } else {
        res.status(404).json({ success: false, message: 'Record not found' });
    }
});

// Archive or Unarchive an Application
app.patch('/api/admin/applications/:id/archive', (req, res) => {
    const { id } = req.params;
    const { isArchived } = req.body;

    const appRecord = applications.find(a => a.id === id);

    if (!appRecord) {
        return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    appRecord.isArchived = isArchived;
    if (isArchived) {
        appRecord.archivedAt = new Date().toISOString();
    } else {
        delete appRecord.archivedAt;
    }

    saveDataToJSON();

    res.status(200).json({ 
        success: true, 
        message: isArchived ? 'Record archived to permanent storage.' : 'Record restored to active inbox.' 
    });
});

// ==================== SERVER INITIALIZATION ==================== //

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Parish Backend Server running at http://localhost:${PORT}`);
    console.log(`Ready to accept Sacramental Application requests...`);
    console.log(`====================================================`);
});