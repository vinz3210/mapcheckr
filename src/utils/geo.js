import countryBoundingBoxes from '../assets/countryBoundingBoxes.json'

export const isoToBoundingBox = (iso) => {
    console.log(iso)
    const bbox = countryBoundingBoxes[iso].boundingBox;
    console.log(bbox);
    return bbox;
};

export const isoToCountryName = (iso) => {
    console.log(iso);
    console.log(countryBoundingBoxes);
    console.log(countryBoundingBoxes[iso]);
    return countryBoundingBoxes[iso]["name"];
};

export const convertBoundingBoxToSmallerBoxes = (boundingbox) => {
    const degreestoadd = parseFloat(document.getElementById("degrees").value);
    const minlat = boundingbox["minLat"];
    const minlon = boundingbox["minLng"];
    const maxlat = boundingbox["maxLat"];
    const maxlon = boundingbox["maxLng"];
    const boxes = [];
    let lat = minlat;
    let lon = minlon;
    while (lat < maxlat) {
        while (lon < maxlon) {
            let max_lat = lat + degreestoadd;
            let max_lon = lon + degreestoadd;
            if (max_lat > 180)
                max_lat = 180;
            if (max_lon > 180)
                max_lon = 180;

            boxes.push([lat, lon, max_lat, max_lon]);
            lon += degreestoadd;
        }
        lon = minlon;
        lat += degreestoadd;
    }
    return boxes;
};

export const getCenterOfWay = (way) => {
    let lat = 0;
    let lon = 0;
    way.geometry.forEach((node)=>{
        lat += node.lat;
        lon += node.lon;
    });
    return [lat/way.geometry.length, lon/way.geometry.length];
}

export const haversineDistance = (mk1, mk2) => {
    const R = 6371.071;
    const rlat1 = mk1.lat * (Math.PI / 180);
    const rlat2 = mk2.lat * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = (mk2.lng - mk1.lng) * (Math.PI / 180);
    const km =
        2 *
        R *
        Math.asin(
            Math.sqrt(
                Math.sin(difflat / 2) * Math.sin(difflat / 2) +
                    Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)
            )
        );
    return km * 1000;
};

export const radians = (deg) => {
    return (deg * Math.PI) / 180;
}

export const degrees = (rad) => {
    return (rad * 180) / Math.PI;
}

export const calculateHeading = (newLoc, oldLoc) => {
    // Accept objects with lat/lng directly
    const lat1 = newLoc.lat;
    const lon1 = newLoc.lng;
    const lat2 = oldLoc.lat;
    const lon2 = oldLoc.lng;
    console.log("lat1", lat1, "lon1", lon1, "lat2", lat2, "lon2", lon2);
    let dLat = radians(lat2 - lat1);
    let dLon = radians(lon2 - lon1);
    let heading = degrees(Math.atan2(dLon, dLat));
    heading = (heading + 360) % 360;
    return heading;
}
