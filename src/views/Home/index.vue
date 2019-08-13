<template lang="pug">
  .container
    el-tabs(
      tab-position="right"
      style="height: 100%;"
      v-model="activeTabName"
      v-loading="loading"
      element-loading-text="疯狂加载中"
      element-loading-spinner="el-icon-loading"
    )
      el-tab-pane(label="配置项" name="config")
        FormConfig(@emitGetListWithParams="receiveGetListWithParams" @emitFormData="receiveFormData")
      el-tab-pane(label="接口列表" name="list")
        List(:apiList="apiList" @emitGenerateCode="receiveGenerateCode")
      el-tab-pane(label="代码模板" name="template")
        el-button(type="primary" id="copy-code" :data-clipboard-text="codes" @click="onClickCopy") 复制
        CodeTemplate(:codes="codes")
</template>

<script>
import Clipboard from 'clipboard'
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
      codes: '',
      loading: false
    }
  },
  computed: {
    APIS() {
      return this.$store.state.APIS
    }
  },
  methods: {
    onClickCopy() {
      let clipBoard = new Clipboard('#copy-code')
      clipBoard.on('success', e => {
        this.$message({
          message: '复制成功',
          type: 'success'
        })
        clipBoard.destroy()
      })
      clipBoard.on('error', e => {
        this.$message({
          message: '复制失败',
          type: 'error'
        })
        clipBoard.destroy()
      })
    },
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
      this.loading = true
      const { data } = await Axios.get(`${this.APIS.list}?url=${url}`)
      this.loading = false
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
      this.activeTabName = 'template'
      this.loading = true
      const { data } = await Axios.post(`${this.APIS.build}`, params)
      this.loading = false
      if (data.success) {
        this.codes = data.data
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
