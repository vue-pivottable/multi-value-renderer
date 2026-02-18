<template>
  <div class="container">
    <h1>Multi-Value Renderer - Vue 3 Example</h1>
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
      <h2>VuePivottable</h2>
      <p class="description">Direct pivot table rendering with multi-value cells</p>
      <VuePivottable
        :data="data"
        :rows="['region']"
        :cols="['product']"
        :vals="vals"
        :aggregators="aggregators"
        :renderers="renderers"
        renderer-name="Multi-Value Table"
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
        <template #aggregatorExtra>
          <div class="aggregator-settings">
            <div class="settings-label">Aggregator per Value:</div>
            <div class="settings-grid">
              <div v-for="val in vals" :key="val" class="setting-item">
                <label>{{ val }}:</label>
                <select v-model="aggregatorMap[val]">
                  <option v-for="agg in aggregatorNames" :key="agg" :value="agg">{{ agg }}</option>
                </select>
              </div>
            </div>
          </div>
        </template>
      </VuePivottableUi>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { VuePivottable, VuePivottableUi, PivotUtilities } from 'vue-pivottable'
import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue3'
import 'vue-pivottable/dist/vue-pivottable.css'
import '@vue-pivottable/multi-value-renderer/styles.css'

const activeTab = ref('table')

const tabs = [
  { id: 'table', label: 'PivotTable' },
  { id: 'ui', label: 'PivotTable UI' }
]

const data = [
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
]

const vals = ['sales', 'quantity', 'profit']

const aggregators = PivotUtilities.aggregators

const aggregatorNames = computed(() => Object.keys(aggregators))

const renderers = {
  ...MultiValueRenderers
}

const aggregatorMap = reactive({
  sales: 'Sum',
  quantity: 'Average',
  profit: 'Sum'
})
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
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.settings-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.setting-item label {
  font-size: 11px;
  font-weight: 500;
  color: #555;
  min-width: 50px;
}

.setting-item select {
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 11px;
  background: #fff;
  cursor: pointer;
}

.setting-item select:hover {
  border-color: #4a90d9;
}

.setting-item select:focus {
  outline: none;
  border-color: #4a90d9;
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
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
