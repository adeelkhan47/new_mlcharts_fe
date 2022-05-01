<template>
  <div class="home">
    <div class="actions-wrapper">
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
    </div>

    <div class="content-wrapper">
      <div class="content-body">
        <div class="tables">
          <div class="column-row">
            <statistics-table
              :statisticsData="statisticsData"
              :upperSpecLimit="upperSpecLimit"
              :lowerSpecLimit="lowerSpecLimit"
              @specLimitChanged="handleSpecLimit"
              @saveLimits="saveLimits"
            />
            <chart-histogram class="col-chart" />
          </div>
          <xmr-data-excel />
        </div>
        <div class="charts">
          <chart-x
            title="X Chart"
            :dataList="dataList"
            :formattedDataList="formattedDataList"
          />
          <!-- <chart-mr
            :dataList="dataList"
            :mr="mr"
            :mrAverage="mrAverage"
            :mrControlLimits_UCL="mrControlLimits_UCL"
          /> -->
          <chart-x
            title="MR Chart"
            :dataList="dataList"
            :formattedDataList="formattedMrDataList"
            :showLCL="false"
          />
        </div>
      </div>
    </div>

    <add-data :visibility="showAddDialog" @hide="showAddDialog = false" />

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
import ChartHistogram from "../components/charts/HistogramChart.vue";
import XmrDataExcel from "../components/tables/XmrDataExcel.vue";
import StatisticsTable from "../components/tables/StatisticsTable.vue";
import ChartMr from "../components/charts/ChartMr.vue";
import AddData from "../components/inputs/AddData.vue";
import ChartX from "../components/charts/ChartX.vue";
import storageHelper from "../utils/storageHelper.util";
import { mapActions, mapGetters, mapState } from "vuex";
import { dashboardChartApi } from "../api";
import util from "../utils";

export default {
  name: "XmrChart",

  components: {
    ChartHistogram,
    StatisticsTable,
    XmrDataExcel,
    ChartMr,
    AddData,
    ChartX
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
      formattedDataList: [],
      formattedMrDataList: []
    };
  },

  computed: {
    ...mapState("dashboardChartModule", ["loading", "password"]),

    ...mapState("xmrChartDataModule", [
      "dataList",
      "dataAverage",
      "xControlLimits_UCL",
      "xControlLimits_LCL",
      "mr",
      "mrAverage",
      "mrControlLimits_UCL",
      "estimatedStdDev",
      "upperSpecLimit",
      "lowerSpecLimit",
      "lockedRowIndex"
    ]),

    ...mapGetters("xmrChartDataModule", [
      "cpu",
      "cpl",
      "cpk",
      "xChartData",
      "mrChartData"
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

    estimatedStdDev() {
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
    ...mapActions("dashboardChartModule", ["getChart"]),

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
          key: "Avg. Moving Range",
          value: this.mrAverage
        },
        {
          key: "Data Average",
          value: util.formatNumber(this.dataAverage)
        },
        {
          key: "Estimated Std Dev",
          value: util.formatNumber(this.estimatedStdDev)
        },
        {
          key: "Data Count",
          value: this.dataList.length
        },
        {
          key: "Cpu",
          value: this.cpu.label
        },
        {
          key: "Cpl",
          value: this.cpl.label
        },
        {
          key: "Cpk",
          value: this.cpk.label
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
          CL: util.formatNumber(this.xChartData.cl),
          UCL: util.formatNumber(this.xChartData.ucl),
          LCL: util.formatNumber(this.xChartData.lcl)
        };
      });

      this.formattedMrDataList = this.dataList
        .filter((obj) => typeof obj.movingRange === "number")
        .map((obj) => {
          return {
            key: obj.id + "",
            label: obj.label,
            Value: obj.movingRange,
            CL: util.formatNumber(this.mrChartData.cl),
            UCL: util.formatNumber(this.mrChartData.ucl)
          };
        });
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
