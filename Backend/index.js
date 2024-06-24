const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the MongoDB connection setup
const User = require('./models/User'); // Import the User model
const cors = require('cors');
const app = express();
const Post = require('./models/posts');
const rawBody = require('raw-body');

app.use(cors());

const port = 3000;

app.use(bodyParser.json());

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, userType, qualifications } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const newUser = new User({ firstName, lastName, email, password, userType, qualifications });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'Signup successful.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Login endpoint
const jwt = require('jsonwebtoken');

app.post('/login', async (req, res) => {
  const { email: userEmail, password } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ email: userEmail });

    // Check if the user exists and the password matches
    if (user && user.password === password) {
      // Do not populate in the login route, especially for sensitive information
      // Instead, only send necessary information and avoid exposing sensitive fields
      const { firstName, lastName, email } = user;

      // Create a JWT token
      const token = jwt.sign(
        { email, firstName, lastName },
        'your-secret-key', // Secret key (should be stored in a secure way, not hard-coded)
        { expiresIn: '1h' } // Token expiration time
      );

      res.json({ message: 'Login successful.', user: { firstName, lastName, email }, token });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Route to upload a post
app.post('/upload', async (req, res) => {
  // Your code for uploading a post
});

// Route to like a post
app.post('/like/:_id', async (req, res) => {
  // Your code for liking a post
});

// Route to fetch posts
app.get('/posts', async (req, res) => {
  // Your code to fetch posts
});

// Middleware to authenticate JWT token
// Authentication middleware
async function authenticateMiddleware(req, res, next) {
  // Your authentication logic here
}

// Route to get user's profile picture
app.get('/getProfilePicture', authenticateMiddleware, async (req, res) => {
  // Your code to get user's profile picture
});

// Route to fetch doctors
app.get('/doctors', async (req, res) => {
  // Your code to fetch doctors
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
