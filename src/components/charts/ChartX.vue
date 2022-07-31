<template>
  <div class="x-chart" id="v-container">
    <div class="chart-title-wrapper">
      <h3 class="chart-title">
        {{ title }}
      </h3>
      <md-button
        class="md-icon-button md-dense md-primary chart-title-action"
        @click="() => setEditModel(true)"
      >
        <md-icon>edit</md-icon>
      </md-button>
    </div>
    <template v-if="chartData && chartData.length">
      <v-chart :forceFit="true" :height="400" :data="chartData" :scale="scale">
        <v-tooltip :htmlContent="htmlContent" :showTitle="false" />
        <v-axis :label="label" data-key="key" />
        <v-line
          position="key*value"
          :color="['id', lineColors]"
          :shape="['id', lineShapes]"
        />
        <v-point position="key*value" :color="['id', lineColors]" />
        <v-legend position="bottom" />
      </v-chart>
    </template>
    <template v-else>
      <h4 class="no-data">No Data found</h4>
    </template>
    <heading-edit-popup
      title="Edit Chart Title"
      :fields="formFields"
      :visibility="titleEditVisibility"
      @onClose="() => setEditModel(false)"
      @onSubmit="saveChartTitle"
    />
  </div>
</template>

<script>
const DataSet = require("@antv/data-set");
import colors from "../../utils/colors.util";
import HeadingEditPopup from "../utility/HeadingEditPopup.vue";

export default {
  name: "ChartX",

  components: { HeadingEditPopup },

  props: {
    title: {
      type: String
    },
    chartKey: {
      type: String,
      default: ""
    },
    dataList: {
      type: Array
    },
    formattedDataList: {
      type: Array
    },
    chartFields: {
      type: Array,
      default: () => []
    },
    lineColors: {
      type: Array,
      default: () => [
        "#1890FF",
        "#2FC25B",
        "#FACC14",
        "#223273",
        "#8543E0",
        "#13C2C2",
        "#3436C7",
        "#F04864"
      ]
    },
    lineShapes: {
      type: Array,
      default: () => ["line"]
    }
  },

  data() {
    return {
      colors,
      scale: [
        {
          dataKey: "key",
          min: 0,
          max: 1
        }
      ],
      label: {
        autoRotate: false,
        textStyle: {
          textBaseline: "top",
          rotate: 270
        },
        formatter: this.getLabel
      },
      htmlContent: function htmlContent(title, items) {
        const listItems = items.map((item, i) => {
          let note = "";
          if (
            items.length === 1 &&
            item.point &&
            item.point._origin &&
            item.point._origin.note
          ) {
            note = `
              <div class="note">
                ${item.point._origin.note}
              </div>
            `;
          }

          return `
            <li data-index=${i} class="list-item">
              <div class="content">
                <span
                    style="background-color:${item.color};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px;">
                </span>
                <span class="text-container">
                  <span class="label">
                    ${item.name}
                  </span>
                  <span class="value">
                    ${item.value}
                  </span>
                </span>
              </div>
              ${note}
            </li>
          `;
        });

        return `
          <div class="g2-tooltip">
            <div class="g2-tooltip-title" style="margin-bottom: 4px;"></div>
            <ul class="g2-tooltip-list">
                ${listItems.join("")}
            </ul>
          </div>
        `;
      },
      titleEditVisibility: false
    };
  },

  computed: {
    chartData() {
      const dv = new DataSet.View().source(this.formattedDataList);
      dv.transform({
        type: "fold",
        fields: this.chartFields,
        key: "id",
        value: "value"
      });

      return dv.rows;
    },

    formFields() {
      return [
        {
          label: "Chart Title",
          key: this.chartKey,
          value: this.title || ""
        }
      ];
    }
  },

  methods: {
    getLabel(dataId) {
      if (this.dataList && this.dataList.length) {
        const found = this.dataList.find((obj) => obj.id == dataId);
        if (found) return found.label;
        else return "";
      } else return "";
    },

    setEditModel(visibility) {
      this.titleEditVisibility = visibility;
    },

    saveChartTitle(content) {
      this.setEditModel(false);
      const obj = content[0];
      this.$emit("onTitleChange", {
        [obj.key]: obj.value
      });
    }
  }
};
</script>

<style scoped>
.x-chart {
  margin: 20px 5px;
  position: relative;
  width: 100%;
}

.chart-title-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.chart-title {
  text-align: center;
}

.chart-title-action {
  display: none;
  display: block;
}

.chart-title-wrapper:hover .chart-title-action {
  display: block;
}

.no-data {
  color: grey;
  text-align: center;
}
</style>

<style id="tooltip-custom-style">
#v-container .g2-tooltip {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 3px;
  color: rgb(87, 87, 87);
  font-size: 12px;
  line-height: 20px;
  padding: 10px 10px 6px 10px;
  box-shadow: 2px 2px 15px 4px lightgray;
  min-width: 150px;
  max-width: 350px;
}

#v-container .g2-tooltip-list {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

#v-container .g2-tooltip-value {
  margin-left: 30px;
  display: inline;
  float: right;
}

#v-container .g2-tooltip-statistic {
  font-size: 14px;
  padding-bottom: 10px;
  margin-top: 10px;
  list-style-type: none;
}

#v-container .g2-tooltip-statistic-value {
  font-weight: "bold";
  display: "inline-block";
  float: right;
  margin-left: 30px;
}

#v-container .list-item {
  margin: 5px 0;
}

#v-container .content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

#v-container .text-container {
  flex: 1;
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

#v-container .note {
  margin-top: 10px;
  width: 100%;
  height: auto;
}
</style>
