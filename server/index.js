require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');
const authRoutes = require('./routes/auth'); // INCLUDE auth routes

const transporter = require('./utils/mailer');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root', // Change if needed
  database: 'smart_product_finder'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

// Mount auth routes
app.use('/auth', authRoutes);

// Product search route
app.get('/search', async (req, res) => {
  const searchTerm = req.query.product;
  const userLat = parseFloat(req.query.userLat);
  const userLng = parseFloat(req.query.userLng);

  if (!searchTerm) {
    return res.status(400).json({ error: 'Missing product query parameter' });
  }

  const queryParams = [`%${searchTerm}%`];
  let query = `
    SELECT 
      s.name AS store_name,
      s.address,
      s.latitude,
      s.longitude,
      sp.price,
      sp.availability,
      p.name AS product_name,
      p.brand
  `;

  if (!isNaN(userLat) && !isNaN(userLng)) {
    query += `,
      (6371 * ACOS(
        COS(RADIANS(?)) * COS(RADIANS(s.latitude)) *
        COS(RADIANS(s.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(s.latitude))
      )) AS distance
    `;
    queryParams.unshift(userLat, userLng, userLat);
  }

  query += `
    FROM store_products sp
    JOIN products p ON sp.product_id = p.id
    JOIN stores s ON sp.store_id = s.id
    WHERE p.name LIKE ?
  `;

  query += (!isNaN(userLat) && !isNaN(userLng))
    ? ' ORDER BY sp.price ASC, distance ASC'
    : ' ORDER BY sp.price ASC';

  db.query(query, queryParams, async (err, storeResults) => {
    if (err) {
      console.error('❌ MySQL query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    let externalProduct = null;

    if (storeResults.length > 0) {
      const actualProductName = storeResults[0].product_name;

      try {
        const apiResponse = await axios.get(
          `https://dummyjson.com/products/search?q=${encodeURIComponent(actualProductName)}`
        );

        const products = apiResponse.data.products;

        if (products && products.length > 0) {
          let matched = products.find(p =>
            p.title.toLowerCase().includes(actualProductName.toLowerCase())
          );

          if (!matched) {
            matched = products[0];
          }

          externalProduct = {
            title: matched.title,
            image: matched.thumbnail || "https://via.placeholder.com/200",
            brand: matched.brand || "Unknown",
            description: matched.description || "No description available",
            category: matched.category || "Unknown"
          };
        } else {
          console.warn('❌ DummyJSON returned no match');
          externalProduct = {
            title: actualProductName,
            image: "https://via.placeholder.com/200",
            brand: "Unknown",
            description: "No description available",
            category: "Unknown"
          };
        }
      } catch (apiErr) {
        console.error('❌ DummyJSON fetch failed:', apiErr.message);
        externalProduct = {
          title: actualProductName,
          image: "https://via.placeholder.com/200",
          brand: "Unknown",
          description: "No description available",
          category: "Unknown"
        };
      }
    } else {
      console.warn('❌ No matching local products found');
    }

    res.json({
      product: externalProduct,
      stores: storeResults
    });
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
