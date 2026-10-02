<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { showToast } from '$lib/stores/toast';

  let password = '';
  let confirm = '';
  let loading = false;
  let error = '';

  async function handleReset() {
    error = '';
    if (password.length < 6) {
      error = 'Password must be at least 6 characters.'; return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match.'; return;
    }
    loading = true;
    const { error: err } = await supabase.auth.updateUser({ password });
    loading = false;
    if (err) { error = err.message; return; }
    showToast('Password updated — please sign in');
    goto('/login');
  }
</script>

<svelte:head><title>Reset password — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10">
  <div class="mx-auto w-full max-w-sm">
    <div class="mb-8 text-center">
      <img src="/stefanx-logo.jpg" alt="Stefanx" class="mx-auto mb-4 h-14 w-auto rounded-xl" />
      <h1 class="font-display text-2xl font-bold text-fanu-700">Set new password</h1>
      <p class="mt-1 text-sm text-ink/55">Choose a strong password for your account</p>
    </div>

    <form on:submit|preventDefault={handleReset} class="flex flex-col gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-ink/60">New password</span>
        <input type="password" bind:value={password} required placeholder="••••••••" minlength="6"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-ink/60">Confirm new password</span>
        <input type="password" bind:value={confirm} required placeholder="••••••••"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
      </label>

      {#if error}
        <div class="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>
      {/if}

      <button type="submit" disabled={loading}
        class="mt-1 rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700 disabled:opacity-60">
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  </div>
</div>
