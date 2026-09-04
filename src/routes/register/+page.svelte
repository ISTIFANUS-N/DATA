<script lang="ts">
  import { goto } from '$app/navigation';
  import { register } from '$lib/stores/db';
  import { generatePassword } from '$lib/password';
  import { showToast } from '$lib/stores/toast';

  let fullName = '';
  let email = '';
  let phone = '';
  let password = '';
  let showPassword = false;
  let error = '';
  let loading = false;

  function handleGenerate() {
    password = generatePassword();
    showPassword = true; // reveal it so there's something to actually save
    showToast('Password generated — copy it somewhere safe before continuing');
  }

  async function handleCopy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      showToast('Password copied');
    } catch {
      // Clipboard API can be blocked (e.g. no HTTPS in some dev setups) —
      // the field is already visible via the eye toggle as a fallback.
    }
  }

  function handleSubmit() {
    error = '';
    loading = true;
    const result = register({ fullName, email, phone, password });
    loading = false;

    if (!result.ok) {
      error = result.error;
      return;
    }
    goto('/dashboard');
  }
</script>

<svelte:head><title>Create account — Stefanx</title></svelte:head>

<div class="flex min-h-screen flex-col justify-center px-6 py-10">
  <div class="mx-auto w-full max-w-sm">
    <div class="mb-8 text-center">
      <img src="/stefanx-logo.jpg" alt="Stefanx Data & Services" class="mx-auto mb-4 h-12 w-auto" />
      <h1 class="font-display text-2xl font-bold text-fanu-700">Create your account</h1>
      <p class="mt-1 text-sm text-ink/60">
        Already have an account?
        <a href="/login" class="font-medium text-spark-600 underline-offset-2 hover:underline">Sign in</a>
      </p>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-ink/60">Full name</span>
        <input
          type="text"
          bind:value={fullName}
          required
          placeholder="Ada Obi"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
        />
      </label>
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

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-ink/60">Password</span>
          <button
            type="button"
            on:click={handleGenerate}
            class="text-xs font-semibold text-spark-600 hover:underline"
          >
            Generate password
          </button>
        </div>
        <div class="relative">
          {#if showPassword}
            <input
              type="text"
              bind:value={password}
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full rounded-xl border border-fanu-100 px-3.5 py-3 pr-20 text-sm focus:border-fanu-500"
            />
          {:else}
            <input
              type="password"
              bind:value={password}
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full rounded-xl border border-fanu-100 px-3.5 py-3 pr-20 text-sm focus:border-fanu-500"
            />
          {/if}
          <div class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {#if password}
              <button
                type="button"
                on:click={handleCopy}
                class="rounded-lg px-2 py-1 text-[11px] font-semibold text-fanu-700 hover:bg-fanu-50"
              >
                Copy
              </button>
            {/if}
            <button
              type="button"
              on:click={() => (showPassword = !showPassword)}
              class="rounded-lg px-2 py-1 text-[11px] font-semibold text-ink/50 hover:bg-fanu-50"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {#if password && showPassword}
          <p class="text-[11px] text-ink/40">Save this somewhere safe — it won't be shown again after you continue.</p>
        {/if}
      </div>

      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="mt-1 rounded-xl bg-spark-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  </div>
</div>
