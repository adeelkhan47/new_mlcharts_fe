<template>
  <div class="home">
    <!-- <div class="actions-wrapper">
      <ul class="actions">
        <li class="action">
          <md-button
            class="md-primary md-raised no-transform"
            @click="showAddDialog = true"
          >
            Add Data Value(s)
          </md-button>
        </li>
      </ul>
    </div> -->

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
            <chart-histogram class="col-chart" />
          </div>
          <xmr-data-excel
            ref="xmrExcelSheet"
            :headings="currentChartHeadings"
          />
        </div>
        <div class="charts" :key="refresh">
          <chart-x
            chartKey="chart1"
            :title="currentChartHeadings.chart1"
            :dataList="dataList"
            :formattedDataList="formattedDataList"
            :lineColors="xChartColors"
            :lineShapes="lineShapes"
            :chartFields="xChartFields"
            :key="[].concat(xChartColors, lineShapes, xChartFields).join(':')"
            @onTitleChange="saveDashboardHeadings"
          />
          <chart-x
            chartKey="chart2"
            :title="currentChartHeadings.chart2"
            :dataList="dataList"
            :formattedDataList="formattedMrDataList"
            :showLCL="false"
            :lineColors="mrChartColors"
            :lineShapes="lineShapes"
            :chartFields="mrChartFields"
            :key="[].concat(mrChartColors, lineShapes, mrChartFields).join(':')"
            @onTitleChange="saveDashboardHeadings"
          />
          <process-capability-ratios
            :dataList="dataList"
            :formattedDataList="processCapabilityRatiosData"
          />
        </div>
      </div>
    </div>

    <!-- <add-data :visibility="showAddDialog" @hide="showAddDialog = false" /> -->

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
        >
          Apply
        </md-button>
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
import ChartHistogram from "../components/charts/HistogramChart.vue";
import XmrDataExcel from "../components/tables/XmrDataExcel.vue";
import StatisticsTable from "../components/tables/StatisticsTable.vue";
// import AddData from "../components/inputs/AddData.vue";
import ChartX from "../components/charts/ChartX.vue";
import ProcessCapabilityRatios from "../components/charts/ProcessCapabilityRatios.vue";
import storageHelper from "../utils/storageHelper.util";
import { mapActions, mapGetters, mapState } from "vuex";
import { dashboardChartApi } from "../api";
import util from "../utils";
import HeadingEditPopup from "../components/utility/HeadingEditPopup.vue";

export default {
  name: "XmrChart",

  components: {
    ChartHistogram,
    StatisticsTable,
    XmrDataExcel,
    // AddData,
    ChartX,
    ProcessCapabilityRatios,
    HeadingEditPopup
  },

  data() {
    return {
      refresh: 1,
      colEditVisibility: false,
      loader: null,
      // showAddDialog: false,
      chartId: "",
      pagePassword: "",
      storeCB: null,
      askPassword: false,
      statisticsData: [],
      formattedDataList: [],
      processCapabilityRatiosData: [],
      formattedMrDataList: [],
      xChartColors: ["black", "red", "#a9a9a9", "red"],
      mrChartColors: ["black", "blue", "#a9a9a9", "blue"],
      lineShapes: ["line", "dash"],
      xChartFields: ["Value", "UCL", "CL", "LCL"],
      mrChartFields: ["Moving Range", "UCL", "CL"]
    };
  },

  computed: {
    ...mapState("dashboardChartModule", ["loading", "password"]),

    ...mapState("xmrChartDataModule", [
      "dataList",
      "dataset",
      "upperSpecLimit",
      "lowerSpecLimit",
      "lockedRowIndex"
    ]),

    ...mapGetters("dashboardChartModule", ["currentChartHeadings"]),

    ...mapGetters("xmrChartDataModule", [
      "cpu",
      "cpl",
      "cpk",
      "xChartData",
      "mrChartData",
      "cumulativeAverage",
      "cumulativeAverageMR",
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
    }
  },

  created() {
    const userObj = storageHelper.getUserObj();
    if (!userObj) {
      this.$router.push("/login");
    } else {
      this.setPageData(() => {
        this.getChart({
          chartId: this.chartId,
          moduleName: "xmrChartDataModule",
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
    ...mapActions("dashboardChartModule", ["getChart", "saveChartHeadings"]),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    ...mapActions("xmrChartDataModule", [
      "init",
      "setUpperSpecLimit",
      "setLowerSpecLimit"
    ]),

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
          key: "Data Count",
          value: this.dataList.length
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
      this.formattedDataList = this.dataList.map((obj) => {
        return {
          key: obj.id + "",
          label: obj.label,
          Value: obj.value,
          note: obj.note,
          CL: util.formatNumber(this.xChartData.cl),
          UCL: util.formatNumber(this.xChartData.ucl),
          LCL: util.formatNumber(this.xChartData.lcl)
        };
      });

      this.processCapabilityRatiosData = this.dataList
        .map((obj) => {
          return {
            key: obj.id + "",
            label: obj.reference1,
            note: obj.note,
            Cpk: util.formatNumber(obj.cumulativeCPK),
            Ppk: util.formatNumber(obj.cumulativePPK)
          };
        })
        .filter(
          (obj) => typeof obj.Cpk !== "string" && typeof obj.Ppk !== "string"
        );

      this.formattedMrDataList = this.dataList
        .filter((obj) => typeof obj.movingRange === "number")
        .map((obj) => {
          return {
            key: obj.id + "",
            label: obj.label,
            "Moving Range": obj.movingRange,
            note: obj.note,
            CL: util.formatNumber(this.mrChartData.cl),
            UCL: util.formatNumber(this.mrChartData.ucl)
          };
        });
    },

    downloadData() {
      if (
        this.$refs &&
        this.$refs.xmrExcelSheet &&
        this.$refs.xmrExcelSheet.downloadData
      )
        this.$refs.xmrExcelSheet.downloadData();
    },

    handleChartLinesDisplay({ displayControlLimits, displayCenterLines }) {
      if (displayControlLimits && displayCenterLines) {
        this.xChartFields = ["Value", "UCL", "CL", "LCL"];
        this.mrChartFields = ["Moving Range", "UCL", "CL"];
        this.xChartColors = ["black", "red", "#a9a9a9", "red"];
        this.mrChartColors = ["black", "blue", "#a9a9a9", "blue"];
        this.lineShapes = ["line", "dash"];
      } else if (displayCenterLines) {
        this.xChartFields = ["Value", "CL"];
        this.mrChartFields = ["Moving Range", "CL"];
        this.xChartColors = ["black", "#a9a9a9"];
        this.mrChartColors = ["black", "#a9a9a9"];
        this.lineShapes = ["line"];
      } else if (displayControlLimits) {
        this.xChartFields = ["Value", "UCL", "LCL"];
        this.mrChartFields = ["Moving Range", "UCL"];
        this.xChartColors = ["black", "red", "red"];
        this.mrChartColors = ["black", "blue", "blue"];
        this.lineShapes = ["line", "dash", "dash"];
      } else {
        this.xChartFields = ["Value"];
        this.mrChartFields = ["Moving Range"];
        this.xChartColors = ["black"];
        this.mrChartColors = ["black"];
        this.lineShapes = ["line"];
      }
    },

    saveDashboardHeadings(newObj) {
      const defaultHeadings = constants.INDIVIDUALS_CHART_DEFAULT_HEADINGS;
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
