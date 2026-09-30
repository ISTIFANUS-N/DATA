<script lang="ts">
  export let reason = 'This service is temporarily unavailable. Please try again later.';
  export let label = 'Service';
</script>

<div class="flex flex-col items-center px-6 py-16 text-center">
  <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl">🔧</div>
  <p class="font-display text-base font-bold text-ink">{label} unavailable</p>
  <p class="mt-2 max-w-xs text-sm text-ink/55">{reason}</p>
  <p class="mt-4 text-xs text-ink/35">Contact support: stefansservice@gmail.com</p>
</div>
