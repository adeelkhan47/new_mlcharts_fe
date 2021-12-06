<template>
  <div class="main-layout">
    <md-app>
      <md-app-toolbar class="md-primary">
        <span class="md-title">ML App</span>
        <span class="links-wrapper">
          <ul class="links">
            <li class="link" :class="{ active: activeLink === 'Home' }">
              <router-link to="/home"> Home</router-link>
            </li>
            <li class="link" :class="{ active: activeLink === 'About' }">
              <router-link to="/about"> About</router-link>
            </li>
            <li class="link" @click="logout">
              Logout
            </li>
          </ul>
        </span>
      </md-app-toolbar>

      <md-app-content>
        <router-view></router-view>
      </md-app-content>
    </md-app>
  </div>
</template>

<script>
import userHelper from "../utils/userHelper.util";

export default {
  name: "MainLayout",
  data() {
    return {
      activeLink: ""
    };
  },
  mounted() {
    this.activeLink = this.$route.name;
  },
  watch: {
    $route: function() {
      this.activeLink = this.$route.name;
    }
  },
  methods: {
    logout() {
      userHelper.removeUserObj();
      this.$router.push("/login");
    }
  }
};
</script>

<style scoped>
.main-layout {
  position: relative;
  width: 100%;
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
</style>
