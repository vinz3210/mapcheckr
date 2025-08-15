<template>
    <div class="wrapper">
        <div class="flex-center wrap space-between p-05">
            <h1>DateTagger</h1>
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
                <p>Import a JSON file with locations, and this tool will add a `mapcheckedPanoDate` tag to each location that has a `panoId`.</p>
            </div>

            <div v-if="state.started" class="container center">
                <h2 v-if="!state.finished" class="flex wrap flex-center justify-center">
                    Processing
                    <Spinner />
                </h2>
                <h2 v-else>Finished</h2>
                <p><Badge :text="state.step + '/' + customMap.nbLocs" /> {{ pluralize("location", customMap.nbLocs) }} processed</p>
                <p v-if="state.finished"><Badge :number="state.success" /> {{ pluralize("location", state.success) }} tagged</p>
            </div>

            <div v-if="state.finished" class="container">
                <h2 class="center">Export</h2>
                <div class="flex-center wrap space-between">
                    <h3>
                        {{ resolvedLocs.length }} {{ pluralize("location", resolvedLocs.length) }} to export
                    </h3>
                    <div v-if="resolvedLocs.length" class="flex-center wrap gap-02">
                        <CopyToClipboard :data="resolvedLocs" />
                        <ExportToJSON :data="resolvedLocs" />
                        <ExportToCSV :data="resolvedLocs" />
                    </div>
                </div>
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
};

const state = reactive({ ...initialState });

const customMap = ref({});

let mapToCheck = [];
let resolvedLocs = [];

const resetState = () => {
    Object.assign(state, initialState);
    customMap.value = {};
    mapToCheck.length = 0;
    resolvedLocs.length = 0;
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
    const promises = [];

    for (const location of mapToCheck) {
        state.step++;
        if (location.panoId) {
            const promise = SVreq(location, settings.value)
                .then((res) => {
                    // SVReq may return multiple results for a single location
                    const mainResult = res[0];
                    if (mainResult && mainResult.mapcheckedPanoDate) {
                        location.mapcheckedPanoDate = mainResult.mapcheckedPanoDate;
                        state.success++;
                    }
                    return location;
                })
                .catch((error) => {
                    console.error("Could not process location", location, error);
                    // Return original location on error
                    return location;
                });
            promises.push(promise);
        } else {
            // If no panoId, just push the original location
            promises.push(Promise.resolve(location));
        }
    }

    resolvedLocs = await Promise.all(promises);
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
