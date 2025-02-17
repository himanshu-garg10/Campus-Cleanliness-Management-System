const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db1 = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const path = require('path');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../dashboards')));

// Serve the index.html as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboards', 'index.html'));
});



const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const JWT_SECRET = 'bhoot';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  });
};

// Report a new cleanliness issue
app.post('/api/issues', verifyToken, async (req, res) => {
  const { areaName, areaType, floorNumber, building, description, priority } = req.body;
  
  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if the area exists
      const [areas] = await connection.query('SELECT area_id FROM AREA WHERE name = ? AND building = ?', [areaName, building]);
      
      let area_id;
      if (areas.length === 0) {
        // If the area doesn't exist, create it
        const [result] = await connection.query(
          'INSERT INTO AREA (name, type, floor_number, building) VALUES (?, ?, ?, ?)',
          [areaName, areaType, floorNumber, building]
        );
        area_id = result.insertId;
      } else {
        area_id = areas[0].area_id;
      }

      // Insert the issue
      const [issueResult] = await connection.query(
        'INSERT INTO CLEANLINESS_ISSUE (area_id, description, reported_time, status, priority) VALUES (?, ?, NOW(), "Pending", ?)',
        [area_id, description, priority]
      );

      await connection.commit();

      res.status(201).json({ message: 'Issue reported successfully', issue_id: issueResult.insertId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while reporting the issue' });
  }
});

// Demo path
app.get("/path/ab", (req, res) =>{
  res.send("Hello World");
})

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body; // Get email and password from the request body
  console.log("Login request received"); // Check if the request is even hitting the server

  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT * FROM USERS WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, userType: user.user_type }, JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
});



app.post("/api/cleanliness-issues", async (req, res) => {
  const { student_name, building, location, floor, description, date_time } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO CLEANLINESS_ISSUE (student_name, building, location, floor, description, reported_time) VALUES (?, ?, ?, ?, ?, ?)',
      [student_name, building, location, floor, description, date_time]
    );

    res.status(201).json({ issue_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the issue' });
  }
});


app.post("/api/register", async (req, res) => {
  const { name, email, phone, password, user_type } = req.body;

  // Validate input
  if (!name || !email || !password || !user_type) {
    return res.status(400).json({ error: 'Name, email, password, and user type are required' });
  }

  try {
    // Check if the email already exists
    const [existingUser ] = await db.query('SELECT * FROM USERS WHERE email = ?', [email]);
    if (existingUser .length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert the new user into the USERS table
    const [result] = await db.query(
      'INSERT INTO USERS (name, email, phone, password, user_type) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, user_type]
    );

    // Return the newly created user ID
    res.status(201).json({ userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});