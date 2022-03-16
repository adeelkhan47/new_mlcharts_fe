<template>
  <div class="dashboard">
    <h1 class="md-headline title">
      <md-icon class="icon">dashboard</md-icon> Dashboard
    </h1>
    <div class="body" v-if="!loading">
      <md-table v-model="charts" md-card class="table">
        <md-table-toolbar>
          <div class="md-toolbar-section-start">
            <h1 class="md-title">Available Charts</h1>
          </div>

          <md-button
            class="md-icon-button md-dense md-raised md-primary"
            @click="createChart"
          >
            <md-icon>add</md-icon>
          </md-button>
        </md-table-toolbar>

        <md-table-empty-state
          md-label="No data found"
          md-description="No chart found. Try to create a new chart"
        >
          <md-button class="md-primary md-raised" @click="createChart">
            Create new chart
          </md-button>
        </md-table-empty-state>

        <md-table-row slot="md-table-row" slot-scope="{ item }">
          <md-table-cell md-label="Chart Name">
            {{ item.name }}
          </md-table-cell>
          <md-table-cell md-label="Subgroup Size">
            {{ item.subgroupSize }}
          </md-table-cell>
          <md-table-cell md-label="Chart Type">
            {{ item.chartType }}
          </md-table-cell>
          <md-table-cell md-label="Last Edit">
            {{ time(item.modifiedOn) }}
          </md-table-cell>
          <md-table-cell md-label="Link to Share">
            {{ chartPageLink(item) }}
          </md-table-cell>
          <md-table-cell md-label="Public Link?">
            <md-icon v-if="item.isPublic">check</md-icon>
            <md-icon v-else>lock</md-icon>
          </md-table-cell>
          <md-table-cell md-label="Password">
            <span v-if="!item.isPublic">
              {{ item.password }}
            </span>
            <span v-else class="disabled"> N/A </span>
          </md-table-cell>
          <md-table-cell md-label="Actions">
            <md-button
              :disabled="item.chartType !== 'x-mr'"
              class="md-icon-button md-dense action md-primary"
              @click="() => openChartPage(item)"
            >
              <md-icon>launch</md-icon>
            </md-button>
            <md-button
              class="md-icon-button md-dense action edit"
              @click="() => updateChart(item)"
            >
              <md-icon class="edit">edit</md-icon>
            </md-button>
            <md-button
              class="md-icon-button md-dense action delete"
              @click="
                selectedChart = item;
                ask = true;
              "
            >
              <md-icon class="delete">delete</md-icon>
            </md-button>
            <md-dialog :md-active.sync="ask" class="dialog-wrapper">
              <md-dialog-title>Confirm Action</md-dialog-title>
              <p>Are you sure you want to delete this?</p>
              <md-dialog-actions>
                <md-button
                  class="md-primary"
                  @click="
                    selectedChart = null;
                    ask = false;
                  "
                >
                  Close
                </md-button>
                <md-button class="md-primary" @click="deleteChart">
                  Delete Chart
                </md-button>
              </md-dialog-actions>
            </md-dialog>
          </md-table-cell>
        </md-table-row>
      </md-table>
    </div>
    <chart-popup
      :dashboardChart="selectedChart"
      :visibility="visible"
      @hide="
        visible = false;
        selectedChart = null;
      "
    />
  </div>
</template>

<script>
import moment from "moment";
import { mapActions, mapState } from "vuex";
import ChartPopup from "../components/utility/ChartPopup.vue";

export default {
  components: { ChartPopup },
  name: "Home",

  data() {
    return {
      selectedChart: null,
      visible: false,
      ask: false
    };
  },

  computed: {
    ...mapState("dashboardChartModule", {
      charts: "dashboardCharts",
      loading: "loading"
    }),

    chartPageLink() {
      return this.getChartPageLink;
    },

    time() {
      return function (val) {
        if (val) {
          return moment(val).fromNow();
        } else return "-";
      };
    }
  },

  created() {
    this.init();
  },

  methods: {
    ...mapActions("dashboardChartModule", {
      init: "init",
      deleteDashboardChart: "deleteChart"
    }),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    getCharTypePath(chartType) {
      if (chartType && chartType.length)
        return "/" + chartType.trim().replaceAll(" ", "_").toLowerCase();
      else return "/";
    },

    getChartId(chartName) {
      if (chartName && chartName.length) {
        return chartName.trim().replaceAll(" ", "_").toLowerCase();
      } else return "";
    },

    getChartPageLink(chartObj) {
      if (chartObj && Object.keys(chartObj).length) {
        const chartId = this.getChartId(chartObj.name);
        let path = this.getCharTypePath(chartObj.chartType);
        if (chartId && path) {
          path = window.location.origin + path + "/" + chartId;
          return path;
        }
      }
      return "";
    },

    openChartPage(chartObj) {
      const chartId = this.getChartId(chartObj.name);
      let path = this.getCharTypePath(chartObj.chartType);
      if (chartId && path) {
        path = path + "/" + chartId;
        if (!chartObj.isPublic) path = path;
        this.$router.push(path);
      }
    },

    createChart() {
      this.selectedChart = null;
      this.visible = true;
    },

    updateChart(chart) {
      this.selectedChart = chart;
      this.visible = true;
    },

    deleteChart() {
      this.ask = false;
      const callback = function (response) {
        this.setMessage(response.message);
        this.setShow(true);
      };

      if (this.selectedChart) {
        this.deleteDashboardChart({
          chartId: this.selectedChart.chartId,
          cb: callback
        });
        this.selectedChart = null;
      }
    }
  }
};
</script>

<style scoped>
.dashboard {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
}

.title {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-right: 10px;
  margin-bottom: 10px;
}

.icon {
  margin: 5px;
}

.body {
  margin: 10px;
  position: relative;
  max-width: 100%;
  max-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.disabled {
  pointer-events: none;
  color: #999999;
  letter-spacing: 3px;
  user-select: none;
}

.action {
  cursor: pointer;
  transform: translateX(-40%);
}

.body .action.edit,
.action i.edit {
  color: #24b200;
}

.body .action.delete,
.action i.delete {
  color: red;
}
</style>

<style>
.body .md-table.table {
  margin: 0px;
  width: 100%;
  flex-flow: column;
}

.table .md-table-cell-container {
  text-align: left;
}

.dialog-wrapper .md-dialog-container {
  padding: 10px 20px;
}
</style>
