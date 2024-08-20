import React, { useState, useEffect, memo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  Tooltip,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Import custom store icon (you need to have a custom icon file in your project)
// import storeIconImage from "../public/image/store.png";
// Adjust the path as needed

// Set up default icon for Leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Set up custom store icon
const storeIcon = L.icon({
  iconUrl: (
    <>
      <i classsName="fas fa-shop"></i>
    </>
  ),
  iconSize: [30, 42], // Adjust the size as needed
  iconAnchor: [15, 42], // Adjust the anchor as needed
});

// Function to calculate the distance between two points in kilometers
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Component to update map view
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const Map = ({ storeLocation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setError("Error getting location: " + err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  useEffect(() => {
    if (userLocation && storeLocation) {
      const dist = getDistance(
        userLocation.lat,
        userLocation.lng,
        storeLocation.lat,
        storeLocation.lng
      );
      setDistance(dist);
    }
  }, [userLocation, storeLocation]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userLocation) {
    return <div>Loading location...</div>;
  }

  const polyline = storeLocation
    ? [
        [userLocation.lat, userLocation.lng],
        [storeLocation.lat, storeLocation.lng],
      ]
    : [];

  return (
    <MapContainer
      center={userLocation}
      zoom={15}
      style={{ height: "500px", width: "100%" }}
    >
      <ChangeView center={userLocation} zoom={15 } />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={userLocation}>
        <Popup>Your Location</Popup>
      </Marker>
      {storeLocation && (
        <>
          <Marker position={storeLocation} icon={storeIcon}>
            <Popup>Store Location</Popup>
          </Marker>
          <Polyline positions={polyline} color="blue">
            <Tooltip permanent>
              Distance:{" "}
              {distance ? `${distance.toFixed(2)} km` : "Calculating..."}
            </Tooltip>
          </Polyline>
        </>
      )}
    </MapContainer>
  );
};

export default memo(Map);
