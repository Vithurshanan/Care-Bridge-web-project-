const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Post = require('./models/Post');
const db = require('./db'); // Assuming this sets up MongoDB connection

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT (move to environment variables in production)
const JWT_SECRET = 'your-secret-key';

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, userType, qualifications } = req.body;

  // Validate request body
  if (!firstName || !lastName || !email || !password || !userType) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
      qualifications
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'Signup successful.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user in the database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login successful.',
        token,
        user: { firstName: user.firstName, lastName: user.lastName, email: user.email }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// Authentication middleware to protect routes
const authenticateMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];

  // Ensure the token is prefixed with 'Bearer'
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'No or invalid token provided.' });
  }

  const actualToken = token.split(' ')[1]; // Extract token after 'Bearer'

  jwt.verify(actualToken, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token.' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Upload a post (protected route)
app.post('/upload', authenticateMiddleware, async (req, res) => {
  const { title, content } = req.body;

  // Validate request body
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const newPost = new Post({ title, content, author: req.userId });
    await newPost.save();
    res.status(201).json({ message: 'Post uploaded successfully.', post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading post.' });
  }
});

// Like a post (protected route)
app.post('/like/:_id', authenticateMiddleware, async (req, res) => {
  const postId = req.params._id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    post.likes += 1;
    await post.save();

    res.status(200).json({ message: 'Post liked.', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error liking post.' });
  }
});

// Fetch all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'firstName lastName');
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts.' });
  }
});

// Fetch user's profile picture (protected route)
app.get('/getProfilePicture', authenticateMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found.' });
    }

    res.status(200).json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile picture.' });
  }
});

// Fetch doctors
app.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ userType: 'doctor' });
    res.status(200).json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching doctors.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
