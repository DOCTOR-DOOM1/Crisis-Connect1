const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const NGO = require('../models/NGO');
const { checkContentSafety } = require('../services/aiGuardrails');
const { parseSMS, sendSMS } = require('../services/twilioService');

// In-memory fallback
let mockRequests = [];
let mockNGOs = [];

// GET /api/requests - Get all open requests
router.get('/requests', async (req, res) => {
    try {
        if (req.isMongoConnected) {
            const requests = await Request.find({ status: 'Open' }).sort({ createdAt: -1 });
            return res.json(requests);
        }
        // Fallback
        res.json(mockRequests.filter(r => r.status === 'Open').reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/requests - Submit a new help request
router.post('/requests', async (req, res) => {
    try {
        const { name, latitude, longitude, urgentNeeds, criticalDetails } = req.body;

        // Basic validation
        if (!name || !urgentNeeds || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newRequestData = {
            name,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
            locationMetadata: {
                accuracy: req.body.accuracy || 0
            },
            urgentNeeds,
            criticalDetails,
            status: 'Open',
            createdAt: new Date(),
        };

        let savedRequest;

        if (req.isMongoConnected) {
            const newRequest = new Request(newRequestData);
            savedRequest = await newRequest.save();
        } else {
            // Fallback
            savedRequest = { ...newRequestData, _id: 'mock_' + Date.now().toString() };
            mockRequests.push(savedRequest);
        }

        // Broadcast the new request to all connected clients (Volunteers)
        req.io.emit('new-request', savedRequest);

        res.status(201).json(savedRequest);
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(400).json({ error: err.message });
    }
});

// POST /api/requests/:id/claim - Volunteer claims a task
router.post('/requests/:id/claim', async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const id = req.params.id;

        let request;

        if (req.isMongoConnected) {
            request = await Request.findById(id);
            if (!request) return res.status(404).json({ error: 'Request not found' });
            if (request.status !== 'Open') return res.status(400).json({ error: 'Request already claimed or resolved' });

            request.status = 'Claimed';
            request.claimedBy = volunteerId || 'Anonymous Volunteer';
            await request.save();
        } else {
            // Fallback
            request = mockRequests.find(r => r._id === id);
            if (!request) return res.status(404).json({ error: 'Request not found' });
            if (request.status !== 'Open') return res.status(400).json({ error: 'Request already claimed' });

            request.status = 'Claimed';
            request.claimedBy = volunteerId || 'Anonymous Volunteer';
        }

        // Broadcast update
        req.io.emit('request-updated', request);

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hooks/sms - Twilio Webhook
router.post('/hooks/sms', async (req, res) => {
    try {
        const { Body, From } = req.body;

        console.log(`Received SMS from ${From}: ${Body}`);

        const parsedData = parseSMS(Body);

        if (!parsedData) {
            await sendSMS(From, "Invalid format. Please use: HELP [Location] [Need] [Details]");
            return res.status(200).send('<Response></Response>');
        }

        // Safety Check
        const safetyCheck = await checkContentSafety(parsedData.criticalDetails);
        if (!safetyCheck.isSafe) {
            console.log(`Blocked unsafe request from ${From}: ${safetyCheck.reason}`);
            return res.status(200).send('<Response></Response>');
        }

        const newRequestData = {
            name: `SMS User (${From.slice(-4)})`,
            location: {
                type: 'Point',
                coordinates: parsedData.coordinates,
            },
            urgentNeeds: parsedData.urgentNeeds,
            criticalDetails: parsedData.criticalDetails + ` (via SMS: ${parsedData.locationName})`,
            status: 'Open',
            createdAt: new Date(),
        };

        if (req.isMongoConnected) {
            const newRequest = new Request(newRequestData);
            const savedRequest = await newRequest.save();
            req.io.emit('new-request', savedRequest);
        } else {
            const savedRequest = { ...newRequestData, _id: 'mock_sms_' + Date.now() };
            mockRequests.push(savedRequest);
            req.io.emit('new-request', savedRequest);
        }

        await sendSMS(From, "Request received. Help is on the way.");

        res.status(200).send('<Response></Response>');
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).send('Server Error');
    }
});

// POST /api/ngos/register - Register a new NGO
router.post('/ngos/register', async (req, res) => {
    try {
        const { name, type, contactEmail, contactPhone } = req.body;

        // Basic validation
        if (!name || !type || !contactEmail || !contactPhone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newNGOData = {
            name,
            type,
            contactEmail,
            contactPhone,
            verified: true, // Auto-verify for hackathon/demo
            createdAt: new Date()
        };

        if (req.isMongoConnected) {
            const existing = await NGO.findOne({ contactEmail });
            if (existing) return res.status(400).json({ error: 'Email already registered' });

            const newNGO = new NGO(newNGOData);
            const savedNGO = await newNGO.save();
            return res.status(201).json(savedNGO);
        } else {
            // Fallback
            const existing = mockNGOs.find(n => n.contactEmail === contactEmail);
            if (existing) return res.status(400).json({ error: 'Email already registered' });

            const savedNGO = { ...newNGOData, _id: 'mock_ngo_' + Date.now() };
            mockNGOs.push(savedNGO);
            return res.status(201).json(savedNGO);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ngos/login - Mock Login for NGOs
router.post('/ngos/login', async (req, res) => {
    try {
        const { email } = req.body;

        let ngo;
        if (req.isMongoConnected) {
            ngo = await NGO.findOne({ contactEmail: email });
        } else {
            ngo = mockNGOs.find(n => n.contactEmail === email);
        }

        if (!ngo) return res.status(404).json({ error: 'NGO not found' });

        res.json({ success: true, ngo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/ngos - List all NGOs (for admin dashboard)
router.get('/admin/ngos', async (req, res) => {
    try {
        if (req.isMongoConnected) {
            const ngos = await NGO.find().sort({ createdAt: -1 });
            return res.json(ngos);
        }
        res.json(mockNGOs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/ngos/:id/verify - Approve an NGO
router.post('/admin/ngos/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        if (req.isMongoConnected) {
            const ngo = await NGO.findById(id);
            if (!ngo) return res.status(404).json({ error: 'NGO not found' });
            ngo.verified = true;
            await ngo.save();
            return res.json(ngo);
        } else {
            const ngo = mockNGOs.find(n => n._id === id);
            if (!ngo) return res.status(404).json({ error: 'NGO not found' });
            ngo.verified = true;
            return res.json(ngo);
        }
        return res.json(ngo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/ngos/:id - Reject/Delete an NGO
router.delete('/admin/ngos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (req.isMongoConnected) {
            await NGO.findByIdAndDelete(id);
            return res.json({ success: true, message: 'NGO Deleted' });
        } else {
            const index = mockNGOs.findIndex(n => n._id === id);
            if (index !== -1) mockNGOs.splice(index, 1);
            return res.json({ success: true, message: 'NGO Deleted' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
