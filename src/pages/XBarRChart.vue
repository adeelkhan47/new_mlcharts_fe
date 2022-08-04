<template>
  <div class="home">
    <div class="content-wrapper">
      <div class="content-body">
        <div class="tables">
          <div class="column-row">
            <div class="chart-actions">
              <md-button
                class="md-primary md-raised no-transform chart-action-btn"
                @click="downloadData"
              >
                <md-icon>download</md-icon>
                Export to excel
              </md-button>
              <md-button
                class="md-primary md-raised no-transform chart-action-btn"
                @click="() => setEditModel(true)"
              >
                <md-icon>edit</md-icon>
                Edit Columns
              </md-button>
            </div>
            <statistics-table
              :statisticsData="statisticsData"
              :upperSpecLimit="upperSpecLimit"
              :lowerSpecLimit="lowerSpecLimit"
              @specLimitChanged="handleSpecLimit"
              @saveLimits="saveLimits"
              @updateChartLinesDisplay="handleChartLinesDisplay"
            />
            <x-bar-r-histogram-chart class="col-chart" />
          </div>
          <template v-if="subgroupSize">
            <x-bar-r-data-excel
              :subgroupSize="subgroupSize"
              ref="xBarRExcelSheet"
              :headings="currentChartHeadings"
            />
          </template>
        </div>
        <div class="charts" :key="refresh">
          <chart-x
            chartKey="chart1"
            :title="currentChartHeadings.chart1"
            :dataList="dataList"
            :formattedDataList="formattedAverages"
            :lineColors="averageChartColors"
            :lineShapes="lineShapes"
            :chartFields="averageChartFields"
            :key="
              []
                .concat(averageChartColors, lineShapes, averageChartFields)
                .join(':')
            "
            @onTitleChange="saveDashboardHeadings"
          />
          <chart-x
            chartKey="chart2"
            :title="currentChartHeadings.chart2"
            :dataList="dataList"
            :formattedDataList="formattedRanges"
            :lineColors="rangeChartColors"
            :lineShapes="lineShapes"
            :chartFields="rangeChartFields"
            :key="
              []
                .concat(rangeChartColors, lineShapes, rangeChartFields)
                .join(':')
            "
            @onTitleChange="saveDashboardHeadings"
          />
          <process-capability-ratios
            :dataList="dataList"
            :formattedDataList="formattedDataCPK"
          />
        </div>
      </div>
    </div>

    <md-dialog :md-active="askPassword">
      <md-dialog-title> Password is required </md-dialog-title>

      <div class="md-layout-item md-small-size-100 input-field">
        <md-field>
          <label for="chart-type">Password</label>
          <md-input v-model="pagePassword" required />
        </md-field>
      </div>

      <md-dialog-actions>
        <md-button class="md-primary" @click="noPass">Close</md-button>
        <md-button
          class="md-primary"
          @click="sendPassword"
          :disabled="!pagePassword"
          >Apply</md-button
        >
      </md-dialog-actions>
    </md-dialog>
    <heading-edit-popup
      title="Edit Column Titles"
      :fields="colFields"
      :visibility="colEditVisibility"
      @onClose="() => setEditModel(false)"
      @onSubmit="saveColumnTitles"
    />
  </div>
</template>

<script>
import constants from "../utils/constants.util";
import XBarRDataExcel from "../components/tables/XBarRDataExcel.vue";
import StatisticsTable from "../components/tables/StatisticsTable.vue";
import ChartX from "../components/charts/ChartX.vue";
import ProcessCapabilityRatios from "../components/charts/ProcessCapabilityRatios.vue";
import storageHelper from "../utils/storageHelper.util";
import { mapActions, mapGetters, mapState } from "vuex";
import util from "../utils";
import { dashboardChartApi } from "../api";
import XBarRHistogramChart from "../components/charts/XBarRHistogramChart.vue";
import HeadingEditPopup from "../components/utility/HeadingEditPopup.vue";

export default {
  name: "XBarRChart",

  components: {
    StatisticsTable,
    XBarRDataExcel,
    ChartX,
    ProcessCapabilityRatios,
    XBarRHistogramChart,
    HeadingEditPopup
  },

  data() {
    return {
      refresh: 1,
      colEditVisibility: false,
      loader: null,
      showAddDialog: false,
      chartId: "",
      pagePassword: "",
      storeCB: null,
      askPassword: false,
      statisticsData: [],
      formattedAverages: [],
      formattedDataCPK: [],
      formattedRanges: [],
      averageChartColors: ["black", "red", "#a9a9a9", "red"],
      rangeChartColors: ["black", "blue", "#a9a9a9", "blue"],
      lineShapes: ["line", "dash"],
      averageChartFields: ["Average", "Avg UCL", "Avg CL", "Avg LCL"],
      rangeChartFields: ["Range", "Rng UCL", "Rng CL", "Rng LCL"]
    };
  },

  computed: {
    ...mapState("dashboardChartModule", ["loading", "password"]),

    ...mapState("xBarRChartDataModule", [
      "dataList",
      "dataset",
      "subgroupSize",
      "upperSpecLimit",
      "lowerSpecLimit",
      "lockedRowIndex"
    ]),

    ...mapGetters("dashboardChartModule", ["currentChartHeadings"]),

    ...mapGetters("xBarRChartDataModule", [
      "cpu",
      "cpl",
      "cpk",
      "xBarData",
      "rangeData",
      "cumulativeAverageRange",
      "cumulativeGrandAverage",
      "cumulativeStdDev"
    ]),

    colFields() {
      const headings = this.currentChartHeadings || {};
      return [
        {
          label: "Reference 1 title",
          key: "col2",
          value: headings.col2
            ? headings.col2.replace("(Appears on chart)", "")
            : ""
        },
        {
          label: "Reference 2 title",
          key: "col3",
          value: headings.col3 || ""
        }
      ];
    }
  },

  watch: {
    loading(val) {
      if (val) {
        this.loader = this.$loading.show({
          loader: "dots",
          opacity: 0.7
        });
      } else if (this.loader) {
        this.loader.hide();
        this.loader = null;
      }
    },

    dataList() {
      this.refresh = Math.random();
      this.setChartData();
    },

    subgroupSize() {
      this.setStatisticsData();
    },

    cumulativeStdDev() {
      this.setStatisticsData();
    },

    upperSpecLimit() {
      this.setStatisticsData();
    },

    lowerSpecLimit() {
      this.setStatisticsData();
    },

    lockedRowIndex() {
      this.setStatisticsData();
      this.setChartData();
    },

    cpu() {
      this.setStatisticsData();
    },

    cpl() {
      this.setStatisticsData();
    },

    cpk() {
      this.setStatisticsData();
    },

    dataset() {
      this.setStatisticsData();
    }
  },

  created() {
    this.$store.commit("xBarRChartDataModule/reset");
    const userObj = storageHelper.getUserObj();
    if (!userObj) {
      this.$router.push("/login");
    } else {
      this.setPageData(() => {
        this.getChart({
          chartId: this.chartId,
          moduleName: "xBarRChartDataModule",
          cb: this.handleResponse,
          getMeThePassword: this.handlePass
        });
      });
    }
  },

  mounted() {
    this.setStatisticsData();
    this.setPageData();
  },

  methods: {
    ...mapActions("xBarRChartDataModule", [
      "setUpperSpecLimit",
      "setLowerSpecLimit"
    ]),
    ...mapActions("dashboardChartModule", ["getChart", "saveChartHeadings"]),
    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    handleSpecLimit({ key, value }) {
      if (key === "upper") {
        this.setUpperSpecLimit(value);
      } else {
        this.setLowerSpecLimit(value);
      }
    },

    saveLimits() {
      if (this.chartId) {
        dashboardChartApi.updateDashboardSpecLimits(this.chartId, {
          upperSpecLimit: this.upperSpecLimit,
          lowerSpecLimit: this.lowerSpecLimit
        });
      }
    },

    setStatisticsData() {
      this.statisticsData = [
        {
          key: "Subgroup Size",
          value: this.subgroupSize
        },
        {
          key: "Cpu (overall)",
          value: util.formatNumber(this.dataset.cpu)
        },
        {
          key: "Cpl (overall)",
          value: util.formatNumber(this.dataset.cpl)
        },
        {
          key: "Cpk (overall)",
          value: util.formatNumber(this.dataset.cpk)
        }
      ];
    },

    handlePass(storeCB) {
      this.storeCB = storeCB;
      this.askPassword = true;
    },

    noPass() {
      this.setMessage("Access Denied");
      this.setShow(true);
      this.$router.push("/dashboard");
    },

    sendPassword() {
      if (this.storeCB) {
        this.storeCB(this.pagePassword);
        this.storeCB = null;
        this.askPassword = false;
      } else {
        this.setMessage("Access Denied");
        this.setShow(true);
        this.$router.push("/dashboard");
      }
    },

    handleResponse(response) {
      if (response && !response.success) {
        if (response.message) {
          this.setMessage(response.message);
          this.setShow(true);
        }

        if (this.loader) {
          this.loader.hide();
          this.loader = null;
        }
        this.$router.push("/dashboard");
      }
    },

    setPageData(cb = null) {
      let pathname = window.location.pathname;
      pathname = pathname.split("/");
      this.chartId = pathname[pathname.length - 1] || "";

      if (cb) cb();
    },

    setChartData() {
      this.formattedAverages = this.dataList.map((obj) => {
        return {
          key: obj.id + "",
          label: obj.reference1,
          note: obj.note,
          Average: util.formatNumber(obj.average),
          "Avg CL": util.formatNumber(this.xBarData.cl),
          "Avg UCL": util.formatNumber(this.xBarData.ucl),
          "Avg LCL": util.formatNumber(this.xBarData.lcl)
        };
      });

      this.formattedDataCPK = this.dataList
        .map((obj) => {
          return {
            key: obj.id + "",
            label: obj.reference1,
            note: obj.note,
            Cpk: util.formatNumber(obj.cumulativeCPK)
          };
        })
        .filter((obj) => typeof obj.Cpk !== "string");

      this.formattedRanges = this.dataList.map((obj) => {
        return {
          key: obj.id + "",
          label: obj.reference1,
          note: obj.note,
          Range: util.formatNumber(obj.range),
          "Rng CL": util.formatNumber(this.rangeData.cl),
          "Rng UCL": util.formatNumber(this.rangeData.ucl),
          "Rng LCL": util.formatNumber(this.rangeData.lcl)
        };
      });
    },

    downloadData() {
      if (
        this.$refs &&
        this.$refs.xBarRExcelSheet &&
        this.$refs.xBarRExcelSheet.downloadData
      )
        this.$refs.xBarRExcelSheet.downloadData();
    },

    handleChartLinesDisplay({ displayControlLimits, displayCenterLines }) {
      if (displayControlLimits && displayCenterLines) {
        this.averageChartFields = ["Average", "Avg UCL", "Avg CL", "Avg LCL"];
        this.rangeChartFields = ["Range", "Rng UCL", "Rng CL", "Rng LCL"];
        this.averageChartColors = ["black", "red", "#a9a9a9", "red"];
        this.rangeChartColors = ["black", "blue", "#a9a9a9", "blue"];
        this.lineShapes = ["line", "dash"];
      } else if (displayCenterLines) {
        this.averageChartFields = ["Average", "Avg CL"];
        this.rangeChartFields = ["Range", "Rng CL"];
        this.averageChartColors = ["black", "#a9a9a9"];
        this.rangeChartColors = ["black", "#a9a9a9"];
        this.lineShapes = ["line"];
      } else if (displayControlLimits) {
        this.averageChartFields = ["Average", "Avg UCL", "Avg LCL"];
        this.rangeChartFields = ["Range", "Rng UCL", "Rng LCL"];
        this.averageChartColors = ["black", "red", "red"];
        this.rangeChartColors = ["black", "blue", "blue"];
        this.lineShapes = ["line", "dash", "dash"];
      } else {
        this.averageChartFields = ["Average"];
        this.rangeChartFields = ["Range"];
        this.averageChartColors = ["black"];
        this.rangeChartColors = ["black"];
        this.lineShapes = ["line"];
      }
    },

    saveDashboardHeadings(newObj) {
      const defaultHeadings = constants.SUB_GROUPED_CHART_DEFAULT_HEADINGS;

      const newHeading = {};
      for (const key in newObj) {
        let value = newObj[key];
        if (!value) value = defaultHeadings[key];
        newHeading[key] = value;
      }

      const headings = Object.assign({}, this.currentChartHeadings, newHeading);
      const changed =
        JSON.stringify(this.currentChartHeadings) !== JSON.stringify(headings);

      if (changed)
        this.saveChartHeadings({
          chartId: this.chartId,
          headings: headings,
          cb: (response) => {
            if (response && !response.success) {
              if (response.message) {
                this.setMessage(response.message);
                this.setShow(true);
              }
            }
          }
        });
    },

    setEditModel(visibility) {
      this.colEditVisibility = visibility;
    },

    saveColumnTitles(cols) {
      this.setEditModel(false);

      const payload = cols.reduce((finalObj, colObj) => {
        finalObj[colObj.key] = colObj.value;
        return finalObj;
      }, {});

      this.saveDashboardHeadings(payload);
    }
  }
};
</script>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
}

.actions-wrapper {
  margin-left: auto;
  padding: 5px;
  border-radius: 10px;
  border: 1px solid lightgrey;
  margin-bottom: 30px;
  background: #eee;
}

.actions {
  list-style-type: none;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0px;
  padding: 0px;
}

.content-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center !important;
  justify-content: center;
}

.content-body {
  width: 100%;
  max-width: 1500px;
}

.tables {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.tables > * {
  margin: 20px 5px;
}

.column-row {
  display: flex;
  flex-direction: column;
  width: 350px;
}

.chart-actions {
  width: 100%;
  padding: 8px;
  padding-top: 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.chart-action-btn {
  margin-top: 2px;
  flex: 1;
}

.col-chart {
  transform: translateX(-25px);
}

.charts {
  padding: 10px;
  padding-right: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-transform {
  text-transform: none;
}

.input-field {
  padding: 5px 15px;
}
</style>
