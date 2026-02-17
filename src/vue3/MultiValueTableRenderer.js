/**
 * Multi-Value Table Renderer for Vue 3
 *
 * Renders a pivot table where each cell displays multiple aggregated values,
 * each with its own aggregation function.
 *
 * Uses Vue 3 Composition API and integrates with vue-pivottable's
 * providePivotData composable.
 *
 * @example
 * import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue3'
 *
 * // In VuePivottable
 * <VuePivottable
 *   :data="data"
 *   :rows="['region']"
 *   :cols="['product']"
 *   :vals="['sales', 'quantity']"
 *   :renderers="MultiValueRenderers"
 *   renderer-name="Multi-Value Table"
 *   :aggregator-map="{ sales: 'Sum', quantity: 'Average' }"
 * />
 */

import { defineComponent, h, markRaw } from 'vue'
import { PivotUtilities } from 'vue-pivottable'
import { createMultiValueAggregator } from '../core'

const { PivotData } = PivotUtilities

/**
 * Red color scale generator for heatmap
 */
function redColorScaleGenerator(values) {
  const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v))
  if (numericValues.length === 0) {
    return () => ({})
  }
  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  return x => {
    if (typeof x !== 'number' || isNaN(x) || max === min) {
      return {}
    }
    const nonRed = 255 - Math.round(255 * (x - min) / (max - min))
    return { backgroundColor: `rgb(255,${nonRed},${nonRed})` }
  }
}

/**
 * Creates the Multi-Value Table Renderer for Vue 3
 * Follows the pattern from @vue-pivottable/plotly-renderer
 */
export function makeMultiValueRenderer(opts = {}) {
  return defineComponent({
    name: opts.name || 'vue3-multi-value-table',

    props: {
      // Data props
      data: {
        type: [Array, Object, Function],
        required: true
      },
      rows: {
        type: Array,
        default: () => []
      },
      cols: {
        type: Array,
        default: () => []
      },
      vals: {
        type: Array,
        default: () => []
      },

      // Multi-value specific props
      aggregatorMap: {
        type: Object,
        default: () => ({})
      },
      aggregators: {
        type: Object,
        required: true
      },

      // Filter and sort props
      valueFilter: {
        type: Object,
        default: () => ({})
      },
      sorters: {
        type: [Object, Function],
        default: () => ({})
      },
      derivedAttributes: {
        type: [Object, Function],
        default: () => ({})
      },
      rowOrder: {
        type: String,
        default: 'key_a_to_z'
      },
      colOrder: {
        type: String,
        default: 'key_a_to_z'
      },

      // Display props
      rowTotal: {
        type: Boolean,
        default: true
      },
      colTotal: {
        type: Boolean,
        default: true
      },
      tableColorScaleGenerator: {
        type: Function,
        default: () => redColorScaleGenerator
      },
      tableOptions: {
        type: Object,
        default: () => ({})
      },
      localeStrings: {
        type: Object,
        default: () => ({ totals: 'Totals' })
      },
      labels: {
        type: Object,
        default: () => ({})
      },

      // Multi-value display options
      cellLayout: {
        type: String,
        default: 'vertical',
        validator: v => ['vertical', 'horizontal', 'compact'].includes(v)
      },
      showValueLabels: {
        type: Boolean,
        default: true
      },
      valueLabels: {
        type: Object,
        default: () => ({})
      }
    },

    setup(props) {
      /**
       * Apply label transformation to a value
       */
      const applyLabel = (attr, value) => {
        if (props.labels && typeof props.labels[attr] === 'function') {
          return props.labels[attr](value)
        }
        return value
      }

      /**
       * Get display label for a value column
       */
      const getValueLabel = (valName) => {
        if (props.valueLabels && props.valueLabels[valName]) {
          return props.valueLabels[valName]
        }
        return valName
      }

      /**
       * Calculate row/col span for merged cells
       */
      const spanSize = (arr, i, j) => {
        let x
        if (i !== 0) {
          let noDraw = true
          for (x = 0; x <= j; x++) {
            if (arr[i - 1][x] !== arr[i][x]) {
              noDraw = false
            }
          }
          if (noDraw) return -1
        }
        let len = 0
        while (i + len < arr.length) {
          let stop = false
          for (x = 0; x <= j; x++) {
            if (arr[i][x] !== arr[i + len][x]) {
              stop = true
            }
          }
          if (stop) break
          len++
        }
        return len
      }

      /**
       * Format a single value using the appropriate aggregator
       */
      const formatValue = (valName, value) => {
        const aggName = props.aggregatorMap[valName] || 'Sum'
        const agg = props.aggregators[aggName]
        if (agg) {
          try {
            const instance = agg([valName])()
            if (instance && instance.format) {
              return instance.format(value)
            }
          } catch (e) {
            // Fallback to string
          }
        }
        if (value === null || value === undefined) return ''
        if (typeof value === 'number') {
          return value.toLocaleString()
        }
        return String(value)
      }

      /**
       * Render multi-value cell content
       */
      const renderMultiValueCell = (values) => {
        if (!values || typeof values !== 'object') {
          return String(values || '')
        }

        const items = props.vals.map(val => {
          const value = values[val]
          const formatted = formatValue(val, value)
          const label = getValueLabel(val)
          const aggName = props.aggregatorMap[val] || 'Sum'

          if (props.cellLayout === 'compact') {
            return formatted
          }

          return h('div', {
            class: 'multi-value-item',
            key: val,
            'data-value': val,
            'data-aggregator': aggName
          }, [
            props.showValueLabels
              ? h('span', { class: 'multi-value-label' }, `${label}: `)
              : null,
            h('span', { class: 'multi-value-value' }, formatted)
          ])
        })

        if (props.cellLayout === 'compact') {
          return items.join(' / ')
        }

        return h('div', {
          class: ['multi-value-cell', `layout-${props.cellLayout}`]
        }, items)
      }

      /**
       * Create PivotData with multi-value aggregation
       */
      const createPivotData = () => {
        const multiValueAgg = createMultiValueAggregator(
          props.aggregatorMap,
          props.aggregators,
          props.vals
        )

        const modifiedAggregators = {
          ...props.aggregators,
          'Multi-Value': () => multiValueAgg
        }

        return new PivotData({
          data: props.data,
          rows: props.rows,
          cols: props.cols,
          vals: props.vals,
          aggregators: modifiedAggregators,
          aggregatorName: 'Multi-Value',
          valueFilter: props.valueFilter,
          sorters: props.sorters,
          derivedAttributes: props.derivedAttributes,
          rowOrder: props.rowOrder,
          colOrder: props.colOrder
        })
      }

      return {
        applyLabel,
        getValueLabel,
        spanSize,
        formatValue,
        renderMultiValueCell,
        createPivotData
      }
    },

    render() {
      let pivotData
      try {
        pivotData = this.createPivotData()
      } catch (error) {
        console.error('Multi-Value Renderer Error:', error)
        return h('div', { class: 'pvtError' }, `Error: ${error.message}`)
      }

      const colAttrs = pivotData.props.cols
      const rowAttrs = pivotData.props.rows
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const grandTotalAggregator = pivotData.getAggregator([], [])

      // Click handler factory
      const getClickHandler = (value, rowValues, colValues) => {
        if (this.tableOptions?.clickCallback) {
          const filters = {}
          colAttrs.forEach((attr, i) => {
            if (colValues[i] !== null) {
              filters[attr] = colValues[i]
            }
          })
          rowAttrs.forEach((attr, i) => {
            if (rowValues[i] !== null) {
              filters[attr] = rowValues[i]
            }
          })
          return e => this.tableOptions.clickCallback(e, value, filters, pivotData)
        }
        return null
      }

      return h('table', { class: ['pvtTable', 'pvtMultiValueTable'] }, [
        // THEAD
        h('thead', [
          // Column attribute headers
          ...colAttrs.map((c, j) => {
            return h('tr', { key: `colAttrs${j}` }, [
              // Top-left corner cell
              j === 0 && rowAttrs.length !== 0
                ? h('th', { colSpan: rowAttrs.length, rowSpan: colAttrs.length })
                : undefined,

              // Column attribute label
              h('th', { class: 'pvtAxisLabel' }, c),

              // Column keys
              ...colKeys.map((colKey, i) => {
                const x = this.spanSize(colKeys, i, j)
                if (x === -1) return null
                return h('th', {
                  class: 'pvtColLabel',
                  key: `colKey${i}`,
                  colSpan: x,
                  rowSpan: j === colAttrs.length - 1 && rowAttrs.length !== 0 ? 2 : 1
                }, this.applyLabel(colAttrs[j], colKey[j]))
              }),

              // Totals header
              j === 0 && this.rowTotal
                ? h('th', {
                    class: 'pvtTotalLabel',
                    rowSpan: colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                  }, this.localeStrings.totals)
                : undefined
            ].filter(Boolean))
          }),

          // Row attribute labels row
          rowAttrs.length !== 0
            ? h('tr', [
                ...rowAttrs.map((r, i) => {
                  return h('th', { class: 'pvtAxisLabel', key: `rowAttr${i}` }, r)
                }),
                this.rowTotal
                  ? h('th', { class: 'pvtTotalLabel' },
                      colAttrs.length === 0 ? this.localeStrings.totals : null)
                  : (colAttrs.length === 0 ? undefined : h('th'))
              ].filter(Boolean))
            : undefined
        ].filter(Boolean)),

        // TBODY
        h('tbody', [
          // Data rows
          ...rowKeys.map((rowKey, i) => {
            const totalAggregator = pivotData.getAggregator(rowKey, [])
            return h('tr', { key: `rowKeyRow${i}` }, [
              // Row labels
              ...rowKey.map((text, j) => {
                const x = this.spanSize(rowKeys, i, j)
                if (x === -1) return null
                return h('th', {
                  class: 'pvtRowLabel',
                  key: `rowKeyLabel${i}-${j}`,
                  rowSpan: x,
                  colSpan: j === rowAttrs.length - 1 && colAttrs.length !== 0 ? 2 : 1
                }, this.applyLabel(rowAttrs[j], text))
              }),

              // Data cells
              ...colKeys.map((colKey, j) => {
                const aggregator = pivotData.getAggregator(rowKey, colKey)
                const value = aggregator.value()
                const clickHandler = getClickHandler(value, rowKey, colKey)

                return h('td', {
                  class: ['pvVal', 'pvtMultiVal'],
                  key: `pvtVal${i}-${j}`,
                  onClick: clickHandler
                }, [this.renderMultiValueCell(value)])
              }),

              // Row total
              this.rowTotal
                ? h('td', {
                    class: ['pvtTotal', 'pvtMultiVal'],
                    onClick: getClickHandler(totalAggregator.value(), rowKey, [])
                  }, [this.renderMultiValueCell(totalAggregator.value())])
                : undefined
            ].filter(Boolean))
          }),

          // Column totals row
          h('tr', [
            this.colTotal
              ? h('th', {
                  class: 'pvtTotalLabel',
                  colSpan: rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)
                }, this.localeStrings.totals)
              : undefined,

            ...(this.colTotal
              ? colKeys.map((colKey, i) => {
                  const totalAggregator = pivotData.getAggregator([], colKey)
                  const clickHandler = getClickHandler(totalAggregator.value(), [], colKey)
                  return h('td', {
                    class: ['pvtTotal', 'pvtMultiVal'],
                    key: `total${i}`,
                    onClick: clickHandler
                  }, [this.renderMultiValueCell(totalAggregator.value())])
                })
              : []),

            this.colTotal && this.rowTotal
              ? h('td', {
                  class: ['pvtGrandTotal', 'pvtMultiVal'],
                  onClick: getClickHandler(grandTotalAggregator.value(), [], [])
                }, [this.renderMultiValueCell(grandTotalAggregator.value())])
              : undefined
          ].filter(Boolean))
        ])
      ])
    }
  })
}

export default markRaw({
  'Multi-Value Table': makeMultiValueRenderer({ name: 'vue3-multi-value-table' })
})
