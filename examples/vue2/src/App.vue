<template>
  <div class="container">
    <h1>Multi-Value Renderer - Vue 2 Example</h1>
    <p>Each cell displays multiple aggregated values with configurable aggregators</p>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="pivot-container" v-if="activeTab === 'table'">
      <h2>Multi-Value Table</h2>
      <p class="description">Direct pivot table rendering with multi-value cells</p>
      <MultiValueTable
        :data="data"
        :rows="['region']"
        :cols="['product']"
        :vals="vals"
        :aggregators="aggregators"
        :aggregator-map="aggregatorMap"
      />
    </div>

    <div class="pivot-container" v-if="activeTab === 'ui'">
      <h2>VuePivottableUi</h2>
      <p class="description">Interactive pivot table with drag-and-drop configuration</p>

      <VuePivottableUi
        :data="data"
        :rows="['region']"
        :cols="['product']"
        :vals="vals"
        :aggregators="aggregators"
        :renderers="renderers"
        renderer-name="Multi-Value Table"
        :aggregator-map="aggregatorMap"
      >
        <template v-slot:aggregatorCell>
          <div class="aggregator-settings">
            <div class="value-row" v-for="(val, index) in vals" :key="val">
              <!-- Primary field selector -->
              <select class="value-select" :value="val" @change="updateVal(index, $event.target.value)">
                <option v-for="attr in numericAttributes" :key="attr" :value="attr">{{ attr }}</option>
              </select>

              <!-- Aggregator selector -->
              <select
                class="agg-select"
                :value="getAggregatorName(val)"
                @change="updateAggregator(val, $event.target.value)"
              >
                <option v-for="agg in aggregatorNames" :key="agg" :value="agg">{{ agg }}</option>
              </select>

              <!-- Second field selector for 2-input aggregators -->
              <template v-if="isMultiInputAggregator(getAggregatorName(val))">
                <span class="field-separator">/</span>
                <select
                  class="value-select field2-select"
                  :value="getSecondField(val)"
                  @change="updateSecondField(val, $event.target.value)"
                >
                  <option v-for="attr in numericAttributes" :key="attr" :value="attr">{{ attr }}</option>
                </select>
              </template>

              <button class="remove-btn" @click="removeVal(index)" v-if="vals.length > 1">×</button>
            </div>
            <button class="add-btn" @click="addVal" v-if="vals.length < numericAttributes.length">+ Add Value</button>
          </div>
        </template>
      </VuePivottableUi>
    </div>

  </div>
</template>

<script>
import { VuePivottableUi, PivotUtilities } from 'vue-pivottable'
import { MultiValueRenderers, getAggregatorNumInputs } from '@vue-pivottable/multi-value-renderer/vue2'
import 'vue-pivottable/dist/vue-pivottable.css'
import '@vue-pivottable/multi-value-renderer/styles.css'

export default {
  name: 'App',
  components: {
    VuePivottableUi,
    MultiValueTable: MultiValueRenderers['Multi-Value Table']
  },
  data() {
    return {
      activeTab: 'table',
      tabs: [
        { id: 'table', label: 'PivotTable' },
        { id: 'ui', label: 'PivotTable UI' }
      ],
      vals: ['sales', 'quantity', 'profit'],
      data: [
        { region: 'East', product: 'Apple', sales: 100, quantity: 10, profit: 30 },
        { region: 'East', product: 'Banana', sales: 80, quantity: 20, profit: 25 },
        { region: 'East', product: 'Orange', sales: 120, quantity: 15, profit: 40 },
        { region: 'West', product: 'Apple', sales: 150, quantity: 12, profit: 45 },
        { region: 'West', product: 'Banana', sales: 90, quantity: 25, profit: 28 },
        { region: 'West', product: 'Orange', sales: 110, quantity: 18, profit: 35 },
        { region: 'North', product: 'Apple', sales: 130, quantity: 14, profit: 38 },
        { region: 'North', product: 'Banana', sales: 70, quantity: 22, profit: 20 },
        { region: 'North', product: 'Orange', sales: 95, quantity: 16, profit: 30 },
        { region: 'South', product: 'Apple', sales: 140, quantity: 11, profit: 42 },
        { region: 'South', product: 'Banana', sales: 85, quantity: 19, profit: 26 },
        { region: 'South', product: 'Orange', sales: 105, quantity: 17, profit: 33 }
      ],
      aggregators: PivotUtilities.aggregators,
      renderers: MultiValueRenderers,
      aggregatorMap: {
        sales: { aggregator: 'Sum', fields: ['sales'] },
        quantity: { aggregator: 'Average', fields: ['quantity'] },
        profit: { aggregator: 'Sum', fields: ['profit'] }
      },
      aggregatorNumInputsCache: {}
    }
  },
  computed: {
    aggregatorNames() {
      return Object.keys(this.aggregators)
    },
    numericAttributes() {
      if (this.data.length === 0) return []
      return Object.keys(this.data[0]).filter(key => typeof this.data[0][key] === 'number')
    }
  },
  created() {
    // Build cache for aggregator numInputs
    for (const [name, factory] of Object.entries(this.aggregators)) {
      this.aggregatorNumInputsCache[name] = getAggregatorNumInputs(factory)
    }
  },
  methods: {
    isMultiInputAggregator(aggName) {
      return (this.aggregatorNumInputsCache[aggName] || 0) >= 2
    },
    getAggregatorName(val) {
      const config = this.aggregatorMap[val]
      if (typeof config === 'object' && config !== null) {
        return config.aggregator || 'Sum'
      }
      return config || 'Sum'
    },
    getSecondField(val) {
      const config = this.aggregatorMap[val]
      if (typeof config === 'object' && config !== null && config.fields) {
        return config.fields[1] || this.numericAttributes[0] || ''
      }
      return this.numericAttributes.find(attr => attr !== val) || this.numericAttributes[0] || ''
    },
    addVal() {
      const available = this.numericAttributes.find(attr => !this.vals.includes(attr))
      if (available) {
        this.vals = [...this.vals, available]
        if (!this.aggregatorMap[available]) {
          this.aggregatorMap = { ...this.aggregatorMap, [available]: { aggregator: 'Sum', fields: [available] } }
        }
      }
    },
    removeVal(index) {
      const newVals = [...this.vals]
      newVals.splice(index, 1)
      this.vals = newVals
    },
    updateVal(index, newVal) {
      const newVals = [...this.vals]
      const oldVal = newVals[index]
      newVals[index] = newVal
      this.vals = newVals

      if (!this.aggregatorMap[newVal] && this.aggregatorMap[oldVal]) {
        const oldConfig = this.aggregatorMap[oldVal]
        if (typeof oldConfig === 'object' && oldConfig !== null) {
          this.aggregatorMap = {
            ...this.aggregatorMap,
            [newVal]: {
              aggregator: oldConfig.aggregator,
              fields: [newVal, oldConfig.fields[1]]
            }
          }
        } else {
          this.aggregatorMap = { ...this.aggregatorMap, [newVal]: oldConfig }
        }
      }
    },
    updateAggregator(val, aggName) {
      const isMultiInput = this.isMultiInputAggregator(aggName)
      // Get first field from existing config or use val
      const existingConfig = this.aggregatorMap[val]
      const firstField = (typeof existingConfig === 'object' && existingConfig !== null && existingConfig.fields)
        ? existingConfig.fields[0]
        : val

      if (isMultiInput) {
        const secondField = this.numericAttributes.find(attr => attr !== firstField) || this.numericAttributes[0] || ''
        this.aggregatorMap = {
          ...this.aggregatorMap,
          [val]: {
            aggregator: aggName,
            fields: [firstField, secondField]
          }
        }
      } else {
        this.aggregatorMap = {
          ...this.aggregatorMap,
          [val]: {
            aggregator: aggName,
            fields: [firstField]
          }
        }
      }
    },
    updateSecondField(val, secondField) {
      const config = this.aggregatorMap[val]
      if (typeof config === 'object' && config !== null) {
        this.aggregatorMap = {
          ...this.aggregatorMap,
          [val]: {
            aggregator: config.aggregator,
            fields: [config.fields[0] || val, secondField]
          }
        }
      }
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #1a1a2e;
  margin-bottom: 8px;
  font-size: 1.8em;
}

h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 1.2em;
}

h3 {
  color: #555;
  margin-bottom: 10px;
  font-size: 1em;
}

p {
  color: #666;
  margin-bottom: 20px;
}

.description {
  font-size: 0.9em;
  color: #888;
  margin-bottom: 15px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tabs button {
  padding: 12px 24px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  color: #555;
}

.tabs button:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

.tabs button.active {
  background: #4a90d9;
  color: white;
  border-color: #4a90d9;
}

.pivot-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.aggregator-settings {
  font-family: Verdana, sans-serif;
  color: #2a3f5f;
  padding: 5px;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.value-select,
.agg-select {
  padding: 3px 6px;
  border: 1px solid #a2b1c6;
  border-radius: 5px;
  font-size: 12px;
  background: #fff;
  color: #2a3f5f;
  cursor: pointer;
}

.value-select {
  min-width: 80px;
}

.agg-select {
  min-width: 100px;
}

.field-separator {
  font-weight: bold;
  color: #506784;
  padding: 0 2px;
}

.field2-select {
  background: #f0f4f8;
}

.value-select:hover,
.agg-select:hover {
  border-color: #506784;
}

.value-select:focus,
.agg-select:focus {
  outline: none;
  border-color: #119dff;
}

.remove-btn {
  background: none;
  border: 1px solid #c8d4e3;
  border-radius: 3px;
  color: #506784;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 2px 6px;
}

.remove-btn:hover {
  background: #ebf0f8;
  border-color: #a2b1c6;
}

.add-btn {
  background: #fff;
  border: 1px solid #a2b1c6;
  border-radius: 5px;
  color: #506784;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  margin-top: 2px;
}

.add-btn:hover {
  background: #ebf0f8;
  border-color: #506784;
}

/* Responsive */
@media (max-width: 768px) {
  h1 {
    font-size: 1.4em;
  }

  .tabs button {
    padding: 10px 16px;
    font-size: 13px;
  }

  .pivot-container {
    padding: 15px;
  }
}
</style>
