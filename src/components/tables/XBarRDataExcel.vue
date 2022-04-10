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

const irrelevantKeys = [
  "id",
  "reference1",
  "reference2",
  "average",
  "range",
  "values"
];

export default {
  name: "XBarRDataExcel",

  components: {
    jexcel
  },

  props: ["saveBtn", "subgroupSize"],

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
        includeHeadersOnDownload: true,
        allowInsertRow: true,
        columnSorting: false,
        columnResize: false,
        allowToolbar: true,
        rowDrag: false,
        columns: [
          { type: "text", title: "ID", width: "0px", readOnly: true },
          { type: "text", title: "Reference 1", width: "150px" },
          { type: "text", title: "Reference 2", width: "150px" }
        ],
        tableOverflow: true,
        tableHeight: "585px",
        tableWidth: "755px",
        onpaste: this.handleChange,
        ondeleterow: this.handleChange,
        oneditionend: this.handleChange
      }
    };
  },

  computed: {
    ...mapState("xBarRChartDataModule", ["dataList", "loading"]),

    ...mapState("dashboardChartModule", ["password"])
  },

  watch: {
    dataList() {
      if (!(this.dataList && this.dataList instanceof Array)) return;

      this.records = this.dataList.map((obj) => {
        return this.getExcelRecord(obj);
      });

      this.options.data = JSON.parse(JSON.stringify(this.records));

      let blankRows = 23;
      if (this.records.length > 22) blankRows = 5;
      else blankRows = blankRows - this.records.length;

      // adding blank rows
      for (let i = 0; i < blankRows; i++) {
        this.options.data.push(this.getExcelRecord());
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
    ...mapActions("xBarRChartDataModule", [
      "addDataItems",
      "updateDataItems",
      "removeDataItems"
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
            changedKey)
        );
      });

      return this.getFormattedData(updatedRecords);
    },

    getNewRecords(currentData) {
      const oldIds = this.records.map((obj) => obj.id);
      const newRecords = currentData.filter((currObj) => {
        const addition = Object.values(currObj).filter(
          (val) => val || typeof value === "number"
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
            values: values
          });
        });
      }
      return formatted;
    },

    getExcelColumns() {
      let columns = [
        { type: "text", title: "Row ID", width: "0px", readOnly: true },
        { type: "text", title: "Reference 1", width: "150px" },
        { type: "text", title: "Reference 2", width: "150px" }
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

      columns.push({
        type: "text",
        title: "Average",
        width: "100px",
        readOnly: true
      });

      columns.push({
        type: "text",
        title: "Range",
        width: "100px",
        readOnly: true
      });

      return columns;
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

      if (dataExists) {
        record = {
          id: dataObj.id,
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
      } else {
        record = {
          id: "",
          reference1: "",
          reference2: ""
        };
      }

      for (let i = 1; i <= this.subgroupSize; i++) {
        const key = "x" + i;
        const value = values.hasOwnProperty(key) ? values[key] : "";
        record[key] = value;
      }

      record.average =
        typeof average === "string" ? average : util.formatNumber(average);
      record.range =
        typeof range === "string" ? range : util.formatNumber(range);

      return record;
    }
  }
};
</script>

<style scoped>
.data-table {
  min-width: 500px;
  min-height: 795px;
  min-height: 585px;
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
