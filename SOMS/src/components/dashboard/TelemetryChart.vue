<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/TelemetryChart.vue
 * วัตถุประสงค์: คอมโพเนนต์กราฟแสดงข้อมูลวงโคจรและค่าทางเทคนิค (Chart.js)
 * ปรับสีเส้นแกนและตัวหนังสืออัตโนมัติตามธีม Light/Dark Mode อย่างสบายตา
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
  color: { type: String, default: '#2563eb' },
  fillColor: { type: String, default: 'rgba(37, 99, 235, 0.08)' },
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

  const isDark = appStore.isDark
  const textColor = isDark ? '#bae6fd' : '#1e293b'
  const gridColor = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(226, 232, 240, 0.8)'

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
          backgroundColor: isDark ? '#061324' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          borderColor: isDark ? '#38bdf8' : '#cbd5e1',
          borderWidth: 1.5,
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
          ticks: { color: textColor, font: { size: 12, weight: 'bold' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 12, weight: 'bold' } },
          title: {
            display: Boolean(props.unit),
            text: props.unit,
            color: textColor,
            font: { size: 12, weight: 'bold' }
          }
        }
      }
    }
  })
}

watch([() => props.data, () => props.labels, () => appStore.isDark], () => {
  renderChart()
})

let chartResizeObserver = null
const containerRef = ref(null)

onMounted(() => {
  renderChart()
  if (window.ResizeObserver && containerRef.value) {
    chartResizeObserver = new ResizeObserver(() => {
      if (chartInstance) {
        chartInstance.resize()
      }
    })
    chartResizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (chartResizeObserver) chartResizeObserver.disconnect()
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="h-full w-full flex flex-col justify-between p-3.5 bg-transparent font-prompt text-slate-200">
    <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-sky-500/30 shrink-0">
      <h4 class="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-prompt truncate pr-2">
        {{ title }}
      </h4>
      <span v-if="unit" class="text-xs font-mono font-bold text-cyan-200 shrink-0 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/40">
        {{ unit }}
      </span>
    </div>

    <div ref="containerRef" class="flex-1 min-h-[100px] w-full relative">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>
