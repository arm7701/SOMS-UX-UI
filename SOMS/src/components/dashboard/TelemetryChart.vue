<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/TelemetryChart.vue
 * วัตถุประสงค์: คอมโพเนนต์กราฟแสดงข้อมูลวงโคจรและค่าทางเทคนิค (Chart.js)
 * ธีมดำเทาไททาเนียม: เส้นกราฟและตัวเลขบนแกนชัดเจน ไม่กลืนกับพื้นหลัง
 * ============================================================================
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAppStore } from '@/stores/app'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, required: true },
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  unit: { type: String, default: '' },
  color: { type: String, default: '#38bdf8' },
  fillColor: { type: String, default: 'rgba(56, 189, 248, 0.15)' },
  type: { type: String, default: 'line' } // 'line' | 'bar'
})

const appStore = useAppStore()
const canvasRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!canvasRef.value) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const textColor = '#bae6fd'
  const gridColor = 'rgba(56, 189, 248, 0.15)'

  const ctx = canvasRef.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.title,
          data: props.data,
          borderColor: props.color,
          backgroundColor: props.fillColor,
          fill: props.type === 'line',
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: props.color,
          borderRadius: props.type === 'bar' ? 6 : 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#133560',
          titleColor: '#ffffff',
          bodyColor: '#e0f2fe',
          borderColor: '#235492',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context) => `${context.parsed.y !== null ? context.parsed.y : '—'} ${props.unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 12, family: 'Prompt', weight: '600' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 12, family: 'Prompt', weight: '600' } },
          title: {
            display: Boolean(props.unit),
            text: props.unit,
            color: textColor,
            font: { size: 12, family: 'Prompt', weight: '600' }
          }
        }
      }
    }
  })
}

const chartContainer = ref(null)
let resizeObserver = null

watch([() => props.data, () => props.labels], () => {
  renderChart()
})

onMounted(() => {
  renderChart()
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="w-full h-full flex flex-col p-4 bg-transparent justify-between overflow-hidden">
    <div class="flex items-center justify-between mb-2 pb-2 border-b border-space-700/60 flex-shrink-0">
      <h4 class="text-sm font-bold text-white uppercase tracking-wider font-prompt truncate">
        {{ title }}
      </h4>
      <span v-if="unit" class="text-xs font-mono text-slate-200 font-bold">
        {{ unit }}
      </span>
    </div>

    <div ref="chartContainer" class="flex-1 w-full min-h-[140px] relative">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>
