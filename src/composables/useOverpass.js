import { overpass } from "overpass-ts";
import { isoToBoundingBox, convertBoundingBoxToSmallerBoxes } from "../utils/geo.js";

export function useOverpass(state, checkJSON, handleClickStart) {
    let outputGeoJsonFeatures = [];
    let allSmallBoxesCounter = 0;

    const getUnpannedUncheckedJson = () => {
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

    const convertElementToCustomCoordinate = (element) => {
        let type = element.type;
        let lat = 0;
        let lng = 0;
        if (type == "node"){
            lat = element.lat;
            lng = element.lon;
        }
        else if (type == "way"){
            if(state.wayPicking == "random"){
                let randomIndex = Math.floor(Math.random() * element.geometry.length);
                lat = element.geometry[randomIndex].lat;
                lng = element.geometry[randomIndex].lon;
            } else if (state.wayPicking == "center" || type =="relation"){
                console.log(element);
                lat = element.center.lat;
                lng = element.center.lon;
            }
        }
        else{
            console.log("Unknown type: " + type);
        }
        let tags_to_include = document.getElementById("tags").value.split(",").map(x=>x.trim());
        return {lat: lat, lng: lng, extra:{
            tags: tags_to_include.map((tag)=>{return element.tags[tag]==undefined?"":tag+" - "+element.tags[tag]}).filter((tag)=>{return tag != ""}),
        }};
    }

    async function getOsmQueryLocsForBboxesWithoutISO (query, bboxes) {
        if (bboxes.length == 0){

            console.log(outputGeoJsonFeatures)


            console.log("finished 1")
            state.osmQueryRunning = false;
            const jsonFile = getUnpannedUncheckedJson();
            console.log("unpannedUnchecked.json", jsonFile);
            checkJSON(jsonFile);
            handleClickStart()

            return;
        }
        let outputForm = state.wayPicking == "center"? "center":"geom";
        const osmQuery = `[out:json];
        ${query}(${bboxes[0].join(",")}); out ${outputForm};`;
        console.log(osmQuery);
        await overpass(osmQuery, { endpoint: "https://overpass.mail.ru/api/interpreter" }).then((response) => {
            response.json().then(data =>{
                console.log(data)
                data.elements.forEach((element) => {

                    outputGeoJsonFeatures.push(element)
                })
                console.log(outputGeoJsonFeatures.length);
                state.osmDataGotCounter++;
                getOsmQueryLocsForBboxesWithoutISO(query, bboxes.slice(1));
            }
            );
        });
    };

    async function getOsmQueryLocsForBboxes (query, bboxes, iso) {
        if (bboxes.length == 0){

            console.log(outputGeoJsonFeatures)


            console.log("finished 1")
            state.osmQueryRunning = false;
            const jsonFile = getUnpannedUncheckedJson();
            console.log("unpannedUnchecked.json", jsonFile);
            checkJSON(jsonFile);
            handleClickStart()

            return;
        }
        let outputForm = state.wayPicking == "center"? "center":"geom";
        const osmQuery = `[out:json];
        area["ISO3166-1"="${iso}"]->.searchArea;
        ${query}(${bboxes[0].join(",")})(area.searchArea); out ${outputForm};`;
        console.log(osmQuery);
        await overpass(osmQuery, { endpoint: "https://overpass.mail.ru/api/interpreter" }).then((response) => {
            response.json().then(data =>{
                console.log(data)
                data.elements.forEach((element) => {

                    outputGeoJsonFeatures.push(element)
                })
                console.log(outputGeoJsonFeatures.length);
                state.osmDataGotCounter++;
                getOsmQueryLocsForBboxes(query, bboxes.slice(1), iso);
            }
            );
        });
    };

    async function getOsmQueryLocsByISO (query, smallerCountryBoundingBoxes){
        Object.keys(smallerCountryBoundingBoxes).forEach((iso)=>{
            getOsmQueryLocsForBboxes(query, smallerCountryBoundingBoxes[iso], iso);
        });
    }

    const getOsmQueryLocs = () => {
        outputGeoJsonFeatures = [];
        state.osmQueryRunning = true;
        state.osmDataGotCounter = 0;
        allSmallBoxesCounter = 0;
        const query = document.getElementById("query").value;
        const isos = document.getElementById("isos").value;
        if (isos === "") {
            const worldBoundingBox = { minLat: -90, minLng: -180, maxLat: 90, maxLng: 180 };
            const smallerWorldBoundingBoxes = convertBoundingBoxToSmallerBoxes(worldBoundingBox);
            allSmallBoxesCounter = smallerWorldBoundingBoxes.length;
            getOsmQueryLocsForBboxesWithoutISO(query, smallerWorldBoundingBoxes);
        } else {
            const isosArr = isos.split(",").map(x=>x.trim().toUpperCase());
            var smallerCountryBoundingBoxes = {}
            isosArr.forEach((iso) => {
                smallerCountryBoundingBoxes[iso] = convertBoundingBoxToSmallerBoxes(isoToBoundingBox(iso.trim()));
                allSmallBoxesCounter += smallerCountryBoundingBoxes[iso].length;
                getOsmQueryLocsByISO(query, smallerCountryBoundingBoxes);
            });
        }
    };

    return {
        getOsmQueryLocs,
    };
}
