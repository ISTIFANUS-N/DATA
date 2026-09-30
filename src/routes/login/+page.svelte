<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/db';
  import { supabase } from '$lib/supabase';
  import { showToast } from '$lib/stores/toast';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  // Forgot password
  let forgotMode = false;
  let resetEmail = '';
  let resetSent = false;
  let resetLoading = false;

  async function handleSubmit() {
    error = ''; loading = true;
    const result = await login(email, password);
    loading = false;
    if (!result.ok) { error = result.error; return; }
    goto('/dashboard');
  }

  async function handleForgotPassword() {
    if (!resetEmail || !resetEmail.includes('@')) {
      showToast('Enter a valid email address', 'error'); return;
    }
    resetLoading = true;
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo
    });
    resetLoading = false;
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many')) {
        showToast('Too many requests — wait a few minutes and try again', 'error');
      } else {
        showToast(err.message, 'error');
      }
      return;
    }
    resetSent = true;
  }
</script>

<svelte:head><title>Sign in — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10 bg-paper">
  <div class="mx-auto w-full max-w-sm">

    <!-- Logo + heading -->
    <div class="mb-8 text-center">
      <img src="/stefanx-logo.jpg" alt="Stefanx Data Services"
        class="mx-auto mb-4 h-14 w-auto rounded-xl" />
      <h1 class="font-display text-2xl font-bold text-fanu-700">
        {forgotMode ? 'Reset password' : 'Welcome back'}
      </h1>
      <p class="mt-1 text-sm text-ink/55">
        {forgotMode ? "We'll send a reset link to your email" : 'Sign in to your Stefanx account'}
      </p>
    </div>

    <!-- ── SIGN IN FORM ── -->
    {#if !forgotMode}
      <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-ink/60">Email</span>
          <input type="email" bind:value={email} required placeholder="you@example.com"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink/60">Password</span>
            <button type="button" on:click={() => { forgotMode = true; resetEmail = email; }}
              class="text-xs font-medium text-fanu-700 hover:underline">
              Forgot password?
            </button>
          </div>
          <input type="password" bind:value={password} required placeholder="••••••••"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        {#if error}
          <div class="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>
        {/if}

        <button type="submit" disabled={loading}
          class="mt-1 rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <!-- Register link — prominent card -->
      <div class="mt-6 rounded-2xl border border-fanu-100 bg-white px-5 py-4 text-center shadow-sm">
        <p class="text-sm text-ink/60">Don't have an account?</p>
        <a href="/register"
          class="mt-1.5 inline-block w-full rounded-xl border-2 border-fanu-600 py-3 text-sm font-bold text-fanu-700 transition hover:bg-fanu-50">
          Create an account
        </a>
      </div>

    <!-- ── FORGOT PASSWORD FORM ── -->
    {:else if !resetSent}
      <form on:submit|preventDefault={handleForgotPassword} class="flex flex-col gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-ink/60">Your email address</span>
          <input type="email" bind:value={resetEmail} required placeholder="you@example.com"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        <button type="submit" disabled={resetLoading}
          class="mt-1 rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700 disabled:opacity-60">
          {resetLoading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <button type="button" on:click={() => (forgotMode = false)}
        class="mt-4 w-full text-center text-sm font-medium text-ink/50 hover:text-ink">
        ← Back to sign in
      </button>

    <!-- ── RESET SENT CONFIRMATION ── -->
    {:else}
      <div class="rounded-2xl bg-fanu-50 px-5 py-6 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fanu-100 text-2xl">📧</div>
        <p class="font-semibold text-ink">Check your email</p>
        <p class="mt-1 text-sm text-ink/55">
          We sent a password reset link to <strong>{resetEmail}</strong>.
          Check your inbox and click the link to reset your password.
        </p>
      </div>

      <button type="button" on:click={() => { forgotMode = false; resetSent = false; }}
        class="mt-4 w-full text-center text-sm font-medium text-ink/50 hover:text-ink">
        ← Back to sign in
      </button>
    {/if}

  </div>
</div>
