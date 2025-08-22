<template>
    <Button @click="exportToJsonFile()" text="JSON" />
</template>

<script setup>
import Button from "./Elements/Button.vue";

const { data, isRejected } = defineProps({
    data: Array,
    isRejected: Boolean,
});

const exportToJsonFile = () => {
    // if data is of type Array put it into an object under the key "customCoordinates"
    let outputData = data;
    if (Array.isArray(data)) {
        outputData = { customCoordinates: data };
    }
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(outputData));
    const fileName = `${outputData.customCoordinates.length} ${isRejected ? "rejected" : "resolved"} location${outputData.customCoordinates.length > 1 ? "s" : ""}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", fileName);
    linkElement.click();
};
</script>
