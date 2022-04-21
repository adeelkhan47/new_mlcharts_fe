import constants from "./constants.util";

function isNumber(num) {
  return !!(
    (num || num === 0) &&
    typeof num == "number" &&
    Number.isFinite(num)
  );
}

function isString(val) {
  return !!(val && typeof val == "string" && val.trim().length);
}

function getMR(val1, val2) {
  let mr = 0;
  if (isNumber(val1) && isNumber(val2)) {
    if (val1 > val2) mr = val1 - val2;
    else mr = val2 - val1;
  }
  return mr;
}

function getMrMap(dataList) {
  let temp = new Map();
  let prev = null;
  dataList.forEach((obj) => {
    if (prev != null) temp.set(obj.id, getMR(prev, obj.value));
    else temp.set(obj.id, 0);

    prev = obj.value;
  });
  return temp;
}

function getID() {
  const u1 = String.fromCharCode(Math.ceil(Math.random() * 25) + 65);
  const u2 = String.fromCharCode(Math.ceil(Math.random() * 25) + 65);
  const l1 = String.fromCharCode(Math.ceil(Math.random() * 25) + 97);
  const l2 = String.fromCharCode(Math.ceil(Math.random() * 25) + 97);
  const n1 = Math.ceil(Math.random() * 9);
  const n2 = Math.ceil(Math.random() * 9);

  return u1 + n1 + l1 + u2 + n2 + l2;
}

function getRangeForXBarR(valuesObj) {
  let range = 0;
  if (
    valuesObj &&
    typeof valuesObj === "object" &&
    Object.keys(valuesObj).length
  ) {
    const values = Object.values(valuesObj);
    range = Math.max(...values) - Math.min(...values);
  }
  return range;
}

function getAverageForXBarR(valuesObj) {
  let average = 0;
  if (
    valuesObj &&
    typeof valuesObj === "object" &&
    Object.keys(valuesObj).length
  ) {
    const values = Object.values(valuesObj);
    average = calculateAverage(values);
  }
  return average;
}

function getStdDevForXBarR(averageRange, subgroupSize) {
  return averageRange / constants.CONST_BY_SUBGROUP_SIZE[subgroupSize].d2;
}

function getXBarDataForXBarR(grandAverage, averageRange, subgroupSize) {
  const ucl =
    grandAverage +
    constants.CONST_BY_SUBGROUP_SIZE[subgroupSize].a2 * averageRange;
  const cl = grandAverage;
  const lcl =
    grandAverage -
    constants.CONST_BY_SUBGROUP_SIZE[subgroupSize].a2 * averageRange;

  return {
    ucl,
    cl,
    lcl
  };
}

function getRangeDataForXBarR(averageRange, subgroupSize) {
  const ucl = constants.CONST_BY_SUBGROUP_SIZE[subgroupSize].d4 * averageRange;
  const cl = averageRange;
  const lcl = constants.CONST_BY_SUBGROUP_SIZE[subgroupSize].d3 * averageRange;

  return {
    ucl,
    cl,
    lcl
  };
}

function calculateAverage(list) {
  if (!(list instanceof Array && list.length)) return 0;

  list = list.filter((val) => !isNaN(val)).map((val) => Number.parseFloat(val));
  const totalSum = list.reduce((sum, val) => {
    sum += val;
    return sum;
  }, 0);
  return totalSum / list.length;
}

function formatNumber(num) {
  if ((num || num === 0) && !isNaN(num)) {
    num = Number.parseFloat(num).toFixed(constants.FIXED_POINTS);
    num = Number.parseFloat(num);
  }
  return num;
}

function convertVal(num) {
  let val = "";
  if ((num || num === 0) && num !== Infinity && num !== NaN) {
    if (typeof num === "string" && !isNaN(num)) {
      val = Number.parseFloat(num);
    } else if (typeof num === "number") val = num;
  }
  return val;
}

const util = {
  isNumber,
  isString,
  calculateAverage,
  getMR,
  getID,
  getMrMap,
  getRangeForXBarR,
  getAverageForXBarR,
  getStdDevForXBarR,
  getXBarDataForXBarR,
  getRangeDataForXBarR,
  formatNumber,
  convertVal
};

export default util;
