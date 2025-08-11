const SV = new google.maps.StreetViewService();

export default function SVreq(loc, settings) {
    return new Promise(async (resolve, reject) => {
        let svNotFoundRetry = false;

        if (!loc.panoId) {
            if(true) {
                let returnLoc = await SV.getPanorama({
                    location: {lat: loc.lat, lng: loc.lng},
                    preference: google.maps.StreetViewPreference.NEAREST, // Set the preference
                    sources: [google.maps.StreetViewSource.GOOGLE], // Only search official panoramas
                    radius: 1 // Search within a 1-meter radius
                  },checkPano).catch((e) =>
                    reject({ loc, reason: e.message })
                );
                if(returnLoc) {
                    // If returnLoc.data.time exists, return an array of locs for each pano. date in form of YYYY-MM
                    if (returnLoc.data.time && Array.isArray(returnLoc.data.time)) {
                        const locs = returnLoc.data.time.map((t) => ({
                            ...loc,
                            panoId: t.pano,
                            panoDate: t.Jz.toISOString().slice(0, 7), // Format date to YYYY-MM
                        }));
                        return resolve(locs);
                    }
                    loc.panoId = returnLoc.data.location.pano;
                    loc.lat = returnLoc.data.location.latLng.lat();
                    loc.lng = returnLoc.data.location.latLng.lng();
                    loc.panoDate = Date.parse(returnLoc.data.imageDate) ? returnLoc.data.imageDate : new Date(returnLoc.data.imageDate).toISOString().slice(0, 7); // Format date to YYYY-MM
                    return resolve([loc]);
                } else {
                    await SV.getPanoramaByLocation(new google.maps.LatLng(loc.lat, loc.lng), 1, checkPano).catch((e) =>
                        reject({ loc, reason: e.message })
                    );
                }
            } else {
                await SV.getPanoramaByLocation(new google.maps.LatLng(loc.lat, loc.lng), 1, checkPano).catch((e) =>
                    reject({ loc, reason: e.message })
                );
            }
        } else {
            await SV.getPanoramaById(loc.panoId, checkPano).catch((e) => reject({ loc, reason: e.message }));
        }

        function checkPano(res, status) {
            if (status != google.maps.StreetViewStatus.OK) {
                if (svNotFoundRetry) {
                    return reject({ loc, reason: "SV_NOT_FOUND" });
                } else {
                    svNotFoundRetry = true;
                    return SV.getPanorama({
                        location: {lat: loc.lat, lng: loc.lng},
                        preference: google.maps.StreetViewPreference.NEAREST, // Set the preference
                        sources: [google.maps.StreetViewSource.GOOGLE], // Only search official panoramas
                        radius: 1 // Search within a 1-meter radius
                    }, checkPano).catch((e) =>
                        reject({ loc, reason: e.message })
                    );
                }
            }

            // If res.time exists, return an array of locs for each pano
            if (res.time && Array.isArray(res.time)) {
                const locs = res.time.map((t) => {
                    // Add 2 days to avoid timezone issues at the start of the month
                    let all_keys = Object.keys(t);
                    // get keys that have two letters and end with z
                    let twoLetterKeys = all_keys.filter(key => key.length === 2 && key.endsWith('z'));
                    if (twoLetterKeys.length === 0) {
                        console.warn("No valid date key found in pano data", t);
                        return reject({ loc, reason: "NO_DATE" });
                    }
                    
                    var dateValue = t[twoLetterKeys[0]]; // Get the first valid date value
                    if (!dateValue) {
                        console.warn("No date value found in pano data", t);
                        return reject({ loc, reason: "NO_DATE" });
                    }
                    let mapcheckedPanoDate = null;
                    if (dateValue) {
                        const date = new Date(dateValue);
                        if (!isNaN(date.getTime())) {
                            date.setDate(date.getDate() + 2);
                            mapcheckedPanoDate = date.toISOString().slice(0, 7); // Format date to YYYY-MM
                        }
                    }
                    return {
                        ...loc,
                        panoId: t.pano,
                        mapcheckedPanoDate, // Will be null if invalid
                    };
                });
                return resolve(locs);
            }

            if (res.location.pano.length != 22) return reject({ ...loc, reason: "UNOFFICIAL" });
            


            // Update coordinates
        
            loc.lat = res.location.latLng.lat();
            loc.lng = res.location.latLng.lng();
        


            resolve([loc]);
        }
    });
}

function getCameraGeneration(res) {
    const { worldSize } = res.tiles;
    switch (worldSize.height) {
        case 1664:
            return 1;
        case 6656:
            return 23;
        case 8192:
            return 4;
        default:
            return 0;
    }
}

const randomInRange = (min, max) => Math.round((Math.random() * (max - min + 1) + min) * 100) / 100;

