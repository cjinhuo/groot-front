<template lang="pug">
  .show-params
    div(class="show-params-header" :class="'header-' + singleObject.method.toLowerCase()")
      div(style="display:flex;")
        div(class="show-params-header-method" :class="'show-params-' + singleObject.method.toLowerCase()") {{ singleObject.method }}
        div(class="show-params-header-path") {{ singleObject.path }}
      div(class="show-params-header-description") {{ singleObject.description }}
    TableList(
      :columns="columns"
      :data="singleObject.tableData"
      :have-pagination="false"
    )
</template>

<script>
import TableList from './TableList'
export default {
  name: 'ShowParams',
  components: {
    TableList
  },
  props: {
    singleObject: {
      type: Object,
      default:() => ({
        method: 'Get',
        path: '',
        description: '',
        tableData: []
      })
    }

  },
  data() {
    const columns = [
      {
        prop: 'functionName',
        label: 'functionName',
        width: '150px'
      },
      {
        prop: 'method',
        label: 'method'
      },
      {
        prop: 'path',
        label: 'path',
        width: '250px'
      },
      {
        prop: 'pathParams',
        label: 'pathParams'
      },
      {
        prop: 'queryParams',
        label: 'queryParams'
      },
      {
        prop: 'headerParams',
        label: 'headerParams'
      },
      {
        prop: 'bodyParams',
        label: 'bodyParams',
        width: '250px'
      }
    ]
    return {
      columns
    }
  },
  methods: {

  }
}
</script>

<style scoped>
.show-params-header {
  display: flex;
  justify-content: space-between;
}
.header-get {
  background-color: #e7f0f7;
  border: 1px solid #c3d9ec;
}
.header-post {
    background-color: #e7f6ec;
    border: 1px solid #c3e8d1;
}
.show-params-header-method {
  margin-right: 20px;
  padding: 0 5px;
  border-radius: 2px;
}
.show-params-get {
  background-color: #0f6ab4;
}
.show-params-post {
  background-color: #10a54a;
}
</style>
