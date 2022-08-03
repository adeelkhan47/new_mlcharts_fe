<template>
  <div class="data-table" :class="{ loading }">
    <div :id="excelId" />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import "jexcel/dist/jexcel.css";
import jexcel from "jexcel";
import util from "../../utils";
import constants from "../../utils/constants.util";

const irrelevantKeys = [
  "id",
  "reference1",
  "reference2",
  "note",
  "average",
  "range",
  "values",
  "lockLimit",
  "cumulativeAverageRange",
  "cumulativeGrandAverage",
  "cumulativeStdDev",
  "averageUCL",
  "averageCL",
  "averageLCL",
  "rangeUCL",
  "rangeCL",
  "rangeLCL",
  "cumulativeCPL",
  "cumulativeCPU",
  "cumulativeCPK",
  "averageCPK"
];

export default {
  name: "XBarRDataExcel",

  components: {
    jexcel
  },

  props: ["saveBtn", "subgroupSize", "headings"],

  data() {
    return {
      chartId: "",
      mounted: false,
      excelId: "x-bar-r-data-excel-spreadsheet",
      showEdit: false,
      selectedItem: null,
      spreadsheet: null,
      records: [],

      options: {
        csvFileName: "SPC Charts Data (Subgrouped)",
        includeHeadersOnDownload: true,
        allowInsertRow: true,
        columnSorting: false,
        columnResize: false,
        allowToolbar: true,
        rowDrag: false,
        columns: [
          { type: "text", title: "ID", width: "0px", readOnly: true },
          {
            type: "text",
            title: "Reference 1 (Appears on chart)",
            width: "220px"
          },
          { type: "text", title: "Reference 2", width: "150px" }
        ],
        tableOverflow: true,
        tableWidth: "755px",
        tableHeight: "830px",
        onpaste: this.handleChange,
        ondeleterow: this.handleChange,
        oneditionend: this.handleChange,
        onchange: this.handleLockLimit,
        contextMenu: function (obj, x, y, e) {
          var items = [];

          if (y == null) {
          } else {
            // Insert new row
            if (obj.options.allowInsertRow == true) {
              items.push({
                title: obj.options.text.insertANewRowBefore,
                onclick: function () {
                  obj.insertRow(1, parseInt(y), 1);
                }
              });

              items.push({
                title: obj.options.text.insertANewRowAfter,
                onclick: function () {
                  obj.insertRow(1, parseInt(y));
                }
              });
            }

            // Delete rows
            if (obj.options.allowDeleteRow == true) {
              items.push({
                title: obj.options.text.deleteSelectedRows,
                onclick: function () {
                  obj.deleteRow(
                    obj.getSelectedRows().length ? undefined : parseInt(y)
                  );
                }
              });
            }

            if (x) {
              if (obj.options.allowComments == true) {
                items.push({ type: "line" });

                var title = obj.records[y][x].getAttribute("title") || "";

                items.push({
                  title: title
                    ? obj.options.text.editComments
                    : obj.options.text.addComments,
                  onclick: function () {
                    obj.setComments(
                      [x, y],
                      prompt(obj.options.text.comments, title)
                    );
                  }
                });

                if (title) {
                  items.push({
                    title: obj.options.text.clearComments,
                    onclick: function () {
                      obj.setComments([x, y], "");
                    }
                  });
                }
              }
            }
          }

          // Line
          items.push({ type: "line" });

          // Copy
          items.push({
            title: obj.options.text.copy,
            shortcut: "Ctrl + C",
            onclick: function () {
              obj.copy(true);
            }
          });

          // Paste
          if (navigator && navigator.clipboard) {
            items.push({
              title: obj.options.text.paste,
              shortcut: "Ctrl + V",
              onclick: function () {
                if (obj.selectedCell) {
                  navigator.clipboard.readText().then(function (text) {
                    if (text) {
                      jexcel.current.paste(
                        obj.selectedCell[0],
                        obj.selectedCell[1],
                        text
                      );
                    }
                  });
                }
              }
            });
          }

          // Save
          if (obj.options.allowExport) {
            items.push({
              title: obj.options.text.saveAs,
              shortcut: "Ctrl + S",
              onclick: function () {
                obj.download();
              }
            });
          }

          return items;
        }
      }
    };
  },

  computed: {
    ...mapState("xBarRChartDataModule", [
      "dataList",
      "loading",
      "lockedRowIndex"
    ]),

    ...mapState("dashboardChartModule", ["password"])
  },

  watch: {
    dataList() {
      if (!(this.dataList && this.dataList instanceof Array)) return;

      this.records = this.dataList.map((obj) => {
        return this.getExcelRecord(obj);
      });

      this.options.data = JSON.parse(JSON.stringify(this.records));

      let blankRows = 29;
      if (this.records.length > 22) blankRows = 5;
      else blankRows = blankRows - this.records.length;

      // adding blank rows
      for (let i = 0; i < blankRows; i++) {
        this.options.data.push(this.getExcelRecord());
      }

      if (
        typeof this.lockedRowIndex === "number" &&
        this.lockedRowIndex <= this.options.data.length
      ) {
        this.options.data[this.lockedRowIndex].lockLimit = true;
      } else {
        this.options.data[
          constants.DEFAULT_LOCK_LIMIT_FOR_SUBGROUPED_CHART
        ].lockLimit = true;
      }

      this.init();
    },

    headings() {
      if (this.headings && Object.keys(this.headings).length) {
        this.options.columns = this.getExcelColumns();
        this.options = JSON.parse(JSON.stringify(this.options));
        this.init();
      }
    }
  },

  created() {
    this.setPageData();
  },

  mounted() {
    this.setPageData();
  },

  methods: {
    ...mapActions("xBarRChartDataModule", [
      "addDataItems",
      "updateDataItems",
      "removeDataItems",
      "setLockedRowIndex"
    ]),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    setPageData() {
      let pathname = window.location.pathname;
      pathname = pathname.split("/");

      this.chartId = pathname[pathname.length - 1] || "";
      this.options.columns = this.getExcelColumns();
      this.options = { ...this.options };
    },

    init() {
      const el = document.getElementById(this.excelId);
      if (el) {
        if (this.spreadsheet && this.spreadsheet.destroy)
          this.spreadsheet.destroy();
        el.innerHTML = "";
        this.spreadsheet = null;
        this.spreadsheet = jexcel(el, this.options);
      }
    },

    edit(item) {
      this.selectedItem = JSON.parse(JSON.stringify(item));
      this.showEdit = true;
    },

    handleChange() {
      const currentData = this.spreadsheet.getJson();
      const deletedRecords = this.getDeletedRecords(currentData);
      const updatedRecords = this.getUpdatedRecords(currentData);
      const newRecords = this.getNewRecords(currentData);

      if (deletedRecords && deletedRecords.length) {
        const deletedRecordIds = deletedRecords
          .map((obj) => obj.id)
          .filter((val) => val);
        this.removeDataItems({
          chartId: this.chartId,
          password: this.password,
          rowIds: deletedRecordIds
        });
      }

      if (updatedRecords && updatedRecords.length) {
        this.updateDataItems({
          chartId: this.chartId,
          password: this.password,
          records: updatedRecords
        });
      }

      if (newRecords && newRecords.length) {
        this.addDataItems({
          records: newRecords,
          chartId: this.chartId,
          password: this.password,
          cb: this.handleResponse
        });
      }
    },

    handleLockLimit(
      container,
      dataRow,
      colIndex,
      rowIndex,
      currentVal,
      prevVal
    ) {
      // id = 0, lockLimit = 1
      if (colIndex === "1" && currentVal !== prevVal) {
        this.setLockedRowIndex({
          value: currentVal ? Number.parseInt(rowIndex) : "NONE",
          chartId: this.chartId
        });
      }
    },

    handleResponse(response) {
      if (response && response.message) {
        this.setMessage(response.message);
        this.setShow(true);
      }
    },

    getDeletedRecords(currentData) {
      const currentIds = currentData.map((obj) => obj.id);
      const deletedRecords = this.records.filter(
        (obj) => !currentIds.includes(obj.id)
      );

      return this.getFormattedData(deletedRecords);
    },

    getUpdatedRecords(currentData) {
      const updatedRecords = currentData.filter((currObj) => {
        const oldData = this.records.find((oldObj) => oldObj.id === currObj.id);
        const oldDataKeys = this.getDataKeys(oldData);
        const currDataKeys = this.getDataKeys(currObj);
        const changedKey = currDataKeys.find((key) => {
          if (!oldData) return false;
          return currObj[key] !== oldData[key];
        });

        return !!(
          oldData &&
          (oldDataKeys.length !== currDataKeys.length ||
            oldData.reference1 != currObj.reference1 ||
            oldData.reference2 != currObj.reference2 ||
            oldData.note != currObj.note ||
            changedKey)
        );
      });

      return this.getFormattedData(updatedRecords);
    },

    getNewRecords(currentData) {
      const oldIds = this.records.map((obj) => obj.id);
      const newRecords = currentData.filter((currObj) => {
        const addition = Object.values(currObj).filter(
          (val) => (val || typeof val === "number") && typeof val !== "boolean"
        );
        return addition.length && !oldIds.includes(currObj.id);
      });

      return this.getFormattedData(newRecords);
    },

    getParsedValue(val) {
      if (typeof val === "string") val = Number.parseFloat(val);
      return val;
    },

    closed() {
      this.showEdit = false;
      this.selectedItem = null;
    },

    getDataKeys(obj) {
      let dataKeys = [];
      if (obj && typeof obj === "object" && Object.keys(obj).length) {
        dataKeys = Object.keys(obj);
        dataKeys = dataKeys.filter((key) => !irrelevantKeys.includes(key));
      }
      return dataKeys;
    },

    getFormattedData(list) {
      let formatted = [];
      if (list instanceof Array && list.length) {
        list.forEach((obj) => {
          let values = {};
          const dataKeys = this.getDataKeys(obj);
          if (dataKeys.length) {
            dataKeys.forEach((keyName) => {
              let val = obj[keyName];
              if (typeof val === "number") {
                values[keyName] = val;
              } else if (val && !isNaN(val)) {
                values[keyName] = Number.parseFloat(val);
              }
            });
          }

          formatted.push({
            id: obj.id,
            reference1: obj.reference1,
            reference2: obj.reference2,
            note: obj.note,
            values: values
          });
        });
      }
      return formatted;
    },

    getExcelColumns() {
      const headings = this.headings || {};
      let columns = [
        { type: "text", title: "Row ID", width: "0px", readOnly: true },
        {
          type: "radio",
          title: "Lock Limits",
          width: "100px"
        },
        {
          type: "text",
          title: headings.col2
            ? headings.col2.endsWith("(Appears on chart)")
              ? headings.col2
              : headings.col2 + " (Appears on chart)"
            : "Reference 1 (Appears on chart)",
          width: "220px"
        },
        { type: "text", title: headings.col3 || "Reference 2", width: "150px" }
      ];

      for (let i = 1; i <= this.subgroupSize; i++) {
        columns.push({
          type: "numeric",
          title: "x" + i,
          width: "100px",
          mask: "#,##.00",
          decimal: "."
        });
      }

      return columns.concat([
        {
          type: "text",
          title: "Notes",
          width: "100px"
        },
        {
          type: "text",
          title: "Average",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Range",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Cumul. Grand Avg",
          width: "125px",
          readOnly: true
        },
        {
          type: "text",
          title: "Cumul. Avg range",
          width: "125px",
          readOnly: true
        },
        {
          type: "text",
          title: "Cumul. Est SD",
          width: "110px",
          readOnly: true
        },
        {
          type: "text",
          title: "Avg UCL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Avg CL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Avg LCL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Rng UCL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Rng CL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Rng LCL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "CPL",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "CPU",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "CPK",
          width: "100px",
          readOnly: true
        },
        {
          type: "text",
          title: "Avg CPK",
          width: "100px",
          readOnly: true
        }
      ]);
    },

    getExcelRecord(dataObj = null) {
      const dataExists = !!(
        dataObj &&
        typeof dataObj === "object" &&
        Object.keys(dataObj).length
      );

      let record = {};
      let values = {};
      let average = "";
      let range = "";
      let append = {};

      if (dataExists) {
        record = {
          id: dataObj.id,
          lockLimit: false,
          reference1: dataObj.reference1,
          reference2: dataObj.reference2
        };

        average =
          dataObj.average || dataObj.average === 0 ? dataObj.average : "";
        range = dataObj.range || dataObj.range === 0 ? dataObj.range : "";

        if (
          dataObj.values &&
          typeof dataObj.values === "object" &&
          Object.keys(dataObj.values).length
        ) {
          values = dataObj.values;
        }

        append = {
          note: dataObj.note,
          average: util.formatNumber(average),
          range: util.formatNumber(range),
          cumulativeGrandAverage: util.formatNumber(
            dataObj.cumulativeGrandAverage
          ),
          cumulativeAverageRange: util.formatNumber(
            dataObj.cumulativeAverageRange
          ),
          cumulativeStdDev: util.formatNumber(dataObj.cumulativeStdDev),
          averageUCL: util.formatNumber(dataObj.averageUCL),
          averageCL: util.formatNumber(dataObj.averageCL),
          averageLCL: util.formatNumber(dataObj.averageLCL),
          rangeUCL: util.formatNumber(dataObj.rangeUCL),
          rangeCL: util.formatNumber(dataObj.rangeCL),
          rangeLCL: util.formatNumber(dataObj.rangeLCL),
          cumulativeCPL: util.formatNumber(dataObj.cumulativeCPL),
          cumulativeCPU: util.formatNumber(dataObj.cumulativeCPU),
          cumulativeCPK: util.formatNumber(dataObj.cumulativeCPK),
          averageCPK: util.formatNumber(dataObj.averageCPK)
        };
      } else {
        record = {
          id: "",
          lockLimit: false,
          reference1: "",
          reference2: ""
        };

        append = {
          note: "",
          average: "",
          range: "",
          cumulativeGrandAverage: "",
          cumulativeAverageRange: "",
          cumulativeStdDev: "",
          averageUCL: "",
          averageCL: "",
          averageLCL: "",
          rangeUCL: "",
          rangeCL: "",
          rangeLCL: "",
          cumulativeCPL: "",
          cumulativeCPU: "",
          cumulativeCPK: "",
          averageCPK: ""
        };
      }

      // adding data col values
      for (let i = 1; i <= this.subgroupSize; i++) {
        const key = "x" + i;
        const value = values.hasOwnProperty(key) ? values[key] : "";
        record[key] = value;
      }

      // adding other col values
      for (const col in append) {
        const val = append[col];
        record[col] = val;
      }

      return record;
    },

    downloadData() {
      if (this.spreadsheet && this.spreadsheet.download) {
        const downloadableColsIndexes = [2, 3];
        let i = 0;
        for (i = 0; i < this.subgroupSize; i++) {
          downloadableColsIndexes.push(i + 4);
        }
        downloadableColsIndexes.push(i + 5);
        downloadableColsIndexes.push(i + 6);

        const officialHeaders = this.spreadsheet.headers;
        const officialData = this.spreadsheet.options.data;

        this.spreadsheet.headers = this.spreadsheet.headers.filter((_, index) =>
          downloadableColsIndexes.includes(index)
        );

        this.spreadsheet.options.data = this.spreadsheet.options.data.map(
          (rowArr) => {
            return rowArr.filter((_, index) =>
              downloadableColsIndexes.includes(index)
            );
          }
        );

        this.spreadsheet.download();

        this.spreadsheet.headers = officialHeaders;
        this.spreadsheet.options.data = officialData;
      }
    }
  }
};
</script>

<style scoped>
.data-table {
  min-width: 550px;
  min-height: 795px;
  min-height: 725px;
  max-width: 755px;
  border-radius: 5px;
  background: #eee;
  position: relative;
  overflow: hidden;
}

.loading::after {
  content: "";
  position: absolute;
  top: 0px;
  width: 100%;
  height: 100%;
  background: rgba(238, 238, 238, 0.7);
  z-index: 1000;
  background-image: url("/loading.gif");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 150px;
  z-index: 999;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
}
</style>
