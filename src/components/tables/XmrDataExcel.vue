<template>
  <div class="data-table" :class="{ loading }">
    <div :id="excelId" />
    <add-data :visibility="showEdit" @hide="closed" :item="selectedItem" />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import constants from "../../utils/constants.util";
import AddData from "../inputs/AddData.vue";
import "jexcel/dist/jexcel.css";
import jexcel from "jexcel";
import util from "../../utils";

export default {
  name: "XmrDataExcel",

  components: {
    AddData,
    jexcel
  },

  props: ["saveBtn"],

  data() {
    return {
      chartId: "",
      mounted: false,
      excelId: "data-excel-spreadsheet",
      showEdit: false,
      selectedItem: null,
      spreadsheet: null,
      records: [],
      downloadableColsIndexes: [2, 3, 5, 6],

      options: {
        csvFileName: "SPC Charts Data (Individuals)",
        includeHeadersOnDownload: true,
        allowInsertRow: true,
        columnSorting: false,
        columnResize: false,
        allowToolbar: true,
        rowDrag: false,
        columns: [
          { type: "text", title: "ID", width: "0px", readOnly: true },
          {
            type: "radio",
            title: "Lock Limit",
            width: "100px"
          },
          {
            type: "text",
            title: "Reference 1 (Appears on chart)",
            width: "220px"
          },
          { type: "text", title: "Reference 2", width: "150px" },
          {
            type: "text",
            title: "Notes",
            width: "100px"
          },
          {
            type: "numeric",
            title: "Value",
            width: "100px",
            mask: "#,##.00",
            decimal: "."
          },
          {
            type: "text",
            title: "Moving Range",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "Cumul. Avg",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "Cumul. Avg mR",
            width: "110px",
            readOnly: true
          },
          {
            type: "text",
            title: "Cumul. Est SD",
            width: "100px",
            readOnly: true
          },

          {
            type: "text",
            title: "x UCL",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "x CL",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "x LCL",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "mR UCL",
            width: "100px",
            readOnly: true
          },
          {
            type: "text",
            title: "mR CL",
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
            title: "Avg Cpk (overall)",
            width: "120px",
            readOnly: true
          }
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
    ...mapState("xmrChartDataModule", [
      "dataList",
      "loading",
      "lockedRowIndex"
    ]),

    ...mapState("dashboardChartModule", ["password"])
  },

  watch: {
    dataList() {
      this.records = this.dataList.map((obj) => {
        return {
          id: obj.id,
          lockLimit: false,
          label: obj.label,
          reference: obj.reference,
          note: obj.note,
          value: obj.value,
          movingRange: util.formatNumber(obj.movingRange),
          cumulativeAverage: util.formatNumber(obj.cumulativeAverage),
          cumulativeAverageMR: util.formatNumber(obj.cumulativeAverageMR),
          cumulativeStdDev: util.formatNumber(obj.cumulativeStdDev),
          xUCL: util.formatNumber(obj.xUCL),
          xCL: util.formatNumber(obj.xCL),
          xLCL: util.formatNumber(obj.xLCL),
          mrUCL: util.formatNumber(obj.mrUCL),
          mrCL: util.formatNumber(obj.mrCL),
          cumulativeCPL: util.formatNumber(obj.cumulativeCPL),
          cumulativeCPU: util.formatNumber(obj.cumulativeCPU),
          cumulativeCPK: util.formatNumber(obj.cumulativeCPK),
          averageCumulativeCPK: util.formatNumber(obj.averageCumulativeCPK)
        };
      });

      this.options.data = JSON.parse(JSON.stringify(this.records));

      let blankRows = 29;
      if (this.records.length > 22) blankRows = 5;
      else blankRows = blankRows - this.records.length;

      // adding blank rows
      for (let i = 0; i < blankRows; i++) {
        this.options.data.push({
          id: "",
          lockLimit: false,
          label: "",
          reference: "",
          note: "",
          value: "",
          movingRange: "",
          cumulativeAverage: "",
          cumulativeAverageMR: "",
          cumulativeStdDev: "",
          xUCL: "",
          xCL: "",
          xLCL: "",
          mrUCL: "",
          mrCL: "",
          cumulativeCPL: "",
          cumulativeCPU: "",
          cumulativeCPK: "",
          averageCumulativeCPK: ""
        });
      }

      if (
        typeof this.lockedRowIndex === "number" &&
        this.lockedRowIndex <= this.options.data.length
      ) {
        this.options.data[this.lockedRowIndex].lockLimit = true;
      } else {
        this.options.data[
          constants.DEFAULT_LOCK_LIMIT_FOR_INDIVIDUALS_CHART
        ].lockLimit = true;
      }

      this.init();
    }
  },

  created() {
    this.setPageData();
  },

  mounted() {
    this.setPageData();
  },

  methods: {
    ...mapActions("xmrChartDataModule", [
      "addDataItems",
      "updateDataItems",
      "removeDataItem",
      "removeDataItems",
      "setLockedRowIndex"
    ]),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    setPageData() {
      let pathname = window.location.pathname;
      pathname = pathname.split("/");

      this.chartId = pathname[pathname.length - 1] || "";
    },

    init() {
      let el = document.getElementById(this.excelId);
      if (el) {
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
        const deletedRecordIds = deletedRecords.map((obj) => obj.id);
        this.removeDataItems({
          chartId: this.chartId,
          password: this.password,
          dataIds: deletedRecordIds
        });
      }

      if (updatedRecords && updatedRecords.length) {
        this.updateDataItems({
          chartId: this.chartId,
          password: this.password,
          dataObjectList: updatedRecords
        });
      }

      if (newRecords && newRecords.length) {
        this.addDataItems({
          itemList: newRecords,
          chartId: this.chartId,
          password: this.password,
          cb: this.handleResponse
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
      const deletedRecords = this.records
        .filter((obj) => !currentIds.includes(obj.id))
        .map((obj) => ({
          id: obj.id,
          label: obj.label,
          value: obj.value,
          reference: obj.reference,
          note: obj.note
        }));

      return deletedRecords;
    },

    getUpdatedRecords(currentData) {
      const updatedRecords = currentData
        .filter((currObj) => {
          const oldData = this.records.find(
            (oldObj) => oldObj.id === currObj.id
          );
          return !!(
            oldData &&
            (oldData.label != currObj.label ||
              oldData.value != currObj.value ||
              oldData.reference != currObj.reference ||
              oldData.note != currObj.note)
          );
        })
        .map((obj) => ({
          id: obj.id,
          label: obj.label,
          value: this.getParsedValue(obj.value),
          reference: obj.reference,
          note: obj.note
        }));

      return updatedRecords;
    },

    getNewRecords(currentData) {
      const oldIds = this.records.map((obj) => obj.id);
      const newRecords = currentData
        .filter((currObj) => currObj.value && !oldIds.includes(currObj.id))
        .map((obj) => ({
          id: obj.id,
          label: obj.label,
          value: this.getParsedValue(obj.value),
          reference: obj.reference,
          note: obj.note
        }));

      return newRecords;
    },

    getParsedValue(val) {
      if (typeof val === "string") val = Number.parseFloat(val);
      return val;
    },

    closed() {
      this.showEdit = false;
      this.selectedItem = null;
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

    downloadData() {
      if (this.spreadsheet && this.spreadsheet.download) {
        const self = this;
        const officialHeaders = this.spreadsheet.headers;
        const officialData = this.spreadsheet.options.data;

        this.spreadsheet.headers = this.spreadsheet.headers.filter((_, index) =>
          self.downloadableColsIndexes.includes(index)
        );

        this.spreadsheet.options.data = this.spreadsheet.options.data.map(
          (rowArr) => {
            return rowArr.filter((_, index) =>
              self.downloadableColsIndexes.includes(index)
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
  min-width: 500px;
  min-height: 795px;
  min-height: 725px;
  border-radius: 5px;
  background: #eee;
  position: relative;
  overflow: hidden;
  max-width: 755px;
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
