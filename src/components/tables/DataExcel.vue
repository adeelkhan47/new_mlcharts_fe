<template>
  <div class="data-table" :class="{ loading }">
    <div :id="excelId" />
    <add-data :visibility="showEdit" @hide="closed" :item="selectedItem" />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import AddData from "../inputs/AddData.vue";
import "jexcel/dist/jexcel.css";
import jexcel from "jexcel";

export default {
  name: "DataExcel",

  components: {
    AddData,
    jexcel
  },

  props: ["saveBtn"],

  data() {
    return {
      chartId: "",
      password: "",
      mounted: false,
      excelId: "data-excel-spreadsheet",
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
          { type: "text", title: "Reference 2", width: "150px" },
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
          }
        ],
        tableOverflow: true,
        tableHeight: "795px",
        onpaste: this.handleChange,
        ondeleterow: this.handleChange,
        oneditionend: this.handleChange
      }
    };
  },

  computed: {
    ...mapState("xmrChartDataModule", ["dataList", "mr", "loading"])
  },

  watch: {
    dataList() {
      this.records = this.dataList.map((obj) => {
        return {
          id: obj.id,
          label: obj.label,
          reference: obj.reference,
          value: obj.value,
          mr: this.mr.get(obj.id)
        };
      });

      this.options.data = JSON.parse(JSON.stringify(this.records));

      // hiding first mr
      if (this.records.length > 0) this.options.data[0].mr = "";

      let blankRows = 32;
      if (this.records.length > 31) blankRows = 5;
      else blankRows = blankRows - this.records.length;

      // adding blank rows
      for (let i = 0; i < blankRows; i++) {
        this.options.data.push({
          id: "",
          label: "",
          reference: "",
          value: "",
          mr: ""
        });
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
      "removeDataItems"
    ]),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    setPageData() {
      const urlParams = new URLSearchParams(window.location.search);
      let pathname = window.location.pathname;
      pathname = pathname.split("/");

      this.chartId = pathname[pathname.length - 1] || "";
      this.password = urlParams.get("password") || "";
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
          updatedRecords: dataObjectList
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
          reference: obj.reference
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
              oldData.reference != currObj.reference)
          );
        })
        .map((obj) => ({
          id: obj.id,
          label: obj.label,
          value: this.getParsedValue(obj.value),
          reference: obj.reference
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
          reference: obj.reference
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
    }
  }
};
</script>

<style scoped>
.data-table {
  min-width: 500px;
  min-height: 795px;
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
