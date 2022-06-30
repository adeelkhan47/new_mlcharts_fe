const API_BASE_URL = "http://localhost:8090";
const XMR_CHART_DATA_PATH = "/xmr-data";
const X_BAR_R_CHART_PATH = "/x-bar-r";
const DASHBOARD_CHART_PATH = "/dashboard-charts";
const USER_PATH = "/users";
const FIXED_POINTS = 3;

const X_VALUE_CONSTANT = 1.128;
const MR_VALUE_CONSTANT = 3.268;
const DEFAULT_LOCK_LIMIT_FOR_SUBGROUPED_CHART = 9;
const DEFAULT_LOCK_LIMIT_FOR_INDIVIDUALS_CHART = 19;

const CONST_BY_SUBGROUP_SIZE = {
  2: { a2: 1.88, d2: 1.128, d3: 0, d4: 3.267 },
  3: { a2: 1.023, d2: 1.693, d3: 0, d4: 2.574 },
  4: { a2: 0.729, d2: 2.059, d3: 0, d4: 2.282 },
  5: { a2: 0.577, d2: 2.326, d3: 0, d4: 2.114 },
  6: { a2: 0.483, d2: 2.534, d3: 0, d4: 2.004 },
  7: { a2: 0.419, d2: 2.704, d3: 0.076, d4: 1.924 },
  8: { a2: 0.373, d2: 2.847, d3: 0.136, d4: 1.864 },
  9: { a2: 0.337, d2: 2.97, d3: 0.184, d4: 1.816 },
  10: { a2: 0.308, d2: 3.078, d3: 0.223, d4: 1.777 }
};

const constants = Object.freeze({
  API_BASE_URL,
  XMR_CHART_DATA_PATH,
  X_BAR_R_CHART_PATH,
  DASHBOARD_CHART_PATH,
  USER_PATH,
  CONST_BY_SUBGROUP_SIZE,
  FIXED_POINTS,
  X_VALUE_CONSTANT,
  MR_VALUE_CONSTANT,
  DEFAULT_LOCK_LIMIT_FOR_SUBGROUPED_CHART,
  DEFAULT_LOCK_LIMIT_FOR_INDIVIDUALS_CHART
});

export default constants;
