<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/KpiOverviewWidget.vue
 * วัตถุประสงค์: วิดเจ็ตแสดงสถิติและสถานะภาพรวมภารกิจ 4 การ์ดยุทธการ (Modular KPI Widget)
 * รองรับการย้ายตำแหน่ง จัดเรียง และปรับขนาดร่วมกับวิดเจ็ตอื่นๆ บนแดชบอร์ดได้ 100%
 * ============================================================================
 */
import { computed } from 'vue'
import { Orbit, Activity, ShieldCheck } from 'lucide-vue-next'
import StatCard from '@/components/common/StatCard.vue'

const props = defineProps({
  dashboardData: {
    type: Object,
    default: () => ({
      satellites: [],
      passes: [],
      weather: null,
      operations: []
    })
  }
})

const activeSatsCount = computed(() => {
  return props.dashboardData.satellites?.length || 2
})

const passesTodayCount = computed(() => {
  return props.dashboardData.passes?.length || 4
})

const weatherScale = computed(() => {
  return props.dashboardData.weather ? `R${props.dashboardData.weather.spaceweather_r || 0}` : 'R1'
})
</script>

<template>
  <div class="h-full flex flex-col justify-center">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 h-full">
      <StatCard
        title="ดาวเทียมในวงโคจร"
        :value="activeSatsCount"
        unit="ดวง"
        subtitle="NAPA-1 N / NAPA-2 N"
        :icon="Orbit"
        color="slate"
        badge="ONLINE"
        badge-type="success"
        :items="['NAPA-1 N (495.2 km)', 'NAPA-2 N (508.8 km)', 'สถานะ: ปกติ 100%']"
        class="h-full"
      />
      <StatCard
        title="พาสดาวเทียมวันนี้"
        :value="passesTodayCount"
        unit="รอบ"
        subtitle="Day & Night Passes"
        :icon="Activity"
        color="slate"
        badge="SCHEDULED"
        badge-type="info"
        :items="['พาสถัดไป: NAPA-2 N (82.5° El)', 'AOS: 06:10 UTC', 'BMA Ground Station']"
        class="h-full"
      />
      <StatCard
        title="สภาพอวกาศล่าสุด"
        :value="weatherScale"
        subtitle="NOAA Scale (Radio)"
        :icon="ShieldCheck"
        color="amber"
        badge="MONITORING"
        badge-type="warning"
        :items="['Radio: R1 (Minor)', 'Geomagnetic: G0', 'Solar Radiation: S0', 'Kp: 2.3']"
        class="h-full"
      />
      <StatCard
        title="เวรปฏิบัติการ"
        value="ACTIVE"
        subtitle="MD / FMO / GSO ประจำสถานี"
        :icon="ShieldCheck"
        color="emerald"
        badge="ON DUTY"
        badge-type="success"
        :items="['ชุดปฏิบัติการที่ 1 (Day Shift)', 'MD: น.ต. สมชาย', 'FMO: ร.อ. ธีระศักดิ์', 'GSO: ร.ท. อนันต์']"
        class="h-full"
      />
    </div>
  </div>
</template>
