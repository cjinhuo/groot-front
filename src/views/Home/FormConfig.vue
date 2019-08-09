<template lang="pug">
  .form-config
    el-form(
      ref="form"
      :rules="rules"
      :model="formData"
      label-width="150px"
      size="small"
    )
      el-form-item(label="swagger地址:" prop="url")
        div(class="container-textarea")
          el-input(v-model="formData.url" placeholder="请输入swagger地址")
          el-button(style="margin-left:20px;" type="primary" @click="onSubmit") 查看接口列表
      el-form-item(label="模板代码")
        div(class="container-textarea")
          el-input(v-model="formData.template" type="textarea" placeholder="")
          el-input(v-model="formData.template" :disabled="true" type="textarea" placeholder="")
      el-form-item(label="get类型模板" prop="getFormatter")
        div(class="container-textarea")
          el-input(v-model="formData.getFormatter" type="textarea" placeholder="get方法请求模板")
          el-input(v-model="getFormatterResult" :disabled="true" type="textarea" placeholder="get方法请求模板")
      el-form-item(label="post类型模板" prop="postFormatter")
        div(class="container-textarea")
          el-input(v-model="formData.postFormatter" type="textarea" placeholder="post方法请求模板")
          el-input(v-model="postFormatterResult" :disabled="true" type="textarea" placeholder="post方法请求模板")
</template>
<script>
export default {
  name: 'FormConfig',
  data() {
    const rules = {
      url: [
        { required: true, message: '请输入swagger地址', trigger: 'blur' }
      ],
      getFormatter: [
        {
          required: true, message: '请输入get类型模板，刷新页面可重置模板内容', trigger: 'blur'
        }
      ],
      postFormatter: [
        {
          required: true, message: '请输入post类型模板，刷新页面可重置模板内容', trigger: 'blur'
        }
      ]
    }
    return {
      rules,
      formData: {
        url: 'http://test-simba-ops.startdtapi.com/swagger-ui.html#',
        template: '',
        getFormatter: `export async funtion {functionName}({ {pathParams.join(',')}, ...params}) {
    return request(/api{path},{
    method: '{method}',
    data: params
  })
}`,
        postFormatter: `export async funtion {functionName}({ {pathParams.join(',')}, ...params}) {
    return request({path},{
    method: {method},
    data: params
  })
}`
      },
      getFormatterResult: '',
      postFormatterResult: ''
    }
  },
  watch: {
    formData: {
      deep: true,
      immediate: true,
      handler(value) {
        this.$emit('emitFormData', value)
      }
    },
    'formData.getFormatter': {
      handler: function(value) {
        const functionName = 'getSupplyGetById'
        const path = '/ops/supply/getById/${supplyId}'
        const method = 'GET'
        const pathParams = []
        const queryParams = ['projectId']
        const headerParams = ['']
        const bodyParams =  ['projectId']
        const result = value.replace(/{[\w.(),' ]+}/g,(target) => {
          const evalStr = target.replace(/\s*/g,"").replace(/[{}]/g, '')
          const result = eval(evalStr)
          return eval(evalStr)
          // const evalStr = `this.getObject[${targetTranslate}]`

        // return this.getObject[target.replace(/\s*/g,"").replace(/[{}]/g, '')]
        })
        console.log('result', result)
        this.getFormatterResult = result
      },
      immediate: true
    },
    'formData.postFormatter': {
      handler(value) {

      },
      immediate: true
    }
  },
  methods: {
    onSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          this.$message({
            message: '填写完整的配置项',
            type: 'warning'
          })
          return
        }
        this.$emit('emitGetListWithParams')
      })
    }
  }

}
</script>

<style scoped>
.container-textarea {
  display: flex;
}
</style>
