<template>
  <md-card class="card">
    <div class="limits-wrapper">
      <h4 class="title">Upper Spec Limit: {{ upperSpecLimit }}</h4>
      <div class="editor">
        <md-field :class="messageUpperClass">
          <md-input v-model="u" @input="upper"></md-input>
          <span class="md-error" v-if="u"> {{ upperError }} </span>
        </md-field>
        <md-button
          class="md-primary"
          :disabled="!u || upperError"
          @click="changeSpecLimit('upper')"
        >
          Change Upper Spec Limit
        </md-button>
      </div>

      <div class="divider"></div>

      <h4 class="title">Lower Spec Limit: {{ lowerSpecLimit }}</h4>
      <div class="editor">
        <md-field :class="messageLowerClass">
          <md-input v-model="l" @input="lower"></md-input>
          <span class="md-error" v-if="l"> {{ lowerError }} </span>
        </md-field>
        <md-button
          class="md-primary"
          :disabled="!l || lowerError"
          @click="changeSpecLimit('lower')"
        >
          Change Lower Spec Limit
        </md-button>
      </div>
    </div>
  </md-card>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  name: "Limits",

  data() {
    return {
      u: null,
      l: null,
      upperError: null,
      lowerError: null,
      upperVal: null,
      lowerVal: null
    };
  },

  computed: {
    ...mapState("xmrChartDataModule", ["upperSpecLimit", "lowerSpecLimit"]),

    messageUpperClass() {
      return {
        "md-invalid": this.upperError
      };
    },
    messageLowerClass() {
      return {
        "md-invalid": this.lowerError
      };
    }
  },

  methods: {
    ...mapActions("xmrChartDataModule", [
      "setUpperSpecLimit",
      "setLowerSpecLimit"
    ]),

    upper(val) {
      if (val && typeof val == "string" && !isNaN(val)) {
        this.upperError = null;
        this.upperVal = Number.parseFloat(val);
      } else {
        this.upperError = "Invalid number";
        this.upperVal = null;
      }
    },
    lower(val) {
      if (val && typeof val == "string" && !isNaN(val)) {
        this.lowerError = null;
        this.lowerVal = Number.parseFloat(val);
      } else {
        this.lowerError = "Invalid number";
        this.lowerVal = null;
      }
    },

    changeSpecLimit(name) {
      if (name == "upper" && this.upperVal != null) {
        this.setUpperSpecLimit(this.upperVal);
      } else if (name == "lower" && this.lowerVal != null) {
        this.setLowerSpecLimit(this.lowerVal);
      }

      this.u = null;
      this.l = null;
      this.upperError = null;
      this.lowerError = null;
      this.upperVal = null;
      this.lowerVal = null;
    }
  }
};
</script>

<style scoped>
.card {
  width: 317px;
}

.limits-wrapper {
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin: 11px 15px;
  border-radius: 25px;
}

h4.title {
  margin: 0px;
  padding: 0px;
}

.divider {
  position: relative;
  width: 100%;
  height: 3px;
  background: lightgrey;
  border-radius: 10px;
  margin: 30px 0;
}
</style>
