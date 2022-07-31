<template>
  <md-dialog :md-active="visibility">
    <div class="chart-popup">
      <form novalidate class="md-layout form" @submit.prevent="onSubmit">
        <md-card class="md-layout-item">
          <md-card-header>
            <div class="md-title">
              {{ title }}
            </div>
          </md-card-header>

          <md-card-content>
            <div
              class="md-layout md-gutter"
              v-for="item in formItems"
              :key="item.key"
            >
              <div class="md-layout-item md-small-size-100">
                <md-field>
                  <label :for="item.key"> {{ item.label }}</label>
                  <md-input
                    :name="item.key"
                    :id="item.key"
                    v-model="item.value"
                    :disabled="loading"
                  />
                </md-field>
              </div>
            </div>
          </md-card-content>

          <md-progress-bar md-mode="indeterminate" v-if="loading" />

          <md-card-actions>
            <md-button :disabled="loading" @click="onClose"> Close </md-button>
            <md-button type="submit" class="md-primary" :disabled="loading">
              Save Changes
            </md-button>
          </md-card-actions>
        </md-card>
      </form>
    </div>
  </md-dialog>
</template>

<script>
export default {
  name: "HeadingEditPopup",

  props: {
    title: {
      type: String,
      default: ""
    },
    fields: {
      type: Array,
      default: () => []
    },
    visibility: {
      type: Boolean,
      default: false
    }
  },

  data: () => ({
    loading: false,
    formItems: []
  }),

  watch: {
    fields() {
      this.formItems = JSON.parse(JSON.stringify(this.fields));
    },

    visibility() {
      this.formItems = JSON.parse(JSON.stringify(this.fields));
    }
  },

  methods: {
    onClose() {
      this.$emit("onClose");
    },

    onSubmit() {
      this.$emit("onSubmit", this.formItems);
    }
  }
};
</script>

<style scoped>
.chart-popup {
  width: 400px;
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
