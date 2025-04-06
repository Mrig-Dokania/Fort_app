/*
require('dotenv').config()

const express = require('express')
const cors = require('cors'); // Import CORS middleware
const { errorHandler, responseHandler } = require('./middlewares/core')
const { authenticate, authorize } = require('./middlewares/auth')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(responseHandler)

// Add CORS Middleware (BEFORE all route definitions)
const corsOptions = {
    //origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Add Flutter app's origin here
    origin: "*", // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow cookies if needed
};
app.use(cors(corsOptions)); // Apply CORS middleware globally

 app.use((req, res, next) => {
     req.user = { uid: '1234567890', deviceToken: '9898r923R3NJKBSJKS' }
     next()
 }) // Comment this out when using Firebase Auth

// Root Route - Add this to handle requests to '/'
app.get('/', (req, res) => {
    res.send('Fort Backend is Running!');
});

app.use('/auth', require('./routes/auth'))
app.use('/process', authenticate(), authorize(['user', 'responders', 'admin']), require('./routes/process'))
app.use('/responders', authenticate(), authorize(['responders', 'admin']), require('./routes/responders'))
app.use('/emergency', authenticate(), authorize(['user', 'responders', 'admin']), require('./routes/emergency'))
app.use('/contacts', authenticate(), authorize(['user', 'responders', 'admin']), require('./routes/contacts'))

app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server : http://localhost:${PORT}`)
}) 
    
*/

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { errorHandler, responseHandler } = require('./middlewares/core')
const emergencyRoutes = require('./routes/emergency'); // Import emergency routes

const { authenticate } = require('./middlewares/auth');

const app = express()

// 1. CORS FIRST
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Custom Middlewares
app.use(responseHandler);


/*app.use((req, res, next) => {
    req.user = { 
        uid: '1234567890', 
        deviceToken: '9898r923R3NJKBSJKS',
        role: 'user'
    };
    next();
});


// 4. Mock User
app.use((req, res, next) => {
    req.user = { 
        uid: '1234567890', 
        deviceToken: '9898r923R3NJKBSJKS',
        role: 'user'
    };
    next();
});*/

// 5. Routes
//app.use('/emergency', require('./routes/emergency'));
aapp.use('/emergency', authenticate, require('./routes/emergency'))
app.use('/auth', authenticate, require('./routes/auth'))
app.use('/contacts', authenticate, require('./routes/contacts'))
app.use('/process', authenticate, require('./routes/process'))

// 6. Error Handler
app.use(errorHandler)

//ensuring /process is registered
app.use('/process', require('./routes/process'))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
});
