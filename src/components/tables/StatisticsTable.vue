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
              @change="upperLimitChanged"
              type="number"
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
              @change="lowerLimitChanged"
              type="number"
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
    }
  },

  methods: {
    upperLimitChanged(event) {
      this.$emit("specLimitChanged", {
        key: "upper",
        value: Number.parseInt(event.target.value)
      });
    },

    lowerLimitChanged(event) {
      this.$emit("specLimitChanged", {
        key: "lower",
        value: Number.parseInt(event.target.value)
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
  background: red;
  width: 100px;
}
</style>
