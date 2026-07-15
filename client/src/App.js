import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login';
import StoreCard from './components/StoreCard';
import Map from "./Map"; // Now actually using Map.js


const API_BASE = process.env.REACT_APP_API_URL;

// import { useNavigate } from 'react-router-dom'; // Keep for future use

function App() {
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [productData, setProductData] = useState(null);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [locationWarning, setLocationWarning] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Get user location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {

          console.log("Latitude :", position.coords.latitude);
          console.log("Longitude:", position.coords.longitude);
          console.log("Accuracy :", position.coords.accuracy);

          if (position.coords.accuracy > 1000) {
            setLocationWarning(
              "⚠️ Your location couldn't be determined accurately. Nearby stores may not be sorted precisely."
            );
          } else {
            setLocationWarning("");
          }

          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          console.error("Geolocation error message:", error.message);
        },
        {
        enableHighAccuracy: true,
        // timeout: 10000,
        // maximumAge: 0,
        timeout: 20000,
        maximumAge: 60000,
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

    setSearchLoading(true);
    setHasSearched(true);
    // Clear previous search state
    setProductData(null);
    setStores([]);
    setSelectedStore(null);

      try {
        const response = await axios.get(`${API_BASE}/search`, {
          params: {
            product: query,
            userLat: userLocation.latitude,
            userLng: userLocation.longitude,
          },
        });

        console.log("Backend response:", response.data);

        setProductData(response.data.product || null);
        setStores(response.data.stores || []);

      } catch (error) {
        console.error("Error fetching search results:", error);

      } finally {
        setSearchLoading(false);
      }
  };

  return (
    <div className="App">
      {!loggedInUser ? (
        <Login onLoginSuccess={setLoggedInUser} />
      ) : (
        <>
          
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1 style={{ margin: 0 }}>Smart Product Finder</h1>
              <p style={{ marginTop: "10px" }}>
                Welcome, {loggedInUser?.name} 👋
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("user");
                setLoggedInUser(null);
              }}
              style={{
                padding: "10px 18px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>

          {locationWarning && (
            <p
              style={{
                color: "#b26a00",
                background: "#fff3cd",
                border: "1px solid #ffeeba",
                padding: "10px",
                borderRadius: "6px",
                margin: "10px auto",
                width: "fit-content",
              }}
            >
              {locationWarning}
            </p>
          )}

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a product"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {hasSearched &&
            !searchLoading &&
            query &&
            stores.length === 0 &&
            productData === null && (
              <div
                style={{
                  marginTop: "30px",
                  padding: "25px",
                  background: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: "10px",
                  maxWidth: "700px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  🔍 No results found
                </h3>

                <p>
                  We couldn't find any nearby stores selling
                  <strong> "{query}"</strong>.
                </p>

                <p style={{ color: "#666" }}>
                  Try another product name.
                </p>
              </div>
          )}

          {productData && (
            <>
              <h2
                style={{
                  marginTop: "35px",
                  marginBottom: "20px",
                  color: "#333",
                }}
              >
                🔍 Search Results for "<span style={{ color: "#007bff" }}>{query}</span>"
              </h2>

              <div className="product-info">
              <img
                src={productData.image || "https://via.placeholder.com/200"}
                alt={productData.title}
              />

              <div className="product-details">
                <h2>{productData.title}</h2>

                <p>{productData.description}</p>

                <p>
                  <strong>🏷️ Brand:</strong> {productData.brand}
                </p>

                <span>
                  📦 {productData.category}
                </span>
              </div>
            </div>
            </>
          )}

          {/* Using the separate Map component now */}
        
          {stores.length > 0 && (
            <Map
              userLocation={userLocation}
              stores={stores}
              selectedStore={selectedStore}
            />
          )}

          {/* Store count */}
          {stores.length > 0 && (
            <>
              <h2
                style={{
                  marginTop: "30px",
                  marginBottom: "8px",
                  color: "#333",
                }}
              >
                📍 {stores.length} Nearby Store{stores.length > 1 ? "s" : ""} Found
              </h2>

              <p
                style={{
                  color: "#666",
                  marginTop: "0",
                  marginBottom: "20px",
                  fontSize: "15px",
                }}
              >
                Sorted by <strong>Lowest Price</strong> → <strong>Nearest Distance</strong>
              </p>
            </>
          )}

          <div className="store-list">
            {stores.map((store, index) => (
              <StoreCard
                  key={index}
                  store={store}
                  selected={
                    selectedStore &&
                    selectedStore.store_name === store.store_name &&
                    selectedStore.address === store.address
                  }
                  onSelect={setSelectedStore}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
