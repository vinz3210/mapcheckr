<template>
    <div class="wrapper">
        <div class="flex-center wrap space-between p-05">
            <h1>DateCheckr</h1>
            <div v-if="!state.started" class="flex-center wrap gap-05">
                Paste or
                <input @change="loadFromJSON" type="file" id="file" class="input-file" accept="application/json" />
                <label for="file" class="btn">Import JSON</label>
            </div>
            <div v-if="state.finished" class="flex-center wrap gap-02">
                <Button @click="resetState" text="Reset" />
            </div>
        </div>

        <div class="wrapper__inner">
            <div v-if="error" class="container center danger">{{ error }}</div>

            <div v-if="state.loaded" class="container center">
                <h4>{{ customMap.nbLocs }} imported {{ pluralize("location", customMap.nbLocs) }}</h4>
                <Button v-if="!state.started" @click="handleClickStart" class="mt-02" text="Start checking" />
            </div>

            <div v-if="!state.started" class="container">
                <p>Import a Mapchecked/Mapgenerated JSON File to generate out all the Dates for each location, tagged and color coded.</p>
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
                        <CopyToClipboard :data="resolvedLocsMapfile" />
                        <ExportToJSON :data="resolvedLocsMapfile" />
                        <ExportToCSV :data="resolvedLocsMapfile" />
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

import Slider from "@vueform/slider";
import Button from "@/components/Elements/Button.vue";
import Checkbox from "@/components/Elements/Checkbox.vue";
import Badge from "@/components/Elements/Badge.vue";
import Spinner from "@/components/Elements/Spinner.vue";
import CopyToClipboard from "@/components/CopyToClipboard.vue";
import ExportToJSON from "@/components/ExportToJSON.vue";
import ExportToCSV from "@/components/ExportToCSV.vue";
import Distribution from "@/components/CountryDistribution.vue";

const dateToday = new Date().getFullYear() + "-" + ("0" + (new Date().getMonth() + 1)).slice(-2);


function generateRGBColors(numberOfEntries) {
    // generate colors in ascending feeling as RGB values
    const colors = [];
    for (let i = 0; i < numberOfEntries; i++) {
        const r = Math.floor((i * 255) / numberOfEntries);
        const g = Math.floor(((numberOfEntries - i) * 255) / numberOfEntries);
        const b = Math.floor((Math.sin(i / numberOfEntries * Math.PI) * 255));
        colors.push([r, g, b]);
    }
    return colors;

}
const settings = useStorage("datecheckr_settings", {
    radius: 1,
    tagPanoDate: true,
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
};

const state = reactive({ ...initialState });

const customMap = ref({});

let mapToCheck = [];
let resolvedLocs = [];
let resolvedLocsMapfile = {}
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

const error = ref("");

// Process
const handleClickStart = () => {
    state.started = true;
    start();
};


const isDateValid = (dateStr) => !isNaN(new Date(dateStr));


Array.prototype.chunk = function (n) {
    if (!this.length) {
        return [];
    }
    return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};

const start = async () => {
    const chunkSize = 500;
    var panoDateTags = new Set();
    for (let locationGroup of mapToCheck.chunk(chunkSize)) {
        const responses_nested = await Promise.allSettled(locationGroup.map((l) => SVreq(l, settings.value)));
        var responses = [];
        //console.log("responses_nested", responses_nested[0].panoDate);
        for (let response of responses_nested) {
            if (response.status === "fulfilled") {
                response.value.forEach(r=>{
                    if(!( r.panoId.length > 22)){
                            // unofficial panorama, skip


                        let tags = []
                        // create clone of r
                        let r_new = JSON.parse(JSON.stringify(r));
    //                    const tagPanoDate = settings.value && typeof settings.value.tagPanoDate !== 'undefined' ? settings.value.tagPanoDate : true;
                        if(!r_new.extra) {
                            r_new.extra = {};
                        }
                        if(!r_new.extra.tags) {
                            r_new.extra.tags = []
                        }
                        r_new.extra.tags.push(r.mapcheckedPanoDate)
                        panoDateTags.add(r.mapcheckedPanoDate);
                        //console.log("mapchedPanoDate", r_new.mapcheckedPanoDate);
                        //console.log("r_new.extra.tags", r_new.extra.tags);
                        if(r_new.mapcheckedPanoDate){
                            // remove the date from the tags
                            delete r_new.mapcheckedPanoDate;
                        }
                        responses.push({
                            status: "fulfilled",
                            value: r_new,
                        });
                    }
                })
            } else {
                console.error("Error processing location:", response.reason);
            }
        }
        //console.log("responses", responses);
        for (let response of responses) {
            if (response.status === "fulfilled") {
                resolvedLocs.push(response.value);
                state.success++;
            } else {
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
    var extraTags = {};
    if (panoDateTags.size > 0) {
        // array sorted alphabetically
        var sortedPanoDateTags = Array.from(panoDateTags).sort((a, b) => a.localeCompare(b));
        //console.log("sortedPanoDateTags", sortedPanoDateTags);
        var tagColors = generateRGBColors(sortedPanoDateTags.length);
        extraTags = {};
        sortedPanoDateTags.forEach((tag, index) => {
            //console.log("tag", tag, "color", tagColors[index]);
            extraTags[`${tag}`] = { color: tagColors[index] };
        });
    }
    resolvedLocsMapfile = {
        "customCoordinates":resolvedLocs,
        "extra":{"tags":extraTags}
    };

    allRejectedLocs = [
        ...rejectedLocs.SVNotFound,
        ...rejectedLocs.unofficial,
        ...rejectedLocs.noDescription,
        ...rejectedLocs.wrongGeneration,
        ...rejectedLocs.outOfDateRange,
        ...rejectedLocs.isolated,
    ];

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
    };
    reader.readAsText(file);
};

const hasLatLng = (objectArray) =>
    objectArray.every((obj) => obj.hasOwnProperty("lat")) && objectArray.every((obj) => obj.hasOwnProperty("lng"));

const checkJSON = (data) => {
    try {
        let mapData = JSON.parse(data);
        if (mapData.hasOwnProperty("customCoordinates")) {
            mapData = [...mapData.customCoordinates];
        }
        if (!hasLatLng(mapData)) {
            error.value = "Invalid map data";
            state.loaded = false;
            return;
        }

        error.value = "";
        customMap.value = { nbLocs: mapData.length };
        mapToCheck = mapData;
        state.loaded = true;
    } catch (err) {
        state.loaded = false;
        error.value = "Invalid map data";
    }
};


const haversineDistance = (mk1, mk2) => {
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

const pluralize = (text, count) => (count > 1 ? text + "s" : text);
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
