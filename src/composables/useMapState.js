import { reactive, ref } from "vue";
import { useStorage } from "@vueuse/core";
import { haversineDistance, calculateHeading } from "../utils/geo.js";

const dateToday = new Date().getFullYear() + "-" + ("0" + (new Date().getMonth() + 1)).slice(-2);

export function useMapState() {
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

    const mapToCheck = ref([]);
    const resolvedLocs = ref([]);
    const rejectedLocs = ref({
        SVNotFound: [],
        unofficial: [],
        noDescription: [],
        wrongGeneration: [],
        outOfDateRange: [],
        isolated: [],
    });
    const allRejectedLocs = ref([]);
    const error = ref("");

    const resetState = () => {
        Object.assign(state, initialState);
        customMap.value = {};
        mapToCheck.value = [];
        resolvedLocs.value = [];
        rejectedLocs.value = {
            SVNotFound: [],
            unofficial: [],
            noDescription: [],
            wrongGeneration: [],
            outOfDateRange: [],
            isolated: [],
        };
        allRejectedLocs.value = [];
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
            mapToCheck.value = mapData;
            state.loaded = true;
        } catch (err) {
            state.loaded = false;
            error.value = "Invalid map data";
            console.log(err)
        }
    };

    const readFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            checkJSON(e.target.result);
            console.log(e.target.result);
        };
        reader.readAsText(file);
    };

    const loadFromJSON = (e) => {
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) return;
        readFile(files[0]);
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

    const panAccordingly = (oldArray, newArray) => {
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

    return {
        settings,
        state,
        customMap,
        mapToCheck,
        resolvedLocs,
        rejectedLocs,
        allRejectedLocs,
        error,
        resetState,
        checkJSON,
        loadFromJSON,
        readFile,
        removeNearby,
        panAccordingly,
    };
}
