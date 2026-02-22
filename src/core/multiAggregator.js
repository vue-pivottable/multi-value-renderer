/**
 * Multi-Value Aggregator
 *
 * Allows different aggregation functions for each value column.
 * Supports both single-input and multi-input aggregators.
 *
 * @example
 * // Single-input aggregators (string format)
 * const aggregatorMap = {
 *   sales: 'Sum',
 *   quantity: 'Average',
 *   count: 'Count'
 * }
 *
 * // Multi-input aggregators (object format)
 * const aggregatorMap = {
 *   sales: 'Sum',
 *   unit_price: { aggregator: 'Sum over Sum', fields: ['sales', 'quantity'] }
 * }
 */

/**
 * Gets the number of inputs required by an aggregator
 * @param {Function} aggFactory - Aggregator factory function
 * @returns {number} Number of inputs required
 */
export function getAggregatorNumInputs(aggFactory) {
  try {
    const instance = aggFactory([])()
    return instance.numInputs || 0
  } catch {
    return 1
  }
}

/**
 * Creates a multi-value aggregator factory
 * @param {Object} aggregatorMap - Map of value names to aggregator configs
 *   - string: aggregator name for single-input (e.g., 'Sum')
 *   - object: { aggregator: string, fields: string[] } for multi-input
 * @param {Object} aggregators - Available aggregators from PivotUtilities
 * @returns {Function} Aggregator factory function
 */
export function createMultiAggregator(aggregatorMap, aggregators) {
  const defaultAggregator = 'Sum'

  return function multiAggregatorFactory(vals) {
    return function (data, rowKey, colKey) {
      const subAggregators = {}
      const results = {}

      // Initialize sub-aggregators for each value
      vals.forEach(val => {
        const aggConfig = aggregatorMap[val]
        let aggName, aggFields

        if (typeof aggConfig === 'object' && aggConfig !== null) {
          // Multi-input aggregator: { aggregator: 'Sum over Sum', fields: ['sales', 'quantity'] }
          aggName = aggConfig.aggregator || defaultAggregator
          aggFields = aggConfig.fields || [val]
        } else {
          // Single-input aggregator: 'Sum'
          aggName = aggConfig || defaultAggregator
          aggFields = [val]
        }

        const aggFactory = aggregators[aggName]
        if (aggFactory) {
          // Pass fields as array - vue-pivottable aggregators expect array destructuring
          subAggregators[val] = aggFactory(aggFields)(data, rowKey, colKey)
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
          vals.forEach(val => {
            if (subAggregators[val]) {
              results[val] = subAggregators[val].value()
            }
          })
          return results
        },

        format(values) {
          if (typeof values !== 'object') {
            return String(values)
          }
          return vals.map(val => {
            const subAgg = subAggregators[val]
            const v = values[val]
            return subAgg && subAgg.format ? subAgg.format(v) : String(v)
          }).join(' / ')
        },

        // For individual value access
        valueOf(valName) {
          if (subAggregators[valName]) {
            return subAggregators[valName].value()
          }
          return null
        },

        formatOf(valName, value) {
          if (subAggregators[valName] && subAggregators[valName].format) {
            return subAggregators[valName].format(value)
          }
          return String(value)
        },

        numInputs: vals.length
      }
    }
  }
}

/**
 * Default color scale generator for heatmap
 * @param {Array} values - Array of numeric values
 * @returns {Function} Color scale function
 */
export function defaultColorScaleGenerator(values) {
  const min = Math.min(...values.filter(v => typeof v === 'number'))
  const max = Math.max(...values.filter(v => typeof v === 'number'))

  return value => {
    if (typeof value !== 'number' || max === min) {
      return { backgroundColor: 'white' }
    }
    const ratio = (value - min) / (max - min)
    const nonRed = 255 - Math.round(255 * ratio)
    return { backgroundColor: `rgb(255,${nonRed},${nonRed})` }
  }
}

/**
 * Validates aggregator map configuration
 * @param {Object} aggregatorMap - Map of value names to aggregator names
 * @param {Object} aggregators - Available aggregators
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateAggregatorMap(aggregatorMap, aggregators) {
  const errors = []
  const availableAggregators = Object.keys(aggregators)

  Object.entries(aggregatorMap).forEach(([val, aggName]) => {
    if (!aggregators[aggName]) {
      errors.push(
        `Unknown aggregator '${aggName}' for value '${val}'. ` +
        `Available: ${availableAggregators.join(', ')}`
      )
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
