import Vue from "vue";
import Vuex from "vuex";

import responseMessageModule from "./modules/responseMessageModule";
import dashboardChartModule from "./modules/dashboardChartModule";
import xBarRChartDataModule from "./modules/xBarRChartDataModule";
import xmrChartDataModule from "./modules/xmrChartDataModule";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    responseMessageModule,
    dashboardChartModule,
    xBarRChartDataModule,
    xmrChartDataModule
  }
});
