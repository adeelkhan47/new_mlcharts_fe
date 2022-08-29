<template>
  <div class="data-table" :class="{ loading }">
    <div :id="excelId" />
    <!-- <add-data :visibility="showEdit" @hide="closed" :item="selectedItem" />  // FOR=>add-data -->
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import constants from "../../utils/constants.util";
// import AddData from "../inputs/AddData.vue"; // FOR=>add-data
import "jexcel/dist/jexcel.css";
import jexcel from "jexcel";
import util from "../../utils";

export default {
  name: "XmrDataExcel",

  components: {
    // AddData  // FOR=>add-data
  },

  props: ["saveBtn", "headings"],

  data() {
    return {
      valueMapping: null,
      newRowAdded: false,
      chartId: "",
      mounted: false,
      excelId: "data-excel-spreadsheet",
      // showEdit: false, // FOR=>add-data
      // selectedItem: null, // FOR=>add-data
      spreadsheet: null,
      records: [],
      downloadableColsIndexes: [2, 3, 4, 6],

      options: {
        csvFileName: "SPC Charts Data (Individuals)",
        includeHeadersOnDownload: true,
        allowInsertRow: true,
        columnSorting: false,
        columnResize: false,
        allowToolbar: true,
        rowDrag: false,
        data: [],
        columns: [],
        tableOverflow: true,
        tableWidth: "755px",
        tableHeight: "980px",
        oninsertrow: this.onInsertRow,
        onpaste: this.notifyToSaveData,
        ondeleterow: this.handleChange,
        oneditionend: this.afterEdition,
        onchange: this.onChange,
        oncreateeditor: this.handleZeroCellValue,
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
          value: obj.value,
          note: obj.note,
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
          averageCumulativeCPK: util.formatNumber(obj.averageCumulativeCPK),
          sampleStdDev: util.formatNumber(obj.sampleStdDev),
          cumulativePPL: util.formatNumber(obj.cumulativePPL),
          cumulativePPU: util.formatNumber(obj.cumulativePPU),
          cumulativePPK: util.formatNumber(obj.cumulativePPK),
          averageCumulativePPK: util.formatNumber(obj.averageCumulativePPK),
          cp: util.formatNumber(obj.cp),
          pp: util.formatNumber(obj.pp)
        };
      });

      this.options.data = JSON.parse(JSON.stringify(this.records));

      let blankRows = 40;
      if (this.records.length > 33) blankRows = 5;
      else blankRows = blankRows - this.records.length;

      // adding blank rows
      for (let i = 0; i < blankRows; i++) {
        this.options.data.push({
          id: "",
          lockLimit: false,
          label: "",
          reference: "",
          value: "",
          note: "",
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
          averageCumulativeCPK: "",
          sampleStdDev: "",
          cumulativePPL: "",
          cumulativePPU: "",
          cumulativePPK: "",
          averageCumulativePPK: "",
          cp: "",
          pp: ""
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

      // setting data
      if (this.spreadsheet) {
        const finalData = JSON.parse(JSON.stringify(this.options.data));
        this.spreadsheet.setData(finalData);
      }
    },

    headings() {
      if (this.headings && Object.keys(this.headings).length) {
        this.init();
      }
    }
  },

  created() {
    this.setPageData();
  },

  mounted() {
    this.setPageData();
    this.init();
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
      const el = document.getElementById(this.excelId);
      if (el) {
        el.innerHTML = "";
        this.spreadsheet = null;
        this.options.columns = this.getExcelColumns();
        this.spreadsheet = jexcel(el, this.options);
      }
    },

    // edit(item) { // FOR=>add-data
    //   this.selectedItem = JSON.parse(JSON.stringify(item));
    //   this.showEdit = true;
    // },

    onInsertRow() {
      this.newRowAdded = true;
    },

    handleChange() {
      let currentData = this.spreadsheet.getJson();
      if (!(currentData && currentData.length)) return;

      const hasNewRow = this.newRowAdded;
      this.newRowAdded = false;

      currentData = currentData
        .filter((obj) => {
          return (
            obj.value !== "" ||
            obj.label !== "" ||
            obj.reference !== "" ||
            obj.note !== ""
          );
        })
        .map((obj) => {
          if (obj.value && typeof obj.value === "string")
            obj.value = Number.parseFloat(obj.value.replaceAll(",", ""));
          return obj;
        });

      if (hasNewRow) {
        const newRowIndex = currentData.findIndex((obj) => obj.id === "");
        // found index & its not the last index
        if (newRowIndex !== -1 && newRowIndex !== currentData.length - 1) {
          let secArr = currentData.slice(newRowIndex, currentData.length);
          const dataObjList = secArr.filter((obj) => obj.id);
          secArr = secArr.map((obj, index) => {
            if (index < dataObjList.length) obj.id = dataObjList[index].id;
            else obj.id = "";
            return obj;
          });
          currentData = [].concat(currentData.slice(0, newRowIndex), secArr);
        }
      }

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
        .filter(
          (currObj) =>
            (currObj.value ||
              typeof currObj.value === "number" ||
              currObj.label ||
              currObj.reference ||
              currObj.note) &&
            !oldIds.includes(currObj.id)
        )
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

    // closed() { // FOR=>add-data
    //   this.showEdit = false;
    //   this.selectedItem = null;
    // },

    onChange(container, dataRow, colIndex, rowIndex, currentVal, prevVal) {
      // id = 0, lockLimit = 1
      if (colIndex === "1" && currentVal !== prevVal) {
        this.setLockedRowIndex({
          value: currentVal ? Number.parseInt(rowIndex) : "NONE",
          chartId: this.chartId
        });
      } else if (currentVal === "") this.handleChange();
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
    },

    getExcelColumns() {
      const headings = this.headings || {};
      return [
        {
          name: "id", // data key
          type: "text",
          title: "ID",
          width: "0px",
          readOnly: true
        },
        {
          name: "lockLimit",
          type: "radio",
          title: "Lock Limits",
          width: "100px"
        },
        {
          name: "label",
          type: "text",
          title: headings.col2
            ? headings.col2.endsWith("(Appears on chart)")
              ? headings.col2
              : headings.col2 + " (Appears on chart)"
            : "Reference 1 (Appears on chart)",
          width: "220px"
        },
        {
          name: "reference",
          type: "text",
          title: headings.col3 || "Reference 2",
          width: "150px"
        },
        {
          name: "value",
          type: "text",
          title: "Value",
          width: "100px",
          mask: "#,##",
          decimal: ".",
          options: { reverse: true }
        },
        {
          name: "note",
          type: "text",
          title: "Notes",
          width: "100px"
        },
        {
          name: "movingRange",
          type: "text",
          title: "Moving Range",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativeAverage",
          type: "text",
          title: "Cumul. Avg",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativeAverageMR",
          type: "text",
          title: "Cumul. Avg mR",
          width: "110px",
          readOnly: true
        },
        {
          name: "cumulativeStdDev",
          type: "text",
          title: "Cumul. Est SD",
          width: "100px",
          readOnly: true
        },
        {
          name: "xUCL",
          type: "text",
          title: "x UCL",
          width: "100px",
          readOnly: true
        },
        {
          name: "xCL",
          type: "text",
          title: "x CL",
          width: "100px",
          readOnly: true
        },
        {
          name: "xLCL",
          type: "text",
          title: "x LCL",
          width: "100px",
          readOnly: true
        },
        {
          name: "mrUCL",
          type: "text",
          title: "mR UCL",
          width: "100px",
          readOnly: true
        },
        {
          name: "mrCL",
          type: "text",
          title: "mR CL",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativeCPL",
          type: "text",
          title: "CPL",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativeCPU",
          type: "text",
          title: "CPU",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativeCPK",
          type: "text",
          title: "CPK",
          width: "100px",
          readOnly: true
        },
        {
          name: "averageCumulativeCPK",
          type: "text",
          title: "Avg CPK (overall)",
          width: "120px",
          readOnly: true
        },
        {
          name: "sampleStdDev",
          type: "text",
          title: "Sample Std Dev",
          width: "120px",
          readOnly: true
        },
        {
          name: "cumulativePPL",
          type: "text",
          title: "Ppl",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativePPU",
          type: "text",
          title: "Ppu",
          width: "100px",
          readOnly: true
        },
        {
          name: "cumulativePPK",
          type: "text",
          title: "Ppk",
          width: "100px",
          readOnly: true
        },
        {
          name: "averageCumulativePPK",
          type: "text",
          title: "Avg Ppk (overall)",
          width: "120px",
          readOnly: true
        },
        {
          name: "cp",
          type: "text",
          title: "Cp",
          width: "100px",
          readOnly: true
        },
        {
          name: "pp",
          type: "text",
          title: "Pp",
          width: "100px",
          readOnly: true
        }
      ];
    },

    notifyToSaveData() {
      this.$emit("onDataChanged");
    },

    undo() {
      if (this.spreadsheet && this.spreadsheet.undo) this.spreadsheet.undo();
    },

    redo() {
      if (this.spreadsheet && this.spreadsheet.redo) this.spreadsheet.redo();
    },

    handleZeroCellValue(_, __, col, row, input) {
      const oldValue = this.spreadsheet.getValueFromCoords(col, row);
      if (oldValue === 0) {
        const self = this;
        input.addEventListener("change", (e) => {
          self.valueMapping = {
            oldValue,
            newValue: e.target.value,
            col,
            row
          };
        });
      }
    },

    afterEdition() {
      if (
        this.spreadsheet &&
        this.valueMapping &&
        this.valueMapping.newValue === ""
      ) {
        this.spreadsheet.setValueFromCoords(
          this.valueMapping.col,
          this.valueMapping.row,
          "",
          false
        );
      }
      this.valueMapping = null;
      this.notifyToSaveData();
    }
  }
};
</script>

<style scoped>
.data-table {
  min-width: 500px;
  min-height: 980px;
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
