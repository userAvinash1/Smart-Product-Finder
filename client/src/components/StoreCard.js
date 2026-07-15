import React from 'react';
import "./StoreCard.css";

const StoreCard = ({ store, onSelect, selected }) => {


  return (
    <div
      className={`store-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(store)}
    >
      <h2 className="store-name">
        🏪 {store.store_name}
      </h2>

      <p className="store-detail">
        📍 <strong>Address:</strong> {store.address}
      </p>

      <p className="store-detail">
        💰 <strong>Price:</strong> ₹{store.price}
      </p>

      <p className="store-detail">
        {store.availability ? "✅" : "❌"}{" "}
        <strong>Availability:</strong>{" "}
        {store.availability ? "In Stock" : "Out of Stock"}
      </p>

      <hr className="store-divider" />

      <p className="store-map-text">
        📌 Click to highlight on map
      </p>
    </div>
    
  );

  
};

export default StoreCard;