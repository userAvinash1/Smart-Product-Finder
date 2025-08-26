import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login';
import StoreCard from './components/StoreCard';
import Map from "./Map"; // ✅ Now actually using Map.js

// import { useNavigate } from 'react-router-dom'; // Keep for future use

function App() {
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [productData, setProductData] = useState(null);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Get user location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleSearch = async () => {
    if (!query || !userLocation.latitude || !userLocation.longitude) {
      console.warn("Query or location not available");
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/search', {
        params: {
          product: query,
          userLat: userLocation.latitude,
          userLng: userLocation.longitude,
        },
      });

      console.log('✅ Backend response:', response.data);

      setProductData(response.data.product);
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  return (
    <div className="App">
      {!loggedInUser ? (
        <Login onLoginSuccess={setLoggedInUser} />
      ) : (
        <>
          <h1>Smart Product Finder</h1>
          <p>Welcome, {loggedInUser.name} 👋</p>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a product"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {productData && (
            <div className="product-info">
              <img
                src={productData.image || 'https://via.placeholder.com/200'}
                alt={productData.title || 'Product'}
                className="product-image"
              />
              <h2>{productData.title}</h2>
              <p>{productData.description}</p>
              <span>📦 Category: {productData.category}</span>
            </div>
          )}

          {/* ✅ Using the separate Map component now */}
          <Map userLocation={userLocation} stores={stores} />

          <div className="store-list">
            {stores.map((store, index) => (
              <StoreCard key={index} store={store} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
