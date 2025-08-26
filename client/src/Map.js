// client/src/Map.js
import React, { useEffect, useRef } from "react";

function Map({ userLocation, stores }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Initialize map when userLocation changes
  useEffect(() => {
    if (userLocation.latitude && userLocation.longitude && window.google) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        zoom: 12,
      });

      // User marker
      new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapInstance.current,
        title: "You are here",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    }
  }, [userLocation]);

  // Add store markers when stores change
  useEffect(() => {
    if (mapInstance.current && stores.length > 0) {
      stores.forEach(store => {
        if (store.latitude && store.longitude) {
          new window.google.maps.Marker({
            position: { lat: store.latitude, lng: store.longitude },
            map: mapInstance.current,
            title: store.name,
          });
        }
      });
    }
  }, [stores]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        margin: "20px 0",
        border: "1px solid black"
      }}
    ></div>
  );
}

export default Map;
