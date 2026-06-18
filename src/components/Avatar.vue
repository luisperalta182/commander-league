<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '?' },
  color: { type: String, default: '#8b5cf6' },
  size: { type: Number, default: 44 }
})

const initials = computed(() =>
  (props.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'
)

const style = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  fontSize: props.size * 0.38 + 'px',
  background: `linear-gradient(135deg, ${props.color}, #ffffff22)`
}))
</script>

<template>
  <div class="avatar" :style="style">{{ initials }}</div>
</template>
