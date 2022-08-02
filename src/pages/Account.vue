<template>
  <div class="account">
    <div class="update">
      <div class="head">
        <h2 class="title">Update Account Details</h2>
        <ul class="actions">
          <li class="action" v-show="edit">
            <md-button @click="reset">Reset</md-button>
          </li>
          <li class="action" v-show="edit">
            <md-button class="md-primary" @click="updateUser"
              >Save changes</md-button
            >
          </li>
          <li class="action">
            <md-switch v-model="edit" class="md-primary">Edit</md-switch>
          </li>
        </ul>
      </div>
      <div class="body">
        <div class="form">
          <md-field>
            <label>E-mail</label>
            <md-input
              v-model="user.email"
              type="text"
              :disabled="!edit || loading"
            ></md-input>
          </md-field>

          <md-field>
            <label>First Name</label>
            <md-input
              v-model="user.firstName"
              type="text"
              :disabled="!edit || loading"
            ></md-input>
          </md-field>

          <md-field>
            <label>Last Name</label>
            <md-input
              v-model="user.lastName"
              type="text"
              :disabled="!edit || loading"
            ></md-input>
          </md-field>

          <md-field>
            <label>Company</label>
            <md-input
              v-model="user.company"
              type="text"
              :disabled="!edit || loading"
            ></md-input>
          </md-field>
        </div>
      </div>
    </div>
    <div class="danger">
      <div class="head">
        <h2 class="title">Delete Your account</h2>
        <ul class="actions">
          <li class="action">
            <md-button @click="password = ''">Clear</md-button>
          </li>
        </ul>
      </div>
      <div class="body">
        <div class="form">
          <md-field>
            <label>Confirm Password</label>
            <md-input
              v-model="password"
              type="text"
              :disabled="loading"
            ></md-input>
          </md-field>

          <div>
            <md-button
              class="md-raised md-primary"
              @click="password = ''"
              :disabled="!password || loading"
            >
              Clear
            </md-button>
            <md-button
              class="md-raised md-accent"
              :disabled="!password || loading"
              @click="deleteAccount"
            >
              Delete Account
            </md-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { userApi } from "../api";
import storageHelperUtil from "../utils/storageHelper.util";
export default {
  name: "Account",

  data() {
    return {
      loading: false,
      edit: false,
      user: {
        email: "",
        firstName: "",
        lastName: "",
        company: ""
      },
      password: ""
    };
  },

  created() {
    const userObj = storageHelperUtil.getUserObj();
    if (!userObj) this.$router.push("/login");
  },

  mounted() {
    const userObj = storageHelperUtil.getUserObj();
    if (userObj)
      this.user = {
        ...this.user,
        ...userObj
      };
    else this.$router.push("/login");
  },

  methods: {
    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    reset() {
      const userObj = storageHelperUtil.getUserObj();
      if (userObj)
        this.user = {
          ...this.user,
          ...userObj
        };
    },

    updateUser() {
      this.loading = true;
      const userObj = storageHelperUtil.getUserObj();
      userApi
        .updateUser(userObj.id, this.user)
        .then((res) => {
          storageHelperUtil.setUserObj(res.data);
          this.user = {
            ...res.data
          };
          this.edit = false;
          this.setMessage("Successfully updated data");
          this.setShow(true);
          this.loading = false;
          window.location.reload();
        })
        .catch((error) => {
          console.error("error :: ", error);
          this.setMessage("Something went wrong");
          this.setShow(true);
          this.loading = false;
        });
    },

    deleteAccount() {
      if (this.password) {
        this.loading = true;
        const userObj = storageHelperUtil.getUserObj();
        userApi
          .deleteUser(userObj.id, this.password)
          .then((res) => {
            storageHelperUtil.removeUserObj();
            localStorage.clear();
            this.loading = false;
            window.location = "/register";
          })
          .catch((error) => {
            console.error("error :: ", error);
            this.setMessage(error?.response?.data || "Something went wrong");
            this.setShow(true);
            this.loading = false;
          });
      }
    }
  }
};
</script>

<style scoped>
.account,
.update,
.danger {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.update,
.danger {
  margin: 5px 10px;
  margin-bottom: 20px;
}

.head {
  width: 100%;
  min-height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  padding: 5px;
  background: #eee;
}

.title {
  margin: 5px 10px;
}

.actions {
  margin: 5px 10px;
  padding: 0px;
  list-style-type: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action {
  margin: 0 5px;
}

.body {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border: 2px solid #eee;
  border-top-color: white;
}

.form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 5px;
  padding: 5px 10px;
}
</style>
