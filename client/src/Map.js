// client/src/Map.js
import React, { useEffect, useRef } from "react";

function Map({ userLocation, stores, selectedStore }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const activeInfoWindow = useRef(null);

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

       // Remove old markers from the map
        markersRef.current.forEach(marker => marker.setMap(null));

        // Close any open InfoWindows
        infoWindowsRef.current.forEach(infoWindow => infoWindow.close());

        activeInfoWindow.current = null;

        // Clear references
        markersRef.current = [];
        infoWindowsRef.current = [];

      stores.forEach(store => {
        if (store.latitude && store.longitude) {
          const marker = new window.google.maps.Marker({

              position: {
                lat: parseFloat(store.latitude),
                lng: parseFloat(store.longitude),
              },

              map: mapInstance.current,
              title: store.store_name,

            });

            markersRef.current.push(marker);

            const googleMapsUrl =
              `https://www.google.com/maps/dir/?api=1` +
              `&origin=${userLocation.latitude},${userLocation.longitude}` +
              `&destination=${store.latitude},${store.longitude}`;

            const infoWindow = new window.google.maps.InfoWindow({
              
              content: `
                <div style="padding:10px;min-width:220px">

                  <h3>${store.store_name}</h3>

                  <p>📍 ${store.address}</p>

                  <p><strong>₹${store.price}</strong></p>

                  <br>

                  <a
                    href="${googleMapsUrl}"
                    target="_blank"
                    style="
                      color:#1976d2;
                      font-weight:bold;
                      text-decoration:none;
                    "
                  >
                    🧭 Open in Google Maps
                  </a>

                </div>
              `,
            });
            infoWindow.addListener("closeclick", () => {
              activeInfoWindow.current = null;
            });

            infoWindowsRef.current.push(infoWindow);

            
            marker.addListener("click", () => {

              // Close previously opened InfoWindow
              if (activeInfoWindow.current) {
                activeInfoWindow.current.close();
              }

              // Open current InfoWindow
              infoWindow.open({
                anchor: marker,
                map: mapInstance.current,
              });

              // Remember this as the active InfoWindow
              activeInfoWindow.current = infoWindow;

            });
      }
    });
  }
    
  }, [stores,
      userLocation.latitude,
      userLocation.longitude]);

  useEffect(() => {

      if (!selectedStore) return;
      console.log("selectedStore effect ran");

      const index = stores.findIndex(
        (store) =>
          store.store_name === selectedStore.store_name &&
          store.address === selectedStore.address &&
          store.price === selectedStore.price
      );

      if (index === -1) return;

      // // Close any previously opened InfoWindow
      // infoWindowsRef.current.forEach((window) => window.close());

      // // Close previous popup
      // if (activeInfoWindow.current) {
      //   activeInfoWindow.current.close();
      // }

      // Close only the currently active popup
      if (
        activeInfoWindow.current &&
        activeInfoWindow.current !== infoWindowsRef.current[index]
      ) {
        activeInfoWindow.current.close();
      }

      // TODO:
      // Refactor to use a single shared InfoWindow.
      // Current implementation has a minor bug:
      // if the user closes the popup using the X button,
      // clicking the same store again doesn't reopen it.

      // Open selected popup
      infoWindowsRef.current[index].open({
        anchor: markersRef.current[index],
        map: mapInstance.current,
      });

      // Remember it
      activeInfoWindow.current = infoWindowsRef.current[index];

      // Center the map
      mapInstance.current.panTo({
        lat: parseFloat(selectedStore.latitude),
        lng: parseFloat(selectedStore.longitude),
      });

      mapInstance.current.setZoom(15);

    }, [selectedStore, 
        stores, 
        userLocation.latitude,
        userLocation.longitude,]);



  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "420px",
        margin: "25px auto",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #ddd",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
    ></div>
  );
}

export default Map;
