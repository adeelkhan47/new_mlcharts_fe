import axios from "axios";

import dashboardChartApi from "./dashboardChart.api";
import userApi from "./user.api";
import xmrChartDataApi from "./xmrChartData.api";

function setDefaultHeader(key, value) {
  axios.defaults.headers[key] = value;
}

export { setDefaultHeader, dashboardChartApi, userApi, xmrChartDataApi };
