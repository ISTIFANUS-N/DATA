<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, loginWithGoogleMock } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  function handleSubmit() {
    error = '';
    loading = true;
    const result = login(email, password);
    loading = false;

    if (!result.ok) {
      error = result.error;
      return;
    }
    goto('/dashboard');
  }

  function handleGoogle() {
    loginWithGoogleMock();
    showToast('Signed in with Google');
    goto('/dashboard');
  }
</script>

<svelte:head><title>Sign in — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10">
  <div class="mx-auto w-full max-w-sm">
    <div class="mb-8 text-center">
      <img src="/stefanx-logo.jpg" alt="Stefanx Data & Services" class="mx-auto mb-4 h-12 w-auto" />
      <h1 class="font-display text-2xl font-bold text-fanu-700">Welcome back</h1>
      <p class="mt-1 text-sm text-ink/60">
        New here?
        <a href="/register" class="font-medium text-spark-600 underline-offset-2 hover:underline">Create an account</a>
      </p>
    </div>

    <button
      type="button"
      on:click={handleGoogle}
      class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-fanu-100 bg-white py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-fanu-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.9-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5c-7.8 0-14.5 4.5-17.7 11.2z"/><path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6c-2 1.5-4.6 2.5-7.6 2.5-5.3 0-9.7-3.1-11.4-7.5l-6.6 5.1C9.4 39.9 16.1 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.7 6l6.6 5.6C41.2 36.6 44.5 30.8 44.5 24c0-1.2-.1-2.4-.9-3.5z"/></svg>
      Continue with Google
    </button>

    <div class="mb-4 flex items-center gap-3 text-xs text-ink/40">
      <div class="h-px flex-1 bg-fanu-100"></div>
      or sign in with email
      <div class="h-px flex-1 bg-fanu-100"></div>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-ink/60">Email</span>
        <input
          type="email"
          bind:value={email}
          required
          placeholder="you@example.com"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-ink/60">Password</span>
        <input
          type="password"
          bind:value={password}
          required
          placeholder="••••••••"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
        />
      </label>

      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="mt-1 rounded-xl bg-spark-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>

    <p class="mt-6 text-center text-[11px] text-ink/40">
      Running in demo mode — accounts and balances are stored on this device only.
    </p>
  </div>
</div>
