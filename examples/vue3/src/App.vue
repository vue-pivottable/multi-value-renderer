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
        <template #aggregatorCell>
          <div class="aggregator-settings">
            <div class="value-tags">
              <span
                v-for="(val, index) in vals"
                :key="val"
                class="value-tag"
                @click="openEditModal(index)"
              >
                {{ getValueLabel(val) }}
                <button class="tag-remove" @click.stop="removeVal(index)" v-if="vals.length > 1">×</button>
              </span>
              <button class="add-tag" @click="openAddModal">+</button>
            </div>
          </div>
        </template>
      </VuePivottableUi>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Value' : 'Add Value' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Aggregator</label>
            <select v-model="modalData.aggregator" class="form-select" @change="onAggregatorChange">
              <option v-for="agg in aggregatorNames" :key="agg" :value="agg">{{ agg }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ isModalMultiInput ? 'First Field (numerator)' : 'Field' }}</label>
            <select v-model="modalData.field" class="form-select">
              <option v-for="attr in numericAttributes" :key="attr" :value="attr">{{ attr }}</option>
            </select>
          </div>
          <div v-if="isModalMultiInput" class="form-group">
            <label>Second Field (denominator)</label>
            <select v-model="modalData.field2" class="form-select">
              <option v-for="attr in numericAttributes" :key="attr" :value="attr">{{ attr }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveModal">{{ isEditMode ? 'Save' : 'Add' }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VuePivottableUi, PivotUtilities } from 'vue-pivottable'
import { MultiValueRenderers, getAggregatorNumInputs } from '@vue-pivottable/multi-value-renderer/vue3'
import 'vue-pivottable/dist/vue-pivottable.css'
import '@vue-pivottable/multi-value-renderer/styles.css'

// Use renderer directly for table tab
const MultiValueTable = MultiValueRenderers['Multi-Value Table']

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

// Numeric attributes for aggregation
const numericAttributes = computed(() => {
  if (data.length === 0) return []
  return Object.keys(data[0]).filter(key => typeof data[0][key] === 'number')
})

const vals = ref(['sales', 'quantity', 'profit'])

const aggregators = PivotUtilities.aggregators
const aggregatorNames = computed(() => Object.keys(aggregators))

// Cache for aggregator numInputs
const aggregatorNumInputsCache = computed(() => {
  const cache = {}
  for (const [name, factory] of Object.entries(aggregators)) {
    cache[name] = getAggregatorNumInputs(factory)
  }
  return cache
})

function isMultiInputAggregator(aggName) {
  return (aggregatorNumInputsCache.value[aggName] || 0) >= 2
}

const renderers = {
  ...MultiValueRenderers
}

const aggregatorMap = ref({
  sales: { aggregator: 'Sum', fields: ['sales'] },
  quantity: { aggregator: 'Average', fields: ['quantity'] },
  profit: { aggregator: 'Sum', fields: ['profit'] }
})

// Modal state
const showModal = ref(false)
const isEditMode = ref(false)
const editIndex = ref(-1)
const modalData = ref({
  field: '',
  aggregator: 'Sum',
  field2: ''
})

const isModalMultiInput = computed(() => isMultiInputAggregator(modalData.value.aggregator))

// Get display label for value tag
function getValueLabel(val) {
  const config = aggregatorMap.value[val]
  if (typeof config === 'object' && config !== null) {
    if (config.fields && config.fields.length >= 2) {
      return `${config.fields[0]}/${config.fields[1]} (${config.aggregator})`
    }
    return `${config.fields?.[0] || val} (${config.aggregator})`
  }
  return `${val} (${config || 'Sum'})`
}

function openAddModal() {
  isEditMode.value = false
  editIndex.value = -1
  modalData.value = {
    field: numericAttributes.value.find(attr => !vals.value.includes(attr)) || numericAttributes.value[0] || '',
    aggregator: 'Sum',
    field2: numericAttributes.value[1] || numericAttributes.value[0] || ''
  }
  showModal.value = true
}

function openEditModal(index) {
  isEditMode.value = true
  editIndex.value = index
  const val = vals.value[index]
  const config = aggregatorMap.value[val]

  if (typeof config === 'object' && config !== null) {
    modalData.value = {
      field: config.fields[0] || val,
      aggregator: config.aggregator || 'Sum',
      field2: config.fields[1] || ''
    }
  } else {
    modalData.value = {
      field: val,
      aggregator: config || 'Sum',
      field2: numericAttributes.value.find(attr => attr !== val) || ''
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function onAggregatorChange() {
  // Set default second field when switching to multi-input
  if (isModalMultiInput.value && !modalData.value.field2) {
    modalData.value.field2 = numericAttributes.value.find(attr => attr !== modalData.value.field) || ''
  }
}

function saveModal() {
  const { field, aggregator, field2 } = modalData.value
  const isMulti = isMultiInputAggregator(aggregator)

  // Generate unique key for this value entry
  let valKey = field
  if (isMulti) {
    valKey = `${field}_${field2}_ratio`
  }

  // For edit mode, remove old entry first
  if (isEditMode.value && editIndex.value >= 0) {
    const oldVal = vals.value[editIndex.value]
    const newVals = [...vals.value]
    newVals[editIndex.value] = valKey
    vals.value = newVals

    // Remove old aggregatorMap entry if key changed
    if (oldVal !== valKey) {
      const newMap = { ...aggregatorMap.value }
      delete newMap[oldVal]
      aggregatorMap.value = newMap
    }
  } else {
    // Add mode - check for duplicates
    if (vals.value.includes(valKey)) {
      let counter = 1
      while (vals.value.includes(`${valKey}_${counter}`)) {
        counter++
      }
      valKey = `${valKey}_${counter}`
    }
    vals.value = [...vals.value, valKey]
  }

  // Set aggregatorMap entry - always use object format to preserve field info
  if (isMulti) {
    aggregatorMap.value = {
      ...aggregatorMap.value,
      [valKey]: {
        aggregator,
        fields: [field, field2]
      }
    }
  } else {
    aggregatorMap.value = {
      ...aggregatorMap.value,
      [valKey]: {
        aggregator,
        fields: [field]
      }
    }
  }

  closeModal()
}

function removeVal(index) {
  const val = vals.value[index]
  const newVals = [...vals.value]
  newVals.splice(index, 1)
  vals.value = newVals

  // Clean up aggregatorMap
  const newMap = { ...aggregatorMap.value }
  delete newMap[val]
  aggregatorMap.value = newMap
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

/* Aggregator Settings - Tag Style */
.aggregator-settings {
  padding: 5px;
}

.value-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.value-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #e8f0fe;
  border: 1px solid #a8c7fa;
  border-radius: 4px;
  font-size: 11px;
  color: #1967d2;
  cursor: pointer;
  transition: all 0.2s;
}

.value-tag:hover {
  background: #d2e3fc;
  border-color: #7cacf8;
}

.tag-remove {
  background: none;
  border: none;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.tag-remove:hover {
  color: #d93025;
}

.add-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #fff;
  border: 1px dashed #a8c7fa;
  border-radius: 4px;
  font-size: 16px;
  color: #1967d2;
  cursor: pointer;
}

.add-tag:hover {
  background: #e8f0fe;
  border-style: solid;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #4a90d9;
  color: white;
}

.btn-primary:hover {
  background: #3a7bc8;
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
