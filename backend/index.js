
require('dotenv').config();
const express = require('express');
const { json } = express;
const { hash, compare } = require('bcryptjs');
const { sign, verify } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIo = require('socket.io');
const propertyRoutes = require('./routes/propertyRoutes'); 
const chatRoutes = require('./chatRoute');
const landlordRoute = require('./landlordRoute');
const { authenticateToken } = require('./middleware/authMiddleware');
const prisma = require('./prisma/prismaClient');
const setupChatSocket = require('./chatSocketHandler');
const setupLiveStreamSocket = require('./liveStreamSocketHandler');
const cookieParser = require('cookie-parser');  // Add cookie-parser
const app = express();

app.use(cookieParser());  // Use cookie-parser here

app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Allow large form payloads

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
app.use(cors({ 
    origin: 'http://localhost:3000',
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'], // ✅ Added 'Cache-Control'
}));

// Create an HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

setupChatSocket(io);
setupLiveStreamSocket(io);

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});
app.use('/api', chatRoutes(io));  // Pass io instance to chat routes
app.use('/api', propertyRoutes(io));  // Pass io instance to property routes
app.use('/api', landlordRoute);



// Cross-origin settings middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control'); 
    
    // Handle preflight requests properly
    if (req.method === 'OPTIONS') {
        res.sendStatus(204); // No content response for preflight
    } else {
        next();
    }
});



// Test API
app.get('/test', (req, res) => {
    try {
        res.status(200).json({ message: "API is working nicely" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.get('/api/users/:id', authenticateToken, async (req, res) => {  
    try {
        // Fetch user and include the landlord and tenant relations
        const user = await prisma.user.findUnique({
            where: { id: Number(req.params.id) },
            select: { 
                id: true, 
                name: true, 
                landlord: { select: { id: true } },  // Fetch the `id` of the landlord relation
                tenant: { select: { id: true } }     // Fetch the `id` of the tenant relation
            } 
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract landlordId and tenantId from the relations
        const responseData = {
            id: user.id,
            name: user.name,
            landlordId: user.landlord?.id || null,  // `landlordId` from the relation
            tenantId: user.tenant?.id || null       // `tenantId` from the relation
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: error.message });
    }
});



app.post('/users', async (req, res) => {
    const { email, password, role, name } = req.body;

    console.log("Incoming signup request:", req.body); // Log the incoming request data

    try {
        if (!email || !password || !role || !name) {
            console.log("Validation error: All fields are required."); // Log validation error
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log("User already exists:", existingUser); // Log existing user info
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        const hashedPassword = await hash(password, 10);
        console.log("Hashed password:", hashedPassword); // Log the hashed password

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                name,
            },
        });

        console.log("New user created:", newUser); // Log the newly created user

        const emailVerificationToken = sign({ email, role, name }, JWT_SECRET, { expiresIn: '1d' });
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
const mailOptions = {
    from: `Dirent <${process.env.NO_REPLY_EMAIL || process.env.EMAIL_USER}>`, // Shows "Dirent" as the sender name
    to: newUser.email, // Dynamically set to the user's email address
    subject: 'Email Verification',
    html: `<p>Hi ${name},</p><p>Click the link below to verify your email:</p><a href="${verificationUrl}">Verify Email</a>`,
};

        await transporter.sendMail(mailOptions);
        console.log("Verification email sent to:", email); // Log the email sent

        res.status(201).json({
            message: 'Verification email sent. Please check your inbox.',
            user: {
                id: newUser.id,
                role: newUser.role,
                name: newUser.name,
            },
        });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: 'An error occurred during registration.', error: error.message });
    }
});




app.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = verify(token, JWT_SECRET);

        const existingUser = await prisma.user.findUnique({
            where: { email: decoded.email },
        });

        if (existingUser) {
            // Mark user as verified
            await prisma.user.update({
                where: { email: decoded.email },
                data: { isVerified: true },
            });

            if (existingUser.role === 'LANDLORD') {
                // Handle landlord specific logic
                const existingLandlord = await prisma.landlord.findUnique({
                    where: { userId: existingUser.id },
                });
                if (!existingLandlord) {
                    await prisma.landlord.create({
                        data: { userId: existingUser.id },
                    });
                }
            } else if (existingUser.role === 'TENANT') {
                // Handle tenant specific logic
                const existingTenant = await prisma.tenant.findUnique({
                    where: { userId: existingUser.id },
                });
                if (!existingTenant) {
                    await prisma.tenant.create({
                        data: { userId: existingUser.id },
                    });
                }
            }

            return res.status(200).json({ message: 'User verified successfully!' });
        } else {
            // Create a new user and handle roles as before
            const newUser = await prisma.user.create({
                data: {
                    email: decoded.email,
                    password: decoded.password,
                    role: decoded.role.toUpperCase(),
                    name: decoded.name,
                    isVerified: true,
                },
            });

            if (newUser.role === 'LANDLORD') {
                await prisma.landlord.create({ data: { userId: newUser.id } });
            } else if (newUser.role === 'TENANT') {
                await prisma.tenant.create({ data: { userId: newUser.id } });
            }

            return res.status(201).json({ message: 'User created and verified successfully!', user: newUser });
        }
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token.', error: error.message });
    }
});




app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Both email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true, landlord: true },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const validPassword = await compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 🔑 Generate access token (short-lived)
        const accessToken = sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '2m' }
        );

        // 🔁 Generate refresh token (long-lived)
        const refreshToken = sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 📦 Get tenant/landlord IDs
        const tenantId = user.tenant ? user.tenant.id : null;
        const landlordId = user.landlord ? user.landlord.id : null;

        // 🍪 Set refresh token in HttpOnly secure cookie
       res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // false in development
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})
.status(200)
.json({
    user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        tenantId: tenantId,
        landlordId: landlordId
    },
    token: accessToken
});
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});


app.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).send('Refresh token missing');
  }

  jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).send('Invalid refresh token');
    }

    // 🔄 Re-fetch user from DB to get role and email
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ accessToken: newAccessToken });
  });
});



app.post('/reset-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate a reset token
        const resetToken = sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        // Send email with reset link
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            html: `<p>Hi ${user.name},</p>
                   <p>Click the link below to reset your password:</p>
                   <a href="${resetUrl}">Reset Password</a>`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error sending reset password email:', error);
        res.status(500).json({ message: 'An error occurred while sending the reset link.' });
    }
});
// Start Server
const PORT = process.env.PORT || 4002;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`)); // Use server.listen instead of app.listen
