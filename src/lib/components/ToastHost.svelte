<script lang="ts">
  import { toasts } from '$lib/stores/toast';
</script>

<div class="pointer-events-none fixed top-3 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
  {#each $toasts as toast (toast.id)}
    <div
      class="pointer-events-auto w-full max-w-md rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
      class:bg-fanu-600={toast.kind === 'success'}
      class:bg-red-600={toast.kind === 'error'}
    >
      {toast.message}
    </div>
  {/each}
</div>
