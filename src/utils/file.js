export function getUnpannedUncheckedJson(outputGeoJsonFeatures, convertElementToCustomCoordinate){
    const jsonFile = {
        "name": "out",
        customCoordinates: outputGeoJsonFeatures.map((element, i) => {
            let returnObject =  convertElementToCustomCoordinate(element);
            returnObject.extra.index = i;
            return returnObject;
        }),
    };
    return jsonFile;
}

export function downloadUnpannedUncheckedJsonFile(outputGeoJsonFeatures, convertElementToCustomCoordinate){
    const jsonFile = getUnpannedUncheckedJson(outputGeoJsonFeatures, convertElementToCustomCoordinate);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonFile));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "unpannedUnchecked.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export const downloadGeoJsonFile = (outputGeoJsonFeatures)=>{
    const geoJson = {
        type: "FeatureCollection",
        features: outputGeoJsonFeatures
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoJson));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.geojson");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
