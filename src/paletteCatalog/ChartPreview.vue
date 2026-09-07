<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import { values } from './types'
use([BarChart, PieChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer, SVGRenderer])
const props = defineProps<{colors: string[]; background: string; compact?: boolean; renderer: 'canvas'|'svg'; count: number; id: string}>()
const option = computed<EChartsOption>(() => {
  const dark = props.background !== '#FFFFFF'
  const ink = dark ? '#D5D8DE' : '#535760'
  const data = values.slice(0, props.count).map((value, index) => ({
    name: String(index + 1).padStart(2,'0'), value,
    // Category = table row. The eleventh category repeats the first color.
    itemStyle: {color: props.colors[index % 10], opacity: 1},
  }))
  return {
    animation: false, backgroundColor: props.background,
    aria: { enabled: true, description: `${props.id}. Столбцы и кольцо. ${data.map(d=>`Категория ${d.name}: ${d.value}`).join('; ')}` },
    tooltip: { trigger: 'item', confine: true, renderMode: 'richText' },
    grid: {left: props.compact ? 10 : 30, top: props.compact ? 8 : 22, right: '38%', bottom: 26},
    xAxis: {type:'category',data:data.map(d=>d.name),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:ink,fontSize:props.compact?9:10,interval:0}},
    yAxis: {type:'value',min:0,max:100,interval:50,axisLabel:{show:!props.compact,color:ink,fontSize:10},splitLine:{show:true,lineStyle:{color:dark?'#262A30':'#E9EAEC'}},axisLine:{show:false}},
    series: [
      {type:'bar',data,barWidth:'66%',emphasis:{disabled:true}},
      {type:'pie',data,left:'65%',right:'2%',center:['50%','49%'],radius:props.compact?['39%','70%']:['42%','72%'],startAngle:90,clockwise:true,padAngle:0,avoidLabelOverlap:false,label:{show:false},labelLine:{show:false},itemStyle:{borderWidth:0,opacity:1},emphasis:{disabled:true},selectedMode:false},
    ],
  }
})
</script>
<template>
  <VChart :key="renderer" class="chart-preview" :class="{compact}" :option="option" :init-options="{renderer}" autoresize />
</template>
