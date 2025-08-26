import React from 'react';

const StoreCard = ({ store }) => {
  return (
    <div className="store-card">
      <h3>{store.store_name}</h3>
      <p><strong>Address:</strong> {store.address}</p>
      <p><strong>Price:</strong> ₹{store.price}</p>
      <p><strong>Availability:</strong> {store.availability ? 'In stock' : 'Out of stock'}</p>
    </div>
  );
};

export default StoreCard;
