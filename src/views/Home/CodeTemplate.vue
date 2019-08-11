<template lang="pug">
  .code-template
    pre
      code(class="language-js" ref="codeContainer")
</template>

<script>
export default {
  name: 'CodeTemplate',
  props: {
    codes: String
  },
  data() {
    return {
    }
  },
  watch: {
    codes: {
      handler(value) {
        this.setValueToDom(value)
      },
      immediate: true
    }
  },
  methods: {
    setValueToDom(value) {
      const dom = this.$refs.codeContainer
      if (dom) {
        const html = Prism.highlight(value, Prism.languages.javascript, 'javascript')
        dom.innerHTML = html
      } else {
        setTimeout(() => {
          this.setValueToDom(value)
        }, 200)
      }
    }
  }
}
</script>

<style>
.code-template {
  width: 100%;
  height: 100%;
  flex: 1;
}
</style>
