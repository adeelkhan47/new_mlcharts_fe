<template>
  <div class="main-layout">
    <md-app md-mode="fixed" class="app">
      <md-app-toolbar class="md-primary">
        <span class="md-title">SPC Charts</span>
        <span class="links-wrapper">
          <ul class="links">
            <li class="link" :class="{ active: activeLink === 'Home' }">
              <router-link to="/dashboard"> Dashboard</router-link>
            </li>
            <li class="link" :class="{ active: activeLink === 'About' }">
              <router-link to="/about"> About</router-link>
            </li>
            <li class="link" @click="logout">Logout</li>
            <li class="link text" v-if="username">{{ username }}</li>
            <li class="link text" v-if="initials">
              <md-avatar class="md-avatar-icon md-medium">
                <md-ripple class="initials">{{ initials }}</md-ripple>
              </md-avatar>
            </li>
          </ul>
        </span>
      </md-app-toolbar>

      <md-app-content class="app-content">
        <router-view></router-view>
      </md-app-content>
    </md-app>
    <md-snackbar
      md-position="center"
      :md-duration="4000"
      :md-active.sync="sb_show"
      md-persistent
    >
      <span>{{ sb_message }}</span>
      <md-button class="md-primary" @click="sb_show = false"> Close </md-button>
    </md-snackbar>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import userHelper from "../utils/userHelper.util";

export default {
  name: "MainLayout",

  data() {
    return {
      activeLink: "",
      user: null
    };
  },

  created() {
    this.user = userHelper.getUserObj();
  },

  mounted() {
    this.activeLink = this.$route.name;
  },

  watch: {
    $route: function () {
      this.activeLink = this.$route.name;
    }
  },

  computed: {
    ...mapState("responseMessageModule", {
      showMessage: "show",
      responseMessage: "message"
    }),

    username() {
      if (this.user) {
        return (
          (this.user.firstName ? this.user.firstName + " " : "") +
          (this.user.lastName ? this.user.lastName : "")
        );
      } else return "";
    },
    initials() {
      if (this.user) {
        return (
          (this.user.firstName ? this.user.firstName[0] : "") +
          (this.user.lastName ? this.user.lastName[0] : "")
        );
      } else return "";
    },

    sb_show: {
      set(val) {
        this.setShow(val);
      },
      get() {
        return this.showMessage;
      }
    },

    sb_message: {
      set(val) {
        this.setMessage(val);
      },
      get() {
        return this.responseMessage;
      }
    }
  },

  methods: {
    ...mapActions("responseMessageModule", ["setShow", "setMessage"]),

    logout() {
      userHelper.removeUserObj();
      this.$router.push("/login");
    }
  }
};
</script>

<style scoped>
.main-layout {
  position: absolute;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.app {
  height: 100%;
}

.links-wrapper {
  margin-left: auto;
  padding: 0 20px;
}

.links {
  list-style-type: none;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin: 0px;
  padding: 0px;
}

.link {
  margin: 10px;
}

.link,
.md-theme-default .link a {
  color: white;
  text-decoration: none;
}

.link:hover,
.md-theme-default .link a:hover {
  color: white;
  text-decoration: none;
  cursor: pointer;
}

.link.active,
.md-theme-default .link.active a {
  color: lightgrey;
  font-weight: bolder;
}

.link.text {
  cursor: auto;
  margin-right: 0px;
  text-align: right;
}

.initials {
  padding: 5px;
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
}
</style>
