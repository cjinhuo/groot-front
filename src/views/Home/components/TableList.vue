<script type="text/jsx">

/**
 * columns 格式
 * [
 *    {
 *      label: '名词',
 *      prop: 'tableName',
 *      width: '',
 *      render(row) { // 是否定制
 *      }
 *    }
 * ]
 *
 * 坑：
 * render
 * jsx 不能用 函数简写
 */
export default {
  name: 'TableList',

  props: {
    columns: { // 表格列字段格式配置
      type: Array,
      default: () => []
    },
    data: { // 表格的数据
      type: Array,
      default: () => []
    },

    loading: {
      type: Boolean,
      default: false
    },

    type: String,

    havePagination: {
      type: Boolean,
      default: true
    },

    paginationConfig: {
      type: Object,
      default: () => ({
        pageSize: 10,
        totalCount: 100,
        currentPage: 1,
        pageSizes: [10, 20, 30, 40],
        layout: 'prev, pager, next, sizes, total, jumper'
      })
    }

  },

  data() {
    const { pageSize, totalCount, currentPage } = this.paginationConfig

    return {
      pagination: {
        pageSize,
        totalCount,
        currentPage
      }
    }
  },

  watch: {
    paginationConfig: {
      handler(value) {
        const { pageSize, totalCount, currentPage } = value

        this.pagination.pageSize = pageSize
        this.pagination.totalCount = totalCount
        this.pagination.currentPage = currentPage
      },
      deep: true
    }
  },

  methods: {
    onSizeChange(pageSize) {
      this.pagination.pageSize = pageSize
      this.$emit('changePage', this.pagination)
    },

    onCurrentChange(currentPage) {
      this.pagination.currentPage = currentPage
      this.$emit('changePage', this.pagination)
    },

    renderTable() {
      const tableColumns = this.columns.map((column, index) => {
        const attributes = {
          attrs: { ...column }
        }

        return (
          <el-table-column
            key={index}
            {...attributes}
          />
        )
      })

      const tableAttrs = {
        attrs: this.$attrs,
        on: this.$listeners
      }
      return (
        <el-table
          ref="tableRef"
          data={this.data}
          v-loading={this.loading}
          {...tableAttrs}
        >
          { tableColumns }
        </el-table>
      )
    },

    renderTablePagination() {
      if (!this.havePagination) return null

      const { pageSize, totalCount, currentPage, layout, pageSizes } = this.paginationConfig
      return (
        <el-pagination
          on-current-change={this.onCurrentChange}
          on-size-change={this.onSizeChange}
          pageSizes={pageSizes}
          pageSize={pageSize}
          total={totalCount}
          currentPage={currentPage}

          layout={layout}
        />
      )
    }
  },

  render() {
    return (
      <div class="table--list">
        <div class="table--list__inner">
          { this.renderTable() }
        </div>
        <div class="table--list__pagination">
          { this.renderTablePagination() }
        </div>
      </div>
    )
  }
}
</script>

<style scoped>
  .table--list__pagination {
    margin-top: 12px;
    text-align: right;
  }
</style>
