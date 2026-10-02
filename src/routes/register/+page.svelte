<script lang="ts">
  import { goto } from '$app/navigation';
  import { register } from '$lib/stores/db';
  import { supabase } from '$lib/supabase';
  import { generatePassword } from '$lib/password';
  import { showToast } from '$lib/stores/toast';

  let fullName = '';
  let email = '';
  let phone = '';
  let password = '';
  let showPassword = false;
  let error = '';
  let loading = false;

  // After signup
  let registered = false;
  let registeredEmail = '';
  let resendLoading = false;
  let resendCooldown = 0;
  let cooldownTimer: ReturnType<typeof setInterval>;

  function handleGenerate() {
    password = generatePassword();
    showPassword = true;
    showToast('Password generated — copy it somewhere safe before continuing');
  }

  async function handleCopy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      showToast('Password copied');
    } catch { /* fallback: field is visible */ }
  }

  async function handleSubmit() {
    error = ''; loading = true;
    const result = await register(email, password, fullName, phone);
    loading = false;

    if (!result.ok) {
      error = result.error;
      return;
    }

    // Show the verify email screen
    registeredEmail = result.email;
    registered = true;
  }

  async function resendEmail() {
    if (resendCooldown > 0) return;
    resendLoading = true;
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail
    });
    resendLoading = false;

    if (err) {
      showToast(err.message, 'error');
      return;
    }

    showToast('Confirmation email resent');
    // 60-second cooldown so they can't spam it
    resendCooldown = 60;
    cooldownTimer = setInterval(() => {
      resendCooldown -= 1;
      if (resendCooldown <= 0) {
        resendCooldown = 0;
        clearInterval(cooldownTimer);
      }
    }, 1000);
  }
</script>

<svelte:head><title>Create account — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10">
  <div class="mx-auto w-full max-w-sm">

    <!-- ── VERIFY EMAIL SCREEN ── -->
    {#if registered}
      <div class="text-center">
        <img src="/stefanx-logo.jpg" alt="Stefanx" class="mx-auto mb-6 h-14 w-auto rounded-xl" />
        <div class="mb-5 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-fanu-100">
          <span class="text-3xl">📧</span>
        </div>
        <h1 class="font-display text-xl font-bold text-fanu-700 mb-3">Please check your email to verify your account</h1>
        <p class="text-sm text-ink/55 mb-8">A confirmation link has been sent to <strong>{registeredEmail}</strong>.</p>
        <a href="/login" class="block w-full rounded-xl bg-fanu-600 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-fanu-700">
          Go to sign in
        </a>
        <p class="mt-4 text-xs text-ink/40">
          Wrong email? <button type="button" on:click={() => { registered = false; email = ''; }} class="text-fanu-700 hover:underline">Start over</button>
        </p>
      </div>

    <!-- ── REGISTER FORM ── -->
    {:else}
      <div class="mb-8 text-center">
        <img src="/stefanx-logo.jpg" alt="Stefanx Data Services" class="mx-auto mb-4 h-14 w-auto rounded-xl" />
        <h1 class="font-display text-2xl font-bold text-fanu-700">Create your account</h1>
        <p class="mt-1 text-sm text-ink/55">
          Already have an account?
          <a href="/login" class="font-semibold text-fanu-700 hover:underline">Sign in</a>
        </p>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-ink/60">Full name</span>
          <input type="text" bind:value={fullName} required placeholder="Ada Okafor"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-ink/60">Email</span>
          <input type="email" bind:value={email} required placeholder="you@example.com"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-ink/60">Phone number</span>
          <input type="tel" bind:value={phone} required placeholder="08012345678"
            maxlength="11"
            class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        </label>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink/60">Password</span>
            <button type="button" on:click={handleGenerate}
              class="text-xs font-medium text-fanu-700 hover:underline">
              Generate password
            </button>
          </div>
          <div class="relative">
            {#if showPassword}
              <input type="text" bind:value={password} required placeholder="Min 6 characters"
                class="w-full rounded-xl border border-fanu-100 px-3.5 py-3 pr-20 text-sm focus:border-fanu-500 focus:outline-none" />
            {:else}
              <input type="password" bind:value={password} required placeholder="Min 6 characters"
                class="w-full rounded-xl border border-fanu-100 px-3.5 py-3 pr-20 text-sm focus:border-fanu-500 focus:outline-none" />
            {/if}
            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              {#if password}
                <button type="button" on:click={handleCopy}
                  class="text-xs font-medium text-ink/40 hover:text-ink">Copy</button>
              {/if}
              <button type="button" on:click={() => (showPassword = !showPassword)}
                class="text-xs font-medium text-ink/40 hover:text-ink">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>

        {#if error}
          <div class="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {error}
            {#if error.includes('already exists')}
              <div class="mt-2">
                <a href="/login" class="font-semibold underline underline-offset-2">Sign in instead →</a>
              </div>
            {/if}
          </div>
        {/if}

        <button type="submit" disabled={loading}
          class="mt-1 rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    {/if}

  </div>
</div>
