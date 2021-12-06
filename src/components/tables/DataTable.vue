<template>
  <div class="data-table">
    <md-table v-model="data" md-card md-fixed-header>
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="ID">
          {{ item.id }}
        </md-table-cell>
        <md-table-cell md-label="label">
          {{ item.label }}
        </md-table-cell>
        <md-table-cell md-label="Value">
          {{ item.value }}
        </md-table-cell>
        <md-table-cell md-label="MR">
          {{ item.mr }}
        </md-table-cell>
        <md-table-cell md-label="Edit">
          <md-button
            class="md-icon-button md-dense md-primary"
            @click="edit(item)"
          >
            <md-icon>edit</md-icon>
          </md-button>
        </md-table-cell>
        <md-table-cell md-label="Delete">
          <md-button
            class="md-icon-button md-dense md-accent"
            @click="removeDataItem(item.id)"
          >
            <md-icon>delete</md-icon>
          </md-button>
        </md-table-cell>
      </md-table-row>
    </md-table>

    <add-data :visibility="showEdit" @hide="closed" :item="selectedItem" />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import AddData from "../inputs/AddData.vue";

export default {
  components: { AddData },
  name: "DataTable",

  data() {
    return {
      showEdit: false,
      selectedItem: null
    };
  },

  computed: {
    ...mapState(["dataList", "mr"]),

    data: {
      get() {
        return this.dataList.map((obj) => {
          return {
            id: obj.id,
            label: obj.label,
            value: obj.value,
            mr: this.mr.get(obj.id)
          };
        });
      },
      set() {}
    }
  },

  methods: {
    ...mapActions(["removeDataItem"]),

    edit(item) {
      this.selectedItem = JSON.parse(JSON.stringify(item));
      this.showEdit = true;
    },

    closed() {
      this.showEdit = false;
      this.selectedItem = null;
    }
  }
};
</script>

<style scoped></style>
