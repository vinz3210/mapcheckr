<template>
    <Button @click="exportToJsonFile()" text="JSON" />
</template>

<script setup>
import Button from "./Elements/Button.vue";

const props = defineProps({
    data: Array,
    isRejected: Boolean,
    // original filename from the import (optional)
    filename: {
        type: String,
        default: "",
    },
    // action label, expected values: 'datechecked' or 'datetagged'
    action: {
        type: String,
        default: "",
    },
});

const exportToJsonFile = () => {
    const { data, isRejected, filename, action } = props;
    // if data is of type Array put it into an object under the key "customCoordinates"
    let outputData = data;
    if (Array.isArray(data)) {
        outputData = { customCoordinates: data };
    }

    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(outputData));

    // derive a sensible base name from the original filename (strip extension)
    const baseName = filename ? filename.replace(/\.[^/.]+$/, "") : "map";
    const parts = [baseName];
    if (isRejected) parts.push("rejected");
    if (action) parts.push(action);
    const fileName = `${parts.join("-")}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", fileName);
    linkElement.click();
};
</script>
