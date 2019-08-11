<template lang="pug">
  #app
    router-view
</template>

<script>
import axios from 'axios'
export default {
  name: 'App',
  components: {
  },
  data() {
  }
}
</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
html, body,#app {
  height: 100%;
}
.el-textarea__inner {
  height: 180px;
}
</style>
