<template>
  <div class="wrapper">
    <md-dialog :md-active="visibility">
      <md-dialog-title> Input a +ve number value </md-dialog-title>

      <div class="input-container" v-if="item">
        <md-field :class="messageClass">
          <label>Data Value</label>
          <md-input v-model="defaultVal" required @input="validate"></md-input>
          <span class="md-error"> {{ error }} </span>
        </md-field>
      </div>

      <div class="input-container" v-else>
        <md-field :class="messageClass">
          <label>Data Value</label>
          <md-input
            v-model="defaultVal"
            required
            @input="validateValues"
          ></md-input>
          <span class="md-error"> {{ error }} </span>
        </md-field>
      </div>

      <md-dialog-actions>
        <md-button class="md-primary" @click="hide"> Close </md-button>
        <md-button
          class="md-primary"
          @click="addValue"
          :disabled="error != null || num == null"
        >
          {{ item ? "Update Value" : "Add value" }}
        </md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  name: "AddData",
  props: {
    visibility: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      delimiter: ",",
      defaultVal: "",
      num: null,
      error: null,
      chartId: ""
    };
  },

  computed: {
    ...mapState("dashboardChartModule", ["password"]),

    messageClass() {
      return {
        "md-invalid": this.error
      };
    }
  },

  watch: {
    item() {
      if (this.item) {
        this.defaultVal = this.item.value;
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
    ...mapActions("xmrChartDataModule", ["addDataItem", "updateDataItem"]),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    setPageData() {
      let pathname = window.location.pathname;
      pathname = pathname.split("/");

      this.chartId = pathname[pathname.length - 1] || "";
    },

    hide() {
      this.num = null;
      this.error = null;
      this.defaultVal = "";
      this.$emit("hide");
    },

    validate(val) {
      if (val && typeof val == "string" && !isNaN(val)) {
        this.error = null;
        this.num = Number.parseFloat(val);
      } else {
        this.error = "invalid number";
        this.num = null;
      }
    },

    validateValues(val) {
      if (val && typeof val == "string" && val.length) {
        val = val.replaceAll(" ", this.delimiter);
        this.error = null;

        this.num = [];
        const numbers = val.split(this.delimiter);
        numbers.forEach((v) => {
          if (v && typeof v == "string" && !isNaN(v.trim()))
            this.num.push(Number.parseFloat(v.trim()));
        });
      } else {
        this.error = "invalid number";
        this.num = null;
      }
    },

    handleResponse(response) {
      if (response && response.message) {
        this.setMessage(response.message);
        this.setShow(true);
      }
    },

    addValue() {
      if (this.num != null && this.error == null) {
        if (this.item)
          this.updateDataItem({
            chartId: this.chartId,
            password: this.password,
            id: this.item.id,
            label: this.item.label,
            value: this.num,
            reference: this.item.reference,
            note: this.item.note
          });
        else
          this.addDataItem({
            numberList: this.num,
            chartId: this.chartId,
            password: this.password,
            cb: this.handleResponse
          });

        this.num = null;
        this.error = null;
        this.defaultVal = "";
        this.hide();
      }
    }
  }
};
</script>

<style scoped>
.input-container {
  padding: 10px 30px;
}
</style>
