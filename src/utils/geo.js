/**
 * Calculates the distance in meters between two lat/lng points using the Haversine formula.
 * @param {{lat: number, lng: number}} p1 - The first point.
 * @param {{lat: number, lng: number}} p2 - The second point.
 * @returns {number} The distance in meters.
 */
export const haversineDistance = (p1, p2) => {
    const R = 6371.071; // Radius of the Earth in kilometers
    const rlat1 = p1.lat * (Math.PI / 180);
    const rlat2 = p2.lat * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = ((p2.lng ?? p2.lon) - (p1.lng ?? p1.lon)) * (Math.PI / 180);
    const a =
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
        Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2);
    const c = 2 * Math.asin(Math.sqrt(a));
    const km = c * R;
    return km * 1000; // Convert to meters
};

/**
 * Calculates the heading in degrees from one lat/lng point to another.
 * @param {{lat: number, lng: number}} from - The starting point.
 * @param {{lat: number, lng: number}} to - The destination point.
 * @returns {number} The heading in degrees (0-360).
 */
export const calculateHeading = (from, to) => {
    const lat1 = from.lat * (Math.PI / 180);
    const lon1 = (from.lng ?? from.lon) * (Math.PI / 180);
    const lat2 = to.lat * (Math.PI / 180);
    const lon2 = (to.lng ?? to.lon) * (Math.PI / 180);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const brng = Math.atan2(y, x) * (180 / Math.PI);

    return (brng + 360) % 360;
};
