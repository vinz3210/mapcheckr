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
            <h2>Settings</h2>
            <div class="content">
                <div class="form__row">
                    <label for="query">Query</label>
                </div>
                <div class="form__row">
                    <input type="text" id="query" class="full" v-model="query" />
                </div>
                <div class="form__row">
                    <label for="isos">ISO country codes, comma separated</label>
                </div>
                <div class="form__row">
                    <input type="text" id="isos" v-model="iso" />
                </div>
                <div class="form__row">
                    <label for="tags">Tags, comma separated</label>
                </div>
                <div class="form__row">
                    <input type="text" id="tags" v-model="tags" />
                </div>

                <div class="form__row">
                    <label for="degrees">BoxMaxDegrees</label>
                </div>
                <div class="form__row">
                    <input type="number" id="degrees" v-model="degrees" />
                </div>
                
                <div class="form__row">
                    <label for="updatePanningCheckbox">Pan to POI</label>
                </div>
                <div class="form__row">
                    <Checkbox id = "updatePanningCheckbox" v-model:checked="settings.updatePanning" label="update panning" />
                </div>
                <div v-if="state.osmQueryRunning" class="container center">
                    <p><Badge :text=" state.osmDataGotCounter + '/' + allSmallBoxesCounter" /></p>
                </div>
                <div class="form__row">
                    <label for="wayPicking">Way Picking</label>
                </div>
                <div class="form__row">
                    <select id="wayPicking" v-model="state.wayPicking">
                        <option value="center">Center</option>
                        <option value="geom">Geom</option>
                    </select>
                </div>
                <div class="flex-center wrap space-between p-05">
                    <div class="flex-center wrap gap-02">
                        <!--CopyToClipboard :data="resolvedLocs" /-->
                        <Button @click="getOsmQueryLocs" text="GetLocs" />
                    </div>
                    <div class="flex-center wrap gap-02">
                        <Button @click="downloadGeoJsonFile(outputGeoJsonFeatures)" text="DownloadGeoJson" />
                    </div>
                    <!--div class="flex-center wrap gap-02">
                        <Button @click="downloadUnpannedUncheckedJsonFile" text="DownloadUnpannedUncheckedJson" />
                    </div-->
                </div>
            </div>
            </div>
            <div v-if="state.loaded" class="container center">
                <h4>{{ customMap.nbLocs }} imported {{ pluralize("location", customMap.nbLocs) }}</h4>
                <Button v-if="!state.started" @click="handleClickStart" class="mt-02" text="Start checking" />
            </div>

            <div v-if="!state.started" class="container">
                
                <div class="flex-center wrap space-between p-05">
                    <div v-if="state.finished" class="flex-center wrap gap-02">
                        <Button @click="resetState" text="Reset" />
                    </div>
                </div>
                <h2>General settings</h2>
                <div class="content">
                    <div class="flex">
                        <div class="col-50">
                            <h4>Filter by coverage</h4>
                            <Checkbox v-model:checked="settings.filterByGen[1]" label="Gen 1" />
                            <Checkbox v-model:checked="settings.filterByGen[23]" label="Gen 2 & 3" />
                            <Checkbox v-model:checked="settings.filterByGen[4]" label="Gen 4" />
                        </div>

                        <div class="col-50">
                            <h4>Filter by date</h4>
                            <div class="form__row space-between">
                                <label>From :</label>
                                <input
                                    type="month"
                                    v-model="settings.filterByDate.from"
                                    min="2007-01"
                                    :max="dateToday"
                                    @change="handleDate($event, 'from')"
                                />
                            </div>
                            <div class="form__row space-between">
                                <label>To :</label>
                                <input
                                    type="month"
                                    v-model="dateToday"
                                    min="2007-01"
                                    :max="dateToday"
                                    @change="handleDate($event, 'to')"
                                />
                            </div>
                        </div>
                    </div>
                    <hr />

                    <Checkbox
                        v-model:checked="settings.rejectUnofficial"
                        label="Reject unofficial"
                        optText="Uncheck for photospheres map"
                    />
                    <hr />

                    <div v-if="settings.rejectUnofficial">
                        <Checkbox
                            v-model:checked="settings.rejectNoDescription"
                            label="Reject locations without description"
                            optText="This might prevent trekkers in most cases, but can reject regular streetview without
						description (eg. Mongolia/South Korea)"
                        />
                        <hr />
                    </div>
                    <div v-if="settings.rejectUnofficial">
                        <Checkbox
                            v-model:checked="settings.changeToOfficial"
                            label="Change unofficial to official"
                            optText="Change unofficial locations to official within the radius."
                        />
                        <hr />
                    </div>

                    Radius<input type="number" v-model.number="settings.radius" @change="handleRadiusInput" />m<br />
                    <small>Radius in which to search for a non-panoID'ed panorama.</small>
                    <hr />

                    <div class="flex-center">
                        <Checkbox v-model:checked="settings.removeNearby" label="Reject duplicates within a " />
                        <input type="number" v-model.number="settings.nearbyRadius" @change="handleNearbyRadiusInput" />m radius
                    </div>
                    <hr />
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
import { computed } from "vue";
import { useMapState } from "./composables/useMapState.js";
import { useOverpass } from "./composables/useOverpass.js";
import SVreq from "@/utils/SVreq";
import { pluralize } from "@/utils/text.js";
import Button from "@/components/Elements/Button.vue";
import Checkbox from "@/components/Elements/Checkbox.vue";
import Badge from "@/components/Elements/Badge.vue";
import Spinner from "@/components/Elements/Spinner.vue";
import CopyToClipboard from "@/components/CopyToClipboard.vue";
import ExportToJSON from "@/components/ExportToJSON.vue";
import ExportToCSV from "./components/ExportToCSV.vue";
import Distribution from "@/components/CountryDistribution.vue";

const {
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
    removeNearby,
    panAccordingly,
} = useMapState();

import { downloadGeoJsonFile } from "@/utils/file.js";

const { getOsmQueryLocs, outputGeoJsonFeatures } = useOverpass(state, checkJSON, handleClickStart);

const dateToday = new Date().getFullYear() + "-" + ("0" + (new Date().getMonth() + 1)).slice(-2);

const areHeadingSettingsGood = computed(
    () =>
        (settings.value.heading.filterBy.panoID || settings.value.heading.filterBy.nonPanoID) &&
        (settings.value.heading.filterBy.panned || settings.value.heading.filterBy.unpanned)
);

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

Array.prototype.chunk = function (n) {
    if (!this.length) {
        return [];
    }
    return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};

const start = async () => {
    const chunkSize = 500;
    // make copy of mapToCheck
    const copy_of_mapToCheck = JSON.parse(JSON.stringify(mapToCheck));
    for (let locationGroup of mapToCheck.chunk(chunkSize)) {
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
    console.log(1)
    allRejectedLocs = [
        ...rejectedLocs.SVNotFound,
        ...rejectedLocs.unofficial,
        ...rejectedLocs.noDescription,
        ...rejectedLocs.wrongGeneration,
        ...rejectedLocs.outOfDateRange,
        ...rejectedLocs.isolated,
    ];
    console.log(2)
    allRejectedLocs = allRejectedLocs.map(location =>{
        return location.loc
    });
    console.log(3)
    state.finished = true;
};

document.addEventListener("paste", (evt) => {
    const data = evt.clipboardData.getData("text/plain");
    checkJSON(data);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

document.addEventListener("drop", (e) => {
    e.preventDefault();
    loadFromJSON(e);
});
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
