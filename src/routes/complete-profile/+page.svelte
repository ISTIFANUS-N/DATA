<script lang="ts">
  import { goto } from '$app/navigation';
  import { updatePhone } from '$lib/stores/db';

  let phone = '';
  let error = '';

  function handleSubmit() {
    const result = updatePhone(phone);
    if (!result.ok) {
      error = result.error;
      return;
    }
    goto('/dashboard');
  }
</script>

<svelte:head><title>Complete your profile — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10">
  <div class="mx-auto w-full max-w-sm">
    <h1 class="font-display text-2xl font-bold text-fanu-700">One more thing</h1>
    <p class="mt-1 mb-6 text-sm text-ink/60">
      We need a phone number on file to process airtime, data and bill payments.
    </p>

    <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-ink/60">Phone number</span>
        <input
          type="tel"
          bind:value={phone}
          required
          placeholder="08012345678"
          pattern="0\d{10}"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
        />
      </label>

      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}

      <button
        type="submit"
        class="mt-1 rounded-xl bg-spark-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600"
      >
        Continue
      </button>
    </form>
  </div>
</div>
