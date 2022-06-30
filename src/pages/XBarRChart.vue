<template>
  <div class="home">
    <div class="content-wrapper">
      <div class="content-body">
        <div class="tables">
          <div class="column-row">
            <div class="chart-action">
              <md-button
                class="md-primary md-raised no-transform chart-action-btn"
                @click="downloadData"
              >
                <md-icon>download</md-icon>
                Export to excel
              </md-button>
            </div>
            <statistics-table
              :statisticsData="statisticsData"
              :upperSpecLimit="upperSpecLimit"
              :lowerSpecLimit="lowerSpecLimit"
              @specLimitChanged="handleSpecLimit"
              @saveLimits="saveLimits"
            />
            <x-bar-r-histogram-chart class="col-chart" />
          </div>
          <template v-if="subgroupSize">
            <x-bar-r-data-excel
              :subgroupSize="subgroupSize"
              ref="xBarRExcelSheet"
            />
          </template>
        </div>
        <div class="charts">
          <chart-x
            title="Averages Chart"
            :dataList="dataList"
            :formattedDataList="formattedAverages"
          />
          <chart-x
            title="Ranges Chart"
            :dataList="dataList"
            :formattedDataList="formattedRanges"
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
  </div>
</template>

<script>
import XBarRDataExcel from "../components/tables/XBarRDataExcel.vue";
import StatisticsTable from "../components/tables/StatisticsTable.vue";
import ChartX from "../components/charts/ChartX.vue";
import ProcessCapabilityRatios from "../components/charts/ProcessCapabilityRatios.vue";
import storageHelper from "../utils/storageHelper.util";
import { mapActions, mapGetters, mapState } from "vuex";
import util from "../utils";
import { dashboardChartApi } from "../api";
import XBarRHistogramChart from "../components/charts/XBarRHistogramChart.vue";

export default {
  name: "XBarRChart",

  components: {
    StatisticsTable,
    XBarRDataExcel,
    ChartX,
    ProcessCapabilityRatios,
    XBarRHistogramChart
  },

  data() {
    return {
      loader: null,
      showAddDialog: false,
      chartId: "",
      pagePassword: "",
      storeCB: null,
      askPassword: false,
      statisticsData: [],
      formattedAverages: [],
      formattedDataCPK: [],
      formattedRanges: []
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

    ...mapGetters("xBarRChartDataModule", [
      "cpu",
      "cpl",
      "cpk",
      "xBarData",
      "rangeData",
      "cumulativeAverageRange",
      "cumulativeGrandAverage",
      "cumulativeStdDev"
    ])
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
    ...mapActions("dashboardChartModule", ["getChart"]),
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
          Value: util.formatNumber(obj.average),
          CL: util.formatNumber(this.xBarData.cl),
          UCL: util.formatNumber(this.xBarData.ucl),
          LCL: util.formatNumber(this.xBarData.lcl)
        };
      });

      this.formattedDataCPK = this.dataList.map((obj) => {
        return {
          key: obj.id + "",
          label: obj.reference1,
          cpk: util.formatNumber(obj.cumulativeCPK)
        };
      });

      this.formattedRanges = this.dataList.map((obj) => {
        return {
          key: obj.id + "",
          label: obj.reference1,
          Value: util.formatNumber(obj.range),
          CL: util.formatNumber(this.rangeData.cl),
          UCL: util.formatNumber(this.rangeData.ucl),
          LCL: util.formatNumber(this.rangeData.lcl)
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

.chart-action {
  width: 100%;
  padding: 8px;
  padding-top: 0;
  margin-bottom: 20px;
}

.chart-action-btn {
  margin-top: 2px;
  width: calc(100% - 16px);
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
