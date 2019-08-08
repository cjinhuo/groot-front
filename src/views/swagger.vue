<template>
  <div class="container">
    <el-form
      :inline="true"
      :model="formConfig"
    >
      <el-form-item label="接口地址">
        <el-input
          v-model="formConfig.url"
          placeholder="请输入swagger地址"
          style="width: 400px;"
        />
      </el-form-item>
      <el-form-item label="统一前缀">
        <el-input
          v-model="formConfig.prefix"
          placeholder="请输入接口地址统一前缀"
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item v-show="formConfig.url">
        <el-button
          type="primary"
          icon="el-icon-search"
          plain
          @click="onSearch"
        >
          查询接口
        </el-button>
      </el-form-item>
      <el-form-item v-show="showPrev">
        <el-button
          type="primary"
          icon="el-icon-document"
          plain
          @click="onPreview"
        >
          预览代码
        </el-button>
      </el-form-item>
      <el-form-item v-show="showSave">
        <el-button
          type="primary"
          icon="el-icon-share"
          plain
          @click="onCopy"
        >
          复制代码
        </el-button>
      </el-form-item>
      <!--<el-form-item v-show="showSave">-->
      <!--<el-button @click="onSave" type="primary" icon="el-icon-printer" plain>保存代码</el-button>-->
      <!--</el-form-item>-->
    </el-form>
    <el-tabs
      v-model="activeTab"
      tab-position="right"
    >
      <el-tab-pane
        label="选择接口"
        class="api-list-panel"
        name="search"
      >
        <el-tree
          ref="tree"
          :data="apiList"
          show-checkbox
          default-expand-all
          node-key="id"
          highlight-current
        >
          <div
            slot-scope="{ node: { data } }"
            class="api-tree-node"
          >
            <div class="node-label">
              <span
                v-if="data.method"
                class="node-method"
                :class="'node-method-' + data.method"
              >{{ data.method }}</span>
              <span>{{ data.label }}</span>
            </div>
            <div class="node-description">
              {{ data.description }}
            </div>
          </div>
        </el-tree>
      </el-tab-pane>
      <el-tab-pane
        label="代码预览"
        class="code-preview-panel"
        name="preview"
      >
        <pre><code
id="codeResult"
                   class="language-js"
        /></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'Name',
  data() {
    return {
      codeResult: '',
      activeTab: 'search',
      formConfig: {
        url: 'http://dev1.nx-visual.51.env/',
        prefix: '/nx-visual/v1/nxvisual'
      },
      apiList: [],
      showPrev: false,
      showSave: false
    }
  },
  watch: {
    formConfig: {
      deep: true,
      handler() {
        this.showPrev = false
        this.showSave = false
      }
    }
  },
  methods: {
    onSearch() {
      var { url, prefix } = this.formConfig
      // eslint-disable-next-line promise/catch-or-return
      fetch(`/api/api-list?url=${encodeURIComponent(url)}&prefix=${encodeURIComponent(prefix)}`)
        .then(res => res.json())
        .then(({ data }) => {
          this.apiList = data
        })
        .then(() => fetch(`/api/get-status?url=${encodeURIComponent(url)}`))
        .then(res => res.json())
        .then(({ data }) => {
          if (data && Array.isArray(data)) {
            this.$refs.tree.setCheckedKeys(data)
          } else {
            this.$refs.tree.setCheckedKeys(['root'])
          }
        })
        .then(() => {
          this.showPrev = true
        })
    },
    onPreview() {
      var { url, prefix } = this.formConfig
      var checkedNodes = this.$refs.tree.getCheckedNodes()
      var includes = checkedNodes.filter(node => !!node.method).map(node => `${node.method} ${node.path}`)

      // eslint-disable-next-line promise/catch-or-return
      fetch(`/api/build-code?url=${encodeURIComponent(url)}&prefix=${encodeURIComponent(prefix)}`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ includes })
      })
        .then(res => res.json())
        .then(({ data }) => {
          this.codeResult = data

          var html = Prism.highlight(data, Prism.languages.javascript, 'javascript')
          var dom = document.querySelector('#codeResult')
          dom.innerHTML = html

          if (this.activeTab !== 'preview') {
            this.showSave = true
            this.activeTab = 'preview'
          }
        })
    },
    onCopy() {
      this.copyToClipboard(this.codeResult)
    },
    onSave() {

    },
    copyToClipboard(content) {
      var el = document.createElement('textarea')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      el.setAttribute('readonly', '')
      el.value = content

      document.body.appendChild(el)

      el.select()
      el.setSelectionRange(0, el.value.length)

      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }
}
</script>

<style scoped>

</style>
