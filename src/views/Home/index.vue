<template lang="pug">
  .container
    el-tabs(
      tab-position="right"
      style="height: 100%;"
      v-model="activeTabName"
    )
      el-tab-pane(label="配置项" name="config")
        FormConfig(@emitGetListWithParams="receiveGetListWithParams" @emitFormData="receiveFormData")
      el-tab-pane(label="接口列表" name="list")
        List(:apiList="apiList" @emitGenerateCode="receiveGenerateCode")
      el-tab-pane(label="代码模板" name="template")
        CodeTemplate(:codes="codes")
</template>

<script>
import FormConfig from './FormConfig'
import List from './List'
import CodeTemplate from './CodeTemplate'
import Axios from 'axios'
export default {
  name: 'Home',
  components: {
    FormConfig,
    List,
    CodeTemplate
  },
  data() {
    return {
      activeTabName: 'config',
      apiList: [],
      buildParams: {
        template: '',
        getFormatter: '',
        postFormatter: '',
        url: ''
      },
      codes: ''
    }
  },
  computed: {
    APIS() {
      return this.$store.state.APIS
    }
  },
  methods: {
    receiveGenerateCode(include) {
      const params = Object.assign({}, this.buildParams, {include})
      this.requestBuild(params)
    },
    receiveFormData(formData) {
      this.buildParams = formData
    },
    receiveGetListWithParams() {
      this.activeTabName = 'list'
      this.requestListWithUrl(this.buildParams.url)
    },
    async requestListWithUrl(url) {
      const { data } = await Axios.get(`${this.APIS.list}?url=${url}`)
      if (data.success) {
        this.apiList = data.data
      } else {
        this.$message({
          message: data.message,
          type: 'error'
        })
      }
    },
    async requestBuild(params) {
      const { data } = await Axios.post(`${this.APIS.build}`, params)
      if (data.success) {
        this.codes = data.data
        this.activeTabName = 'template'
      } else {
        this.$message({
          message: data.message,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style>
.container {
  height: 100%;
}
.el-tabs__content {
  height: 100%;
}
.el-tab-pane {
  padding: 20px;
  height: 100%;
  overflow: auto;
}
</style>
