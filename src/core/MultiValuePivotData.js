/**
 * MultiValuePivotData
 *
 * Extended PivotData class that supports multiple aggregators per value.
 * Each value column can have its own aggregation function.
 */

/**
 * Creates a multi-value aggregator that processes multiple values with different aggregators
 * @param {Object} aggregatorMap - Map of value names to aggregator names
 * @param {Object} aggregators - Available aggregators
 * @param {Array} vals - Value column names
 * @returns {Function} Multi-value aggregator factory
 */
export function createMultiValueAggregator(aggregatorMap, aggregators, vals) {
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
 * Extends PivotData to use multi-value aggregation
 * @param {typeof PivotData} BasePivotData - Base PivotData class
 * @returns {typeof PivotData} Extended PivotData class
 */
export function extendPivotData(BasePivotData) {
  return class MultiValuePivotData extends BasePivotData {
    constructor(inputProps = {}) {
      const { aggregatorMap = {}, ...restProps } = inputProps

      // Store aggregatorMap before calling super
      const multiValueAgg = createMultiValueAggregator(
        aggregatorMap,
        restProps.aggregators || BasePivotData.defaultProps.aggregators,
        restProps.vals || []
      )

      // Create modified props with our multi-value aggregator
      const modifiedProps = {
        ...restProps,
        aggregators: {
          ...restProps.aggregators,
          'Multi-Value': () => multiValueAgg
        },
        aggregatorName: 'Multi-Value'
      }

      super(modifiedProps)
      this.aggregatorMap = aggregatorMap
    }
  }
}
