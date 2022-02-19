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

function average(dataList) {
  let sum = 0;
  if (dataList && dataList instanceof Array) {
    dataList.forEach((val) => {
      sum += val;
    });
    return sum / dataList.length;
  } else return sum;
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

const util = {
  isNumber,
  isString,
  average,
  getMR,
  getID,
  getMrMap
};

export default util;
