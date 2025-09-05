<template>
    <div class="wrapper">
        <div class="flex-center wrap space-between p-05">
            <h1>MapCheckr</h1>
            <div v-if="state.finished" class="flex-center wrap gap-02">
                <Button @click="resetState" text="Reset" />
                <Button @click="debug" text="debug" />
            </div>
        </div>

        <div class="wrapper__inner">
            <div v-if="error" class="container center danger">{{ error }}</div>

            <div v-if="!state.started" class="container">
                <h2>Load Locations</h2>
                <div class="content">
                    <div class="form__row">
                        <input type="file" @change="loadFromJSON" accept=".json" />
                    </div>
                    <p>Or paste GeoJSON/JSON content anywhere on the page.</p>
                </div>
            </div>


            <div v-if="!state.started && state.loaded" class="container">
                <h2>Analyse intersections</h2>
                <div class="content">
                    <div class="form__row">
                        <label for="intersection-radius">Intersection search radius (meters)</label>
                        <input type="number" id="intersection-radius" v-model.number="intersectionRadius" />
                    </div>
                    <Button @click="findDeadIntersections" text="Find Dead Intersections" />
                </div>
            </div>

            <div v-if="state.started" class="container center">
                <h2 v-if="!state.finished" class="flex wrap flex-center justify-center">
                    Processing
                    <Spinner />
                </h2>
                <h2 v-else>Results</h2>
                <p><Badge :text="state.step + '/' + customMap.nbLocs" /> {{ pluralize("location", customMap.nbLocs) }}</p>
                <p><Badge :number="state.success" /> success</p>
                <p><Badge changeClass :number="state.SVNotFound" /> streetview not found</p>
                <p><Badge changeClass :number="state.unofficial" /> unofficial</p>
                <p><Badge changeClass :number="state.noDescription" /> no description (potential trekker)</p>
                <p><Badge changeClass :number="state.wrongGeneration" /> wrong camera generation</p>
                <p><Badge changeClass :number="state.outOfDateRange" /> out of date criteria</p>
                <p v-if="settings.rejectNoLinks || settings.rejectNoLinksIfNoHeading">
                    <Badge changeClass :number="state.isolated" /> isolated{{ settings.rejectNoLinks ? "" : " and unpanned" }}
                </p>
                <p v-if="settings.removeNearby">
                    <Badge changeClass :number="state.tooClose" /> within the same ({{ settings.nearbyRadius }}m) radius
                </p>
            </div>

            <div v-if="state.finished" class="container">
                <h2 class="center">Export</h2>
                <div class="flex-center wrap space-between">
                    <h3 class="success">
                        {{ resolvedLocs.length }} resolved {{ pluralize("location", resolvedLocs.length) }} ({{
                            ((resolvedLocs.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div v-if="resolvedLocs.length" class="flex-center wrap gap-02">
                        <CopyToClipboard :data="resolvedLocs" />
                        <ExportToJSON :data="resolvedLocs" />
                        <ExportToCSV :data="resolvedLocs" />
                    </div>
                </div>

                <hr />
                <div class="flex-center wrap space-between">
                    <h3 class="danger">
                        {{ allRejectedLocs.length }} rejected locations ({{
                            ((allRejectedLocs.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="allRejectedLocs" />
                        <ExportToJSON :data="allRejectedLocs" isRejected />
                        <ExportToCSV :data="allRejectedLocs" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.SVNotFound.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.SVNotFound.length }} SV not found ({{
                            ((rejectedLocs.SVNotFound.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.SVNotFound" />
                        <ExportToJSON :data="rejectedLocs.SVNotFound" isRejected />
                        <ExportToCSV :data="rejectedLocs.SVNotFound" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.unofficial.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.unofficial.length }} unofficial ({{
                            ((rejectedLocs.unofficial.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.unofficial" />
                        <ExportToJSON :data="rejectedLocs.unofficial" isRejected />
                        <ExportToCSV :data="rejectedLocs.unofficial" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.noDescription.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.noDescription.length }} no description (potential trekker) ({{
                            ((rejectedLocs.noDescription.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.noDescription" />
                        <ExportToJSON :data="rejectedLocs.noDescription" isRejected />
                        <ExportToCSV :data="rejectedLocs.noDescription" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.wrongGeneration.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.wrongGeneration.length }} wrong camera generation ({{
                            ((rejectedLocs.wrongGeneration.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.wrongGeneration" />
                        <ExportToJSON :data="rejectedLocs.wrongGeneration" isRejected />
                        <ExportToCSV :data="rejectedLocs.wrongGeneration" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.outOfDateRange.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.outOfDateRange.length }} doesn't match date criteria ({{
                            ((rejectedLocs.outOfDateRange.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.outOfDateRange" />
                        <ExportToJSON :data="rejectedLocs.outOfDateRange" isRejected />
                        <ExportToCSV :data="rejectedLocs.outOfDateRange" isRejected />
                    </div>
                </div>
                <div v-if="rejectedLocs.isolated.length" class="flex-center wrap space-between">
                    <h3 class="danger">
                        - {{ rejectedLocs.isolated.length }} isolated {{ settings.rejectNoLinks ? "" : " and unpanned" }} ({{
                            ((rejectedLocs.isolated.length / customMap.nbLocs) * 100).toFixed(2)
                        }}%)
                    </h3>
                    <div class="flex-center wrap gap-02">
                        <CopyToClipboard :data="rejectedLocs.isolated" />
                        <ExportToJSON :data="rejectedLocs.isolated" isRejected />
                        <ExportToCSV :data="rejectedLocs.isolated" isRejected />
                    </div>
                </div>
            </div>

            <div v-if="state.finished && resolvedLocs.length > 0" class="container">
                <Distribution :locations="resolvedLocs" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import { useStorage } from "@vueuse/core";
import SVreq from "@/utils/SVreq";

const intersectionRadius = ref(10);

const radians = (deg) => (deg * Math.PI) / 180;
const degrees = (rad) => (rad * 180) / Math.PI;
const calculateHeading = (from, to) => {
    // from/to: { lat, lng }
    const lat1 = (from.lat ?? 0) * (Math.PI / 180);
    const lat2 = (to.lat ?? 0) * (Math.PI / 180);
    const dLon = ((to.lng ?? to.lon ?? 0) - (from.lng ?? from.lon ?? 0)) * (Math.PI / 180);
    const heading = (degrees(Math.atan2(dLon, lat2 - lat1)) + 360) % 360;
    return heading;
};

const streetViewService = typeof google !== "undefined" && google.maps ? new google.maps.StreetViewService() : null;

const hasCoverage = ({ lat, lng }, timeoutMs = 5000) => {
    return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            resolve(false);
        }, timeoutMs);

        if (!streetViewService) {
            clearTimeout(timer);
            resolve(false);
            return;
        }

        try {
            streetViewService.getPanorama(
                { location: { lat, lng }, radius: 50, source: google.maps.StreetViewSource.OUTDOOR },
                (data, status) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    const ok = typeof google?.maps?.StreetViewStatus !== "undefined" ? status === google.maps.StreetViewStatus.OK : !!data;
                    resolve(!!ok);
                }
            );
        } catch (err) {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(false);
            }
        }
    });
};

const findIntersections = async (location, radius) => {
    const query = `
        [out:json];
        way(around:${radius},${location.lat},${location.lng})[highway];
        (._;>;);
        out geom;
    `;
    const response = await overpass(query);
    const data = await response.json();

    const nodesToWays = new Map(); // Map<node_id, Set<way_id>>
    const ways = data.elements.filter((e) => e.type === "way");

    for (const way of ways) {
        if (!way.nodes) continue;
        for (const node_id of way.nodes) {
            if (!nodesToWays.has(node_id)) nodesToWays.set(node_id, new Set());
            nodesToWays.get(node_id).add(way.id);
        }
    }

    const intersectionNodeIds = new Set();
    for (const [node_id, way_ids] of nodesToWays.entries()) {
        if (way_ids.size > 1) {
            const wayNames = new Set();
            for (const way_id of way_ids) {
                const way = ways.find(w => w.id === way_id);
                if (way && way.tags && way.tags.name) {
                    wayNames.add(way.tags.name);
                } else {
                    wayNames.add(`unnamed_way_${way_id}`);
                }
            }
            if (wayNames.size > 1) {
                intersectionNodeIds.add(node_id);
            }
        }
    }

    if (intersectionNodeIds.size === 0) {
        return [];
    }

    const intersectionNodes = data.elements.filter(e => e.type === 'node' && intersectionNodeIds.has(e.id));

    const intersections = intersectionNodes.map(node => {
        const connectedWayIds = Array.from(nodesToWays.get(node.id));
        const connectedWays = data.elements.filter(e => e.type === 'way' && connectedWayIds.includes(e.id));
        return {
            node: node,
            ways: connectedWays
        };
    });

    return intersections;
};

const analyzeIntersection = async (intersection) => {
    const { node: intersectionNode, ways } = intersection;
    const all_the_nodes_from_the_ways = ways?.flatMap((way) => way.geometry) ?? [];
    // Compute distance (meters) between two lat/lon points using the haversine formula
    const computeDistanceMeters = (p1, p2) => {
        const R = 6371.071; // km
        const rlat1 = (p1.lat * Math.PI) / 180;
        const rlat2 = (p2.lat * Math.PI) / 180;
        const difflat = rlat2 - rlat1;
        const difflon = ((p2.lon ?? p2.lng) - (p1.lon ?? p1.lng)) * (Math.PI / 180);
        const a =
            Math.sin(difflat / 2) * Math.sin(difflat / 2) +
            Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2);
        const km = 2 * R * Math.asin(Math.sqrt(a));
        return km * 1000;
    };

    // Sort nodes by distance to the intersection node (ascending)
    var all_the_nodes_from_the_ways_sorted_by_distance_to_the_node = all_the_nodes_from_the_ways
        .map(n => ({ node: n, dist: computeDistanceMeters(n, intersectionNode) }))
        .sort((a, b) => a.dist - b.dist);

    // Remove nodes that are closer than the configured intersectionRadius (in meters)
    const minRadiusMeters = intersectionRadius && typeof intersectionRadius.value === "number" ? intersectionRadius.value : 0;
    const filtered_nodes_with_dist = all_the_nodes_from_the_ways_sorted_by_distance_to_the_node.filter(item => {
        // Exclude the exact intersection node and any node closer than the radius
        const isSameAsIntersection = item.node.lat === intersectionNode.lat && item.node.lon === intersectionNode.lon;
        return !isSameAsIntersection && item.dist >= minRadiusMeters;
    });

    // Convert back to an array of nodes (sorted, and outside the radius)
    all_the_nodes_from_the_ways_sorted_by_distance_to_the_node = filtered_nodes_with_dist.map((i) => i.node);
    const coveragePromises = ways.map(way => {
        if (!way.geometry) return Promise.resolve({ wayId: way.id, hasCoverage: false, checkPoint: null });
        const intersectionPointIndex = way.geometry.findIndex(p => p.lat === intersectionNode.lat && p.lon === intersectionNode.lon);
        if (intersectionPointIndex === -1) return Promise.resolve({ wayId: way.id, hasCoverage: false, checkPoint: null });

        // Prefer the second node away from the intersection along the way (skip the adjacent node)
        // i.e., try +2 or -2. If not available, fall back to the immediate neighbor (+1 or -1).
        let checkPoint = null;
        if (intersectionPointIndex + 2 < way.geometry.length) {
            checkPoint = way.geometry[intersectionPointIndex + 2];
        } else if (intersectionPointIndex - 2 >= 0) {
            checkPoint = way.geometry[intersectionPointIndex - 2];
        } else if (intersectionPointIndex + 1 < way.geometry.length) {
            checkPoint = way.geometry[intersectionPointIndex + 1];
        } else if (intersectionPointIndex - 1 >= 0) {
            checkPoint = way.geometry[intersectionPointIndex - 1];
        }



        if (checkPoint) {
            // way.geometry nodes use `.lat` and `.lon`. hasCoverage expects `{ lat, lng }`.
            return hasCoverage({ lat: checkPoint.lat, lng: checkPoint.lon }).then(hasStreetCoverage => {
                return { wayId: way.id, hasCoverage: hasStreetCoverage, checkPoint: checkPoint };
            });
        }

        return Promise.resolve({ wayId: way.id, hasCoverage: false, checkPoint: null });
    });

    const coverageResults = await Promise.all(coveragePromises);
    const deadStreets = coverageResults.filter(r => !r.hasCoverage && r.checkPoint);

    // If the street is dead, check each nearby node for existing coverage and
    // remove nodes that already have coverage. Then pick the second-closest
    // uncovered unique node (fallback to the first if only one exists).
    let secondClosestNode = null;
    if (deadStreets.length > 0) {
        // Candidates: sorted nodes excluding the exact intersection node
        const candidates = all_the_nodes_from_the_ways_sorted_by_distance_to_the_node.filter(
            n => !(n.lat === intersectionNode.lat && n.lon === intersectionNode.lon)
        );

        // Check coverage for each candidate node (parallel)
        const coverageChecks = await Promise.all(
            candidates.map(async (n) => {
                try {
                    const has = await hasCoverage({ lat: n.lat, lng: n.lon });
                    return { node: n, hasCoverage: has };
                } catch (err) {
                    return { node: n, hasCoverage: false };
                }
            })
        );

        // Keep only nodes without coverage
        const uncovered = coverageChecks.filter(c => !c.hasCoverage).map(c => c.node);

        // Deduplicate while preserving order
        const seen = new Set();
        const unique = [];
        for (const n of uncovered) {
            const key = `${n.lat},${n.lon}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(n);
            }
        }

        if (unique.length >= 2) {
            secondClosestNode = unique[1];
        } else if (unique.length === 1) {
            // Fallback to the closest available uncovered node if there's no second one
            secondClosestNode = unique[0];
        }
    }

    return {
        isDead: deadStreets.length > 0,
        deadStreetCheckPoint: secondClosestNode,
    };
};

const findDeadIntersections = async () => {
    // For now, this function will be repurposed to snap locations to the closest intersection.
    console.log(`Starting 'Snap to Intersection' process.`);

    // 1. Reset results and set state to 'processing'
    state.started = true;
    state.finished = false;
    state.step = 0;
    state.success = 0;
    resolvedLocs.length = 0;
    allRejectedLocs.length = 0;
    Object.keys(rejectedLocs).forEach(key => rejectedLocs[key].length = 0);

    // 2. Loop through all locations to check
    for (const location of mapToCheck) {
        try {
            const intersections = await findIntersections(location, intersectionRadius.value);

            if (intersections && intersections.length > 0) {
                // Find the closest intersection
                const intersectionsWithDist = intersections.map(intersection => {
                    const dist = haversineDistance(location, intersection.node);
                    return { ...intersection, dist };
                });

                const closestIntersection = intersectionsWithDist.reduce(
                    (prev, curr) => (prev.dist < curr.dist ? prev : curr)
                );

                try {
                    const panoLoc = await SVreq(
                        { lat: closestIntersection.node.lat, lng: closestIntersection.node.lon },
                        settings.value
                    );

                    if (panoLoc) {
                        location.lat = panoLoc.lat;
                        location.lng = panoLoc.lng;
                        if (panoLoc.panoId) location.panoId = panoLoc.panoId;

                        resolvedLocs.push(location);
                        state.success++;
                    } else {
                        // This case might not be hit if SVreq always rejects on failure.
                        rejectedLocs.SVNotFound.push({ loc: location, reason: "SV_NOT_FOUND" });
                        state.SVNotFound++;
                    }
                } catch (e) {
                    rejectedLocs.SVNotFound.push({ loc: location, reason: e.reason || "SV_NOT_FOUND" });
                    state.SVNotFound++;
                }
            } else {
                // No intersections found for this location.
                rejectedLocs.SVNotFound.push({ loc: location, reason: "NO_INTERSECTION_FOUND" });
                state.SVNotFound++;
            }
        } catch (error) {
            console.error(`Failed to process location:`, location, error);
        }
        state.step++;
    }

    // 3. Finalize state
    state.finished = true;
    console.log(`Finished snapping locations.`);
};

import Button from "@/components/Elements/Button.vue";
import Checkbox from "@/components/Elements/Checkbox.vue";
import Badge from "@/components/Elements/Badge.vue";
import Spinner from "@/components/Elements/Spinner.vue";
import CopyToClipboard from "@/components/CopyToClipboard.vue";
import ExportToJSON from "@/components/ExportToJSON.vue";
import ExportToCSV from "./components/ExportToCSV.vue";
import Distribution from "@/components/CountryDistribution.vue";
//import { haversineDistance } from "@/utils/haversineDistance";
import countryBoundingBoxes from './assets/countryBoundingBoxes.json'
import { overpass } from "overpass-ts";



var outputGeoJsonFeatures = [];
var allSmallBoxesCounter = 0;

// Helper: chunk an array into groups of n
const chunkArray = (arr, n) => {
    if (!Array.isArray(arr) || n <= 0) return [];
    const result = [];
    for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
    return result;
};




const isoToBoundingBox = (iso) => {
    return countryBoundingBoxes[iso].boundingBox;
};
// isoToCountryName removed (unused)

const convertBoundingBoxToSmallerBoxes = (boundingbox) => {
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

const getOsmQueryLocs = () => {
    outputGeoJsonFeatures = [];
    state.osmQueryRunning = true;
    state.osmDataGotCounter = 0;
    allSmallBoxesCounter = 0;
    const query = document.getElementById("query").value;
    const isos = document.getElementById("isos").value;
    const isosArr = isos.split(",").map(x=>x.trim().toUpperCase());
    var smallerCountryBoundingBoxes = {}
    isosArr.forEach((iso) => {
        smallerCountryBoundingBoxes[iso] = convertBoundingBoxToSmallerBoxes(isoToBoundingBox(iso.trim()));
        allSmallBoxesCounter += smallerCountryBoundingBoxes[iso].length;
        getOsmQueryLocsByISO(query, smallerCountryBoundingBoxes);
    });

};

async function getOsmQueryLocsByISO (query, smallerCountryBoundingBoxes){
    Object.keys(smallerCountryBoundingBoxes).forEach((iso)=>{
        getOsmQueryLocsForBboxes(query, smallerCountryBoundingBoxes[iso], iso);
    });
}

async function getOsmQueryLocsForBboxes (query, bboxes, iso) {
    if (bboxes.length == 0){
    state.osmQueryRunning = false;
    const jsonFile = getUnpannedUncheckedJson();
        checkJSON(jsonFile);
        handleClickStart()

        return;
    }
    let outputForm = state.wayPicking == "center"? "center":"geom";
    const osmQuery = `[out:json];
    area["ISO3166-1"="${iso}"]->.searchArea;
    ${query}(${bboxes[0].join(",")})(area.searchArea); out ${outputForm};`;
    await overpass(osmQuery).then((response) => {
        response.json().then((data) => {
            data.elements.forEach((element) => outputGeoJsonFeatures.push(element));
            state.osmDataGotCounter++;
            getOsmQueryLocsForBboxes(query, bboxes.slice(1), iso);
        });
    });
};

// getCenterOfWay removed (unused)

function convertElementToCustomCoordinate(element){
    let type = element.type;
    let lat = 0;
    let lng = 0;
    if (type == "node"){
        lat = element.lat;
        lng = element.lon;
    }
    else if (type == "way"){
    if (state.wayPicking == "random") {
            let randomIndex = Math.floor(Math.random() * element.geometry.length);
            lat = element.geometry[randomIndex].lat;
            lng = element.geometry[randomIndex].lon;
        } else if (state.wayPicking == "center" || type =="relation"){
            lat = element.center.lat;
            lng = element.center.lon;
            //[lat, lng] = getCenterOfWay(element);
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

function getUnpannedUncheckedJson(){
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





const dateToday = new Date().getFullYear() + "-" + ("0" + (new Date().getMonth() + 1)).slice(-2);

const settings = useStorage("mapcheckr_settings", {
    radius: 50,
    filterByGen: {
        1: true,
        23: true,
        4: true,
    },
    filterByDate: {
        from: "2008-01",
        to: dateToday,
    },
    rejectUnofficial: true,
    rejectNoDescription: false,
    rejectNoLinks: false,
    rejectNoLinksIfNoHeading: false,
    updatePanning: false,
    updateCoordinates: true,
    updatePanoIDs: true,
    removeNearby: false,
    nearbyRadius: 10,
    heading: {
        range: [0, 0],
        randomInRange: false,
        filterBy: {
            panned: false,
            unpanned: false,
            panoID: false,
            nonPanoID: false,
        },
        directionBy: {
            1: "forward",
            23: "forward",
            4: "forward",
            DEAD_END: "link",
        },
    },
    pitch: {
        updatePitch: false,
        range: [0, 0],
        randomInRange: false,
    },
    zoom: {
        updateZoom: false,
        range: [0, 0],
        randomInRange: false,
    },
});

const areHeadingSettingsGood = computed(
    () =>
        (settings.value.heading.filterBy.panoID || settings.value.heading.filterBy.nonPanoID) &&
        (settings.value.heading.filterBy.panned || settings.value.heading.filterBy.unpanned)
);

const initialState = {
    loaded: false,
    started: false,
    finished: false,
    step: 0,
    success: 0,
    SVNotFound: 0,
    unofficial: 0,
    noDescription: 0,
    wrongGeneration: 0,
    outOfDateRange: 0,
    isolated: 0,
    tooClose: 0,
    osmQueryStarted: 0,
    osmDataGotCounter: 0,
    wayPicking: "center",
    updatePanning: false,

};

const state = reactive({ ...initialState });

const customMap = ref({});

let mapToCheck = [];
let resolvedLocs = [];
let rejectedLocs = {
    SVNotFound: [],
    unofficial: [],
    noDescription: [],
    wrongGeneration: [],
    outOfDateRange: [],
    isolated: [],
};
let allRejectedLocs = [];

const resetState = () => {
    Object.assign(state, initialState);
    customMap.value = {};
    mapToCheck.length = 0;
    resolvedLocs.length = 0;
    rejectedLocs = {
        SVNotFound: [],
        unofficial: [],
        noDescription: [],
        wrongGeneration: [],
        outOfDateRange: [],
        isolated: [],
    };
    allRejectedLocs.length = 0;
};

const debug = () => {
    console.log("resolvedLocs", resolvedLocs);
    console.log("mapToCheck", mapToCheck);
};

const error = ref("");

// Process
const handleClickStart = () => {
    state.started = true;
    start();
};

const handleRadiusInput = (e) => {
    const value = parseInt(e.target.value);
    if (!value || value < 10) {
        settings.value.radius = 10;
    } else if (value > 1000) {
        settings.value.radius = 1000;
    }
};

const handleDate = (e, type) => {
    const value = parseInt(e.target.value);
    if (!isDateValid(value)) {
        if (type === "from") {
            settings.value.filterByDate.from = "2008-01";
        } else if (type === "to") {
            settings.value.filterByDate.to = dateToday;
        }
    }
};

const isDateValid = (dateStr) => !isNaN(new Date(dateStr));

const handleNearbyRadiusInput = (e) => {
    const value = parseInt(e.target.value);
    if (!value || value < 1) {
        settings.value.nearbyRadius = 1;
    } else if (value > 10000000) {
        settings.value.nearbyRadius = 10000000;
    }
};

const start = async () => {
    const chunkSize = 500;
    // make copy of mapToCheck
    const copy_of_mapToCheck = JSON.parse(JSON.stringify(mapToCheck));
    for (let locationGroup of chunkArray(mapToCheck, chunkSize)) {
        const responses = await Promise.allSettled(locationGroup.map((l) => SVreq(l, settings.value)));
        for (let response of responses) {
            if (response.status === "fulfilled") {
                resolvedLocs.push(response.value);
                state.success++;
            } else {
                console.log(response.value, "reeeesponse.value because not fullfilled");
                switch (response.reason.reason) {
                    case "SV_NOT_FOUND":
                        rejectedLocs.SVNotFound.push(response.reason);
                        state.SVNotFound++;
                        break;
                    case "UNOFFICIAL":
                        rejectedLocs.unofficial.push(response.reason);
                        state.unofficial++;
                        break;
                    case "NO_DESCRIPTION":
                        rejectedLocs.noDescription.push(response.reason);
                        state.noDescription++;
                        break;
                    case "WRONG_GENERATION":
                        rejectedLocs.wrongGeneration.push(response.reason);
                        state.wrongGeneration++;
                        break;
                    case "ISOLATED":
                        rejectedLocs.isolated.push(response.reason);
                        state.isolated++;
                        break;
                    case "OUT_OF_DATE_RANGE":
                        rejectedLocs.outOfDateRange.push(response.reason);
                        state.outOfDateRange++;
                        break;
                }
            }
            state.step++;
        }
    }
    if (settings.value.removeNearby) {
        const newArr = removeNearby(resolvedLocs, settings.value.nearbyRadius);
        state.tooClose = resolvedLocs.length - newArr.length;
        resolvedLocs.length = 0;
        resolvedLocs.push(...newArr);
    }

    // After processing, optionally set heading by mapping resolved locations to original inputs
    if (settings.value.updatePanning) {
        resolvedLocs = panAccordingly(copy_of_mapToCheck, resolvedLocs);
    }
    
    allRejectedLocs = [
        ...rejectedLocs.SVNotFound,
        ...rejectedLocs.unofficial,
        ...rejectedLocs.noDescription,
        ...rejectedLocs.wrongGeneration,
        ...rejectedLocs.outOfDateRange,
        ...rejectedLocs.isolated,
    ];
    allRejectedLocs = allRejectedLocs.map((location) => location.loc);
    state.finished = true;
};




// Import
document.addEventListener("paste", (evt) => {
    const data = evt.clipboardData.getData("text/plain");
    checkJSON(data);
});

const loadFromJSON = (e) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;
    readFile(files[0]);
};

const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        checkJSON(e.target.result);
        console.log(e.target.result);
    };
    reader.readAsText(file);
};

const hasLatLng = (objectArray) =>
    objectArray.every((obj) => obj.hasOwnProperty("lat")) && objectArray.every((obj) => obj.hasOwnProperty("lng"));

const checkJSON = (data) => {
    try {
        let mapData = {};
        if (typeof data === "string") {
            mapData = JSON.parse(data);
        } else {
            mapData = data;
        }
        if (mapData.hasOwnProperty("customCoordinates")) {
            mapData = [...mapData.customCoordinates];
        }
        if (!hasLatLng(mapData)) {
            error.value = "Invalid map data";
            state.loaded = false;
            console.log("Invalid map data");
            return;
        }

        error.value = "";
        customMap.value = { nbLocs: mapData.length };
        mapToCheck = mapData;
        state.loaded = true;
    } catch (err) {
        state.loaded = false;
        error.value = "Invalid map data";
        console.log(err)
    }
};

const removeNearby = (arr, radius) => {
    const newArr = [];
    arr.forEach((point) => {
        const hasClosePoint = newArr.some(
            (found) => haversineDistance({ lat: point.lat, lng: point.lng }, { lat: found.lat, lng: found.lng }) < radius
        );
        if (!hasClosePoint) newArr.push(point);
    });
    return newArr;
};

const haversineDistance = (mk1, mk2) => {
    const R = 6371.071;
    const rlat1 = mk1.lat * (Math.PI / 180);
    // Support both location objects and intersection node objects
    const rlat2 = (mk2.lat ?? mk2.node?.lat) * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = ((mk2.lng ?? mk2.node?.lon) - mk1.lng) * (Math.PI / 180);
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

const pluralize = (text, count) => (count > 1 ? text + "s" : text);

// --- Heading utilities (post-processing) ---
// Map resolved locations to their original entries and set heading accordingly
function panAccordingly(oldArray, newArray) {
    console.log("starting to pan Accordingly");
    console.log("oldArray", oldArray);
    console.log("newArray", newArray);
    let oldDict = {};
    oldArray.forEach((loc) => {
        oldDict[loc.extra.index] = loc;
    });
    console.log
    newArray = newArray.map((loc) => {
        const oldLoc = oldDict[loc.extra.index];
        if (oldLoc) {
            loc.heading = calculateHeading(loc, oldLoc);
        }
        return loc;
    });
    return newArray;
}
</script>

<style>
@import "@/assets/main.css";
@import "@vueform/slider/themes/default.css";

.wrapper {
    margin: 0 auto;
    max-width: 940px;
}

.wrapper__inner {
    border-radius: 0.25rem;
    box-shadow: 0 20px 40px -14px #00000066;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.5rem 0 0.5rem;
    background-color: #303030;
    margin-bottom: 0.5rem;
}

.container {
    background: #3a3a3a;
    padding: 0.5em 1em;
    margin-bottom: 0.5em;
}
.content {
    padding: 0.5rem 1.5rem;
}

.input-file {
    display: none;
}
select,
input[type="range"] {
    width: 140px;
}
.slider-tooltip {
    background-color: var(--success);
    color: #000;
    font-size: 0.8rem;
    padding: 0 5px;
}
</style>
