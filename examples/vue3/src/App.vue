<template>
  <div class="container">
    <h1>Multi-Value Renderer - Vue 3 Example</h1>
    <p>Each cell displays multiple aggregated values (Sales: Sum, Quantity: Average)</p>

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
        :vals="['sales', 'quantity']"
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
        :vals="['sales', 'quantity']"
        :aggregators="aggregators"
        :renderers="renderers"
        renderer-name="Multi-Value Table"
        :aggregator-map="aggregatorMap"
      />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
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
  { region: 'East', product: 'Apple', sales: 100, quantity: 10 },
  { region: 'East', product: 'Banana', sales: 80, quantity: 20 },
  { region: 'East', product: 'Orange', sales: 120, quantity: 15 },
  { region: 'West', product: 'Apple', sales: 150, quantity: 12 },
  { region: 'West', product: 'Banana', sales: 90, quantity: 25 },
  { region: 'West', product: 'Orange', sales: 110, quantity: 18 },
  { region: 'North', product: 'Apple', sales: 130, quantity: 14 },
  { region: 'North', product: 'Banana', sales: 70, quantity: 22 },
  { region: 'North', product: 'Orange', sales: 95, quantity: 16 },
  { region: 'South', product: 'Apple', sales: 140, quantity: 11 },
  { region: 'South', product: 'Banana', sales: 85, quantity: 19 },
  { region: 'South', product: 'Orange', sales: 105, quantity: 17 }
]

const aggregators = PivotUtilities.aggregators

const renderers = {
  ...MultiValueRenderers
}

const aggregatorMap = {
  sales: 'Sum',
  quantity: 'Average'
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
