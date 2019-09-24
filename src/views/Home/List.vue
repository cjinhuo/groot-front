<template lang="pug">
  .list
    el-button(type="primary" @click="onClickGenerateCodes" :disabled="apiList.length === 0") 代码生成
    el-button(type="primary" @click="onClickGenerateAndroid" :disabled="apiList.length === 0") 安卓生成
    el-tree(
      ref="tree"
      :data="apiList"
      show-checkbox
      default-expand-all
      node-key="id"
      highlight-current
    )
      div(
        slot-scope="{ node: { data } }"
        class="api-tree-node"
      )
        div(class="node-label")
          span(class="node-method" :class="'node-method-' + data.method" v-if="data.method") {{ data.method }}
          span {{ data.label }}
        div(class="node-description") {{ data.description }}
</template>

<script>
export default {
  name: 'List',
  props: {
    apiList: {
      type: Array,
      default:() => []
    }
  },
  data() {
    return {

    }
  },
  methods: {
    onClickGenerateCodes() {
      const checkedNodes = this.$refs.tree.getCheckedNodes()
      const include = checkedNodes.filter(node => !!node.method).map(node => `${node.method} ${node.path}`)
      this.$emit('emitGenerateCode', include)
    },
    onClickGenerateAndroid() {
      const checkedNodes = this.$refs.tree.getCheckedNodes()
      const include = checkedNodes.filter(node => !!node.method).map(node => `${node.method} ${node.path}`)
      this.$emit('emitAndroidCode', include)
    }
  }
}
</script>

<style scoped>
.api-tree-node {
    display: flex;
    width: 100%;
    justify-content: space-between;
}

.api-tree-node .node-label {
    display: flex;
    align-items: center;
}

.api-tree-node .node-method {
    color: #fff;
    background-color: #191919;
    padding: 0 2px;
    margin: 0 10px 0 0;
    text-transform: uppercase;
    font-size: 12px;
    min-width: 60px;
    text-align: center;
}

.api-tree-node .node-method.node-method-get {
    background-color: #0f6ab4;
}
.api-tree-node .node-method.node-method-post {
    background-color: #10a54a;
}
.api-tree-node .node-method.node-method-put {
    background-color: #c5862b;
}
.api-tree-node .node-method.node-method-delete {
    background-color: #a41e22;
}
.api-tree-node .node-method.node-method-head {
    background-color: #ffd20f;
}
.api-tree-node .node-method.node-method-options {
    background-color: #0f6ab4;
}
.api-tree-node .node-method.node-method-patch {
    background-color: #D38042;
}
</style>
