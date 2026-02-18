/**
 * Multi-Value Table Renderer for Vue 2
 *
 * Renders a pivot table where each cell displays multiple aggregated values,
 * each with its own aggregation function.
 *
 * @example
 * import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue2'
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

import { PivotUtilities } from 'vue-pivottable'

const { PivotData } = PivotUtilities

/**
 * Creates a multi-value aggregator that processes multiple values with different aggregators
 * Inlined here to avoid chunk import issues in bundled output
 * @param {Object} aggregatorMap - Map of value names to aggregator names
 * @param {Object} aggregators - Available aggregators
 * @param {Array} vals - Value column names
 * @returns {Function} Multi-value aggregator factory
 */
function createMultiValueAggregator(aggregatorMap, aggregators, vals) {
  return function multiValueAggregatorFactory(data, rowKey, colKey) {
    const subAggregators = {}

    // Initialize a sub-aggregator for each value
    vals.forEach(val => {
      const aggName = aggregatorMap[val] || 'Sum'
      const aggFactory = aggregators[aggName]
      if (aggFactory) {
        subAggregators[val] = aggFactory([val])(data, rowKey, colKey)
      }
    })

    return {
      push(record) {
        vals.forEach(val => {
          if (subAggregators[val]) {
            subAggregators[val].push(record)
          }
        })
      },

      value() {
        const results = {}
        vals.forEach(val => {
          if (subAggregators[val]) {
            results[val] = subAggregators[val].value()
          }
        })
        return results
      },

      valueOf(valName) {
        if (subAggregators[valName]) {
          return subAggregators[valName].value()
        }
        return null
      },

      format(values) {
        if (typeof values !== 'object') {
          return String(values ?? '')
        }
        return vals.map(val => {
          const v = values[val]
          const subAgg = subAggregators[val]
          return subAgg && subAgg.format ? subAgg.format(v) : String(v ?? '')
        }).join(' / ')
      },

      formatOf(valName, value) {
        if (subAggregators[valName] && subAggregators[valName].format) {
          return subAggregators[valName].format(value)
        }
        return String(value ?? '')
      },

      getSubAggregator(valName) {
        return subAggregators[valName] || null
      },

      numInputs: vals.length
    }
  }
}

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
 * Creates the Multi-Value Table Renderer for Vue 2
 */
export function makeMultiValueRenderer(opts = {}) {
  return {
    name: opts.name || 'vue2-multi-value-table',

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

    methods: {
      /**
       * Apply label transformation to a value
       */
      applyLabel(attr, value) {
        if (this.labels && typeof this.labels[attr] === 'function') {
          return this.labels[attr](value)
        }
        return value
      },

      /**
       * Get display label for a value column
       */
      getValueLabel(valName) {
        if (this.valueLabels && this.valueLabels[valName]) {
          return this.valueLabels[valName]
        }
        return valName
      },

      /**
       * Calculate row/col span for merged cells
       */
      spanSize(arr, i, j) {
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
      },

      /**
       * Format a single value using the appropriate aggregator
       */
      formatValue(valName, value) {
        const aggName = this.aggregatorMap[valName] || 'Sum'
        const agg = this.aggregators[aggName]
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
      },

      /**
       * Render multi-value cell content
       */
      renderMultiValueCell(h, values, rowKey, colKey) {
        if (!values || typeof values !== 'object') {
          return String(values || '')
        }

        const items = this.vals.map(val => {
          const value = values[val]
          const formatted = this.formatValue(val, value)
          const label = this.getValueLabel(val)
          const aggName = this.aggregatorMap[val] || 'Sum'

          if (this.cellLayout === 'compact') {
            return formatted
          }

          return h('div', {
            staticClass: 'multi-value-item',
            key: val,
            attrs: {
              'data-value': val,
              'data-aggregator': aggName
            }
          }, [
            this.showValueLabels
              ? h('span', {
                  staticClass: 'multi-value-label'
                }, `${label}: `)
              : null,
            h('span', {
              staticClass: 'multi-value-value'
            }, formatted)
          ])
        })

        if (this.cellLayout === 'compact') {
          return items.join(' / ')
        }

        return h('div', {
          staticClass: `multi-value-cell layout-${this.cellLayout}`
        }, items)
      },

      /**
       * Create PivotData-like structure with multi-value aggregation
       */
      createPivotData() {
        // Create multi-value aggregator
        const multiValueAgg = createMultiValueAggregator(
          this.aggregatorMap,
          this.aggregators,
          this.vals
        )

        // Build modified aggregators with our multi-value aggregator
        const modifiedAggregators = {
          ...this.aggregators,
          'Multi-Value': () => multiValueAgg
        }

        return new PivotData({
          data: this.data,
          rows: this.rows,
          cols: this.cols,
          vals: this.vals,
          aggregators: modifiedAggregators,
          aggregatorName: 'Multi-Value',
          valueFilter: this.valueFilter,
          sorters: this.sorters,
          derivedAttributes: this.derivedAttributes,
          rowOrder: this.rowOrder,
          colOrder: this.colOrder
        })
      }
    },

    render(h) {
      let pivotData
      try {
        pivotData = this.createPivotData()
      } catch (error) {
        console.error('Multi-Value Renderer Error:', error)
        return h('div', {
          staticClass: 'pvtError'
        }, `Error: ${error.message}`)
      }

      const colAttrs = pivotData.props.cols
      const rowAttrs = pivotData.props.rows
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const grandTotalAggregator = pivotData.getAggregator([], [])

      // Click handler
      const getClickHandler = (value, rowValues, colValues) => {
        if (this.tableOptions && this.tableOptions.clickCallback) {
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

      return h('table', {
        staticClass: 'pvtTable pvtMultiValueTable'
      }, [
        // THEAD
        h('thead', [
          // Column attribute headers
          colAttrs.map((c, j) => {
            return h('tr', { key: `colAttrs${j}` }, [
              // Top-left corner cell
              j === 0 && rowAttrs.length !== 0
                ? h('th', {
                    attrs: {
                      colSpan: rowAttrs.length,
                      rowSpan: colAttrs.length
                    }
                  })
                : undefined,

              // Column attribute label
              h('th', { staticClass: 'pvtAxisLabel' }, c),

              // Column keys
              colKeys.map((colKey, i) => {
                const x = this.spanSize(colKeys, i, j)
                if (x === -1) return null
                return h('th', {
                  staticClass: 'pvtColLabel',
                  attrs: {
                    key: `colKey${i}`,
                    colSpan: x,
                    rowSpan: j === colAttrs.length - 1 && rowAttrs.length !== 0 ? 2 : 1
                  }
                }, this.applyLabel(colAttrs[j], colKey[j]))
              }),

              // Totals header
              j === 0 && this.rowTotal
                ? h('th', {
                    staticClass: 'pvtTotalLabel',
                    attrs: {
                      rowSpan: colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                    }
                  }, this.localeStrings.totals)
                : undefined
            ])
          }),

          // Row attribute labels row
          rowAttrs.length !== 0
            ? h('tr', [
                rowAttrs.map((r, i) => {
                  return h('th', {
                    staticClass: 'pvtAxisLabel',
                    key: `rowAttr${i}`
                  }, r)
                }),
                this.rowTotal
                  ? h('th', { staticClass: 'pvtTotalLabel' },
                      colAttrs.length === 0 ? this.localeStrings.totals : null)
                  : (colAttrs.length === 0 ? undefined : h('th'))
              ])
            : undefined
        ]),

        // TBODY
        h('tbody', [
          // Data rows
          rowKeys.map((rowKey, i) => {
            const totalAggregator = pivotData.getAggregator(rowKey, [])
            return h('tr', { key: `rowKeyRow${i}` }, [
              // Row labels
              rowKey.map((text, j) => {
                const x = this.spanSize(rowKeys, i, j)
                if (x === -1) return null
                return h('th', {
                  staticClass: 'pvtRowLabel',
                  attrs: {
                    key: `rowKeyLabel${i}-${j}`,
                    rowSpan: x,
                    colSpan: j === rowAttrs.length - 1 && colAttrs.length !== 0 ? 2 : 1
                  }
                }, this.applyLabel(rowAttrs[j], text))
              }),

              // Data cells
              colKeys.map((colKey, j) => {
                const aggregator = pivotData.getAggregator(rowKey, colKey)
                const value = aggregator.value()
                const clickHandler = getClickHandler(value, rowKey, colKey)

                return h('td', {
                  staticClass: 'pvVal pvtMultiVal',
                  attrs: { key: `pvtVal${i}-${j}` },
                  on: clickHandler ? { click: clickHandler } : {}
                }, [this.renderMultiValueCell(h, value, rowKey, colKey)])
              }),

              // Row total
              this.rowTotal
                ? h('td', {
                    staticClass: 'pvtTotal pvtMultiVal',
                    on: getClickHandler(totalAggregator.value(), rowKey, [])
                      ? { click: getClickHandler(totalAggregator.value(), rowKey, []) }
                      : {}
                  }, [this.renderMultiValueCell(h, totalAggregator.value(), rowKey, [])])
                : undefined
            ])
          }),

          // Column totals row
          h('tr', [
            this.colTotal
              ? h('th', {
                  staticClass: 'pvtTotalLabel',
                  attrs: {
                    colSpan: rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)
                  }
                }, this.localeStrings.totals)
              : undefined,

            this.colTotal
              ? colKeys.map((colKey, i) => {
                  const totalAggregator = pivotData.getAggregator([], colKey)
                  const clickHandler = getClickHandler(totalAggregator.value(), [], colKey)
                  return h('td', {
                    staticClass: 'pvtTotal pvtMultiVal',
                    attrs: { key: `total${i}` },
                    on: clickHandler ? { click: clickHandler } : {}
                  }, [this.renderMultiValueCell(h, totalAggregator.value(), [], colKey)])
                })
              : undefined,

            this.colTotal && this.rowTotal
              ? h('td', {
                  staticClass: 'pvtGrandTotal pvtMultiVal',
                  on: getClickHandler(grandTotalAggregator.value(), [], [])
                    ? { click: getClickHandler(grandTotalAggregator.value(), [], []) }
                    : {}
                }, [this.renderMultiValueCell(h, grandTotalAggregator.value(), [], [])])
              : undefined
          ])
        ])
      ])
    }
  }
}

export default {
  'Multi-Value Table': makeMultiValueRenderer({ name: 'vue2-multi-value-table' })
}
