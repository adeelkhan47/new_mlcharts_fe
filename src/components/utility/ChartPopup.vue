<template>
  <md-dialog :md-active="visibility">
    <div class="chart-popup">
      <form novalidate class="md-layout form" @submit.prevent="validateData">
        <md-card class="md-layout-item">
          <md-card-header>
            <div class="md-title">
              {{ isUpdate ? "Update " : "Create New " }} Chart
            </div>
          </md-card-header>

          <md-card-content>
            <div class="md-layout md-gutter">
              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('name')">
                  <label for="name">Chart Name</label>
                  <md-input
                    name="name"
                    id="name"
                    v-model="form.name"
                    :disabled="loading || isUpdate"
                  />
                  <span class="md-error" v-if="!$v.form.name.required">
                    Chart name is required
                  </span>
                </md-field>
              </div>

              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('chartType')">
                  <label for="chart-type">Chart Type</label>
                  <md-select
                    name="chart-type"
                    id="chart-type"
                    v-model="form.chartType"
                    md-dense
                    :disabled="loading || isUpdate"
                  >
                    <md-option value="x-mr">X-MR</md-option>
                    <md-option value="x-bar-s">X-bar-S</md-option>
                    <md-option value="x-bar-r">X-bar-R</md-option>
                  </md-select>
                  <span class="md-error"> Chart Type is required </span>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('subgroupSize')">
                  <label for="subgroup-size">Subgroup Size</label>
                  <md-input
                    type="number"
                    id="subgroup-size"
                    name="subgroup-size"
                    v-model="form.subgroupSize"
                    :disabled="loading"
                  />
                  <span class="md-error" v-if="!$v.form.subgroupSize.required">
                    Subgroup Size is required
                  </span>
                </md-field>
              </div>
              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('password')">
                  <label for="password">Password</label>
                  <md-input
                    id="password"
                    name="password"
                    v-model="form.password"
                    :disabled="loading"
                  />
                  <span class="md-error" v-if="!$v.form.password.required">
                    Password is required
                  </span>
                </md-field>
              </div>
            </div>

            <md-checkbox
              name="is-public"
              id="is-public"
              v-model="form.isPublic"
              class="md-primary"
              :disabled="loading"
            >
              Is Public ?
            </md-checkbox>
          </md-card-content>

          <md-progress-bar md-mode="indeterminate" v-if="loading" />

          <md-card-actions>
            <md-button :disabled="loading" @click="close"> Close </md-button>
            <md-button :disabled="loading" @click="clearForm">
              Reset
            </md-button>
            <md-button type="submit" class="md-primary" :disabled="loading">
              {{ isUpdate ? "Update " : "Create " }} Chart
            </md-button>
          </md-card-actions>
        </md-card>
      </form>
    </div>
  </md-dialog>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required, requiredIf } from "vuelidate/lib/validators";
import { mapActions } from "vuex";

export default {
  name: "ChartPopup",

  mixins: [validationMixin],

  props: {
    dashboardChart: {
      type: Object,
      default: null
    },
    visibility: {
      type: Boolean,
      default: false
    }
  },

  validations: {
    form: {
      name: {
        required
      },
      chartType: {
        required
      },
      subgroupSize: {
        required
      },
      password: {
        required: requiredIf(function () {
          return !this.form.isPublic;
        })
      }
    }
  },

  data: () => ({
    form: {
      name: "",
      chartType: "x-mr",
      subgroupSize: 1,
      password: "",
      isPublic: true
    },
    loading: false
  }),

  computed: {
    isUpdate() {
      return !!(this.dashboardChart && Object.keys(this.dashboardChart).length);
    }
  },

  watch: {
    "form.chartType": function (newVal) {
      switch (newVal) {
        case "x-mr":
          this.form.subgroupSize = 1;
          break;
        case "x-bar-s":
          this.form.subgroupSize = 12;
          break;
        case "x-bar-r":
          this.form.subgroupSize = 8;
          break;

        default:
          break;
      }
    },
    visibility(val) {
      if (val) this.setFormDefaults();
    }
  },

  methods: {
    ...mapActions("dashboardChartModule", {
      createChart: "createChart",
      updateChart: "updateChart"
    }),

    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];

      if (field) {
        return {
          "md-invalid": field.$invalid && field.$dirty
        };
      }
    },

    clearForm() {
      this.$v.$reset();
      this.setFormDefaults();
    },

    close() {
      this.$emit("hide");
      this.$v.$reset();
      this.setFormDefaults();
    },

    setFormDefaults() {
      if (this.dashboardChart && Object.keys(this.dashboardChart).length) {
        this.form = {
          name: this.dashboardChart.name || "",
          chartType: this.dashboardChart.chartType || "x-mr",
          subgroupSize: this.dashboardChart.subgroupSize || 1,
          password: this.dashboardChart.password || "",
          isPublic: !!this.dashboardChart.isPublic
        };
      } else {
        this.form = {
          name: "",
          chartType: "x-mr",
          subgroupSize: 1,
          password: "",
          isPublic: true
        };
      }
    },

    validateData() {
      this.$v.$touch();

      if (!this.$v.$invalid) {
        this.loading = true;
        this.isUpdate
          ? this.updateChart({
              chartId: this.dashboardChart.chartId,
              body: { ...this.form },
              cb: this.displayMessage
            })
          : this.createChart({
              body: { ...this.form },
              cb: this.displayMessage
            });
      }
    },

    displayMessage(response) {
      this.loading = false;
      if (response.success) {
        this.clearForm();
        this.$emit("hide");
      }

      this.setMessage(response.message);
      this.setShow(true);
    }
  }
};
</script>

<style scoped>
.chart-popup {
  width: 500px;
}

.form {
  width: 100%;
}
</style>

<style>
.chart-popup .md-disabled {
  background: #eee;
}
</style>