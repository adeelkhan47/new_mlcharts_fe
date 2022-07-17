<template>
  <div class="st-wrapper">
    <md-table md-card>
      <md-table-row>
        <md-table-head>Label</md-table-head>
        <md-table-head>Value</md-table-head>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label">
          Upper Spec Limit (optional)
        </md-table-cell>
        <md-table-cell md-label="Value">
          <md-field class="input-field">
            <md-input
              :value="upperSpecLimit"
              @input="upperLimitChanged"
              @change="saveLimits"
              class="spec-input"
            ></md-input>
          </md-field>
        </md-table-cell>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label">
          Lower Spec Limit (optional)
        </md-table-cell>
        <md-table-cell md-label="Value">
          <md-field class="input-field">
            <md-input
              :value="lowerSpecLimit"
              @input="lowerLimitChanged"
              @change="saveLimits"
              class="spec-input"
            ></md-input>
          </md-field>
        </md-table-cell>
      </md-table-row>
      <md-table-row
        slot="md-table-row"
        v-for="item of statisticsData"
        :key="item.key"
      >
        <md-table-cell md-label="Label">
          {{ item.key }}
        </md-table-cell>
        <md-table-cell md-label="Value">
          {{ item.value }}
        </md-table-cell>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label"> Display Control Limits </md-table-cell>
        <md-table-cell md-label="Value">
          <md-checkbox
            v-model="controlLimits"
            class="checkbox-selection md-primary"
            @change="handleLinesDisplayChange"
          ></md-checkbox>
        </md-table-cell>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label"> Display Center Lines </md-table-cell>
        <md-table-cell md-label="Value">
          <md-checkbox
            v-model="centerLines"
            class="checkbox-selection md-primary"
            @change="handleLinesDisplayChange"
          ></md-checkbox>
        </md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
export default {
  name: "StatisticsTable",

  props: {
    statisticsData: {
      type: Array,
      required: true
    },
    upperSpecLimit: {
      required: true
    },
    lowerSpecLimit: {
      required: true
    },
    displayControlLimits: {
      type: Boolean,
      default: true
    },
    displayCenterLines: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      controlLimits: true,
      centerLines: true
    };
  },

  watch: {
    displayControlLimits() {
      if (this.displayControlLimits !== this.controlLimits)
        this.controlLimits = this.displayControlLimits;
    },

    displayCenterLines() {
      if (this.displayCenterLines !== this.centerLines)
        this.centerLines = this.displayCenterLines;
    }
  },

  created() {
    this.centerLines = this.displayCenterLines;
    this.controlLimits = this.displayControlLimits;
  },

  methods: {
    upperLimitChanged(value) {
      this.$emit("specLimitChanged", {
        key: "upper",
        value: value
      });
    },

    lowerLimitChanged(value) {
      this.$emit("specLimitChanged", {
        key: "lower",
        value: value
      });
    },

    saveLimits() {
      this.$emit("saveLimits");
    },

    handleLinesDisplayChange() {
      this.$emit("updateChartLinesDisplay", {
        displayControlLimits: this.controlLimits,
        displayCenterLines: this.centerLines
      });
    }
  }
};
</script>

<style scoped>
.st-wrapper {
  width: 350px;
}

.spec-input {
  width: 100px;
}

.checkbox-selection {
  margin: 0px;
}
</style>

<style>
.st-wrapper .md-table-head-container {
  padding: 6px 0px;
}

.st-wrapper .md-table-cell,
.st-wrapper .md-table-head-container,
.st-wrapper .md-field {
  height: auto;
  min-height: auto;
  margin: 0px;
}
</style>
