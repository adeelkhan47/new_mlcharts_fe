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
          <display-layout />
          <data-excel />
        </div>
        <div class="charts">
          <chart-x />
          <chart-mr />
          <chart-histogram />
        </div>
      </div>
    </div>

    <add-data :visibility="showAddDialog" @hide="showAddDialog = false" />
  </div>
</template>

<script>
import ChartHistogram from "../components/charts/HistogramChart.vue";
import DataExcel from "../components/tables/DataExcel.vue";
import displayLayout from "../Layouts/DisplayLayout.vue";
import ChartMr from "../components/charts/ChartMr.vue";
import AddData from "../components/inputs/AddData.vue";
import ChartX from "../components/charts/ChartX.vue";
import userHelper from "../utils/userHelper.util";
import { mapActions } from "vuex";

export default {
  name: "Home",
  components: {
    ChartHistogram,
    displayLayout,
    DataExcel,
    ChartMr,
    AddData,
    ChartX
  },

  data() {
    return {
      showAddDialog: false
    };
  },

  created() {
    const userObj = userHelper.getUserObj();
    if (!userObj) {
      this.$router.push("/login");
    } else this.init();
  },

  methods: {
    ...mapActions(["init"])
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
</style>
