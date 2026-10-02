<script lang="ts">
  import {
    dashboardNotice, welcomeSuggestion, settingsLoaded, saveSetting,
    DEFAULT_SUGGESTION, type DashboardNotice, type WelcomeSuggestion
  } from '$lib/stores/settings';
  import { showToast } from '$lib/stores/toast';

  let notice: DashboardNotice | null = null;
  let suggestion: WelcomeSuggestion | null = null;
  let savingNotice = false;
  let savingSuggestion = false;

  // Fill the forms once, after the saved values have loaded.
  $: if ($settingsLoaded && !notice) {
    notice = { ...$dashboardNotice };
    suggestion = { ...$welcomeSuggestion };
  }

  const tones: { value: DashboardNotice['tone']; label: string }[] = [
    { value: 'info', label: 'Info (blue)' },
    { value: 'success', label: 'Good news (green)' },
    { value: 'warning', label: 'Important (amber)' }
  ];

  const toneClass: Record<DashboardNotice['tone'], string> = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-fanu-100 bg-fanu-50 text-fanu-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900'
  };

  async function saveNotice() {
    if (!notice) return;
    if (notice.enabled && !notice.message.trim()) {
      showToast('Write a message first, or switch the bar off', 'error'); return;
    }
    savingNotice = true;
    // updatedAt changes on every save, so users who dismissed an old message see the new one.
    const res = await saveSetting('dashboard_notice', {
      ...notice, message: notice.message.trim(), updatedAt: new Date().toISOString()
    });
    savingNotice = false;
    showToast(res.ok ? 'Notification saved' : res.error, res.ok ? undefined : 'error');
  }

  async function saveSuggestion() {
    if (!suggestion) return;
    savingSuggestion = true;
    const res = await saveSetting('welcome_suggestion', suggestion);
    savingSuggestion = false;
    showToast(res.ok ? 'Suggestion saved' : res.error, res.ok ? undefined : 'error');
  }
</script>

<svelte:head><title>Notifications — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Notifications</h1>
<p class="mb-6 text-sm text-ink/55">Pass messages to customers on their dashboard.</p>

{#if !notice || !suggestion}
  <p class="text-sm text-ink/45">Loading…</p>
{:else}
  <!-- Announcement bar -->
  <div class="mb-6 rounded-2xl bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-ink">Dashboard notification bar</p>
        <p class="text-[11px] text-ink/50">Shown at the top of every customer's dashboard. They can dismiss it.</p>
      </div>
      <label class="flex cursor-pointer items-center gap-2 text-xs text-ink/60">
        {notice.enabled ? 'On' : 'Off'}
        <input type="checkbox" bind:checked={notice.enabled} class="h-4 w-4 accent-fanu-600" />
      </label>
    </div>

    <label class="mb-3 flex flex-col gap-1 text-xs">
      <span class="font-medium text-ink/60">Message</span>
      <textarea rows="3" maxlength="300" bind:value={notice.message}
        placeholder="e.g. MTN data is back. Network maintenance tonight 12am–2am."
        class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm"></textarea>
      <span class="text-right text-[10px] text-ink/35">{notice.message.length}/300</span>
    </label>

    <label class="mb-4 flex flex-col gap-1 text-xs sm:w-56">
      <span class="font-medium text-ink/60">Style</span>
      <select bind:value={notice.tone} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
        {#each tones as t}<option value={t.value}>{t.label}</option>{/each}
      </select>
    </label>

    {#if notice.message.trim()}
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink/35">Preview</p>
      <div class="mb-4 rounded-2xl border px-4 py-3 text-xs leading-relaxed {toneClass[notice.tone]}">
        {notice.message}
      </div>
    {/if}

    <button type="button" on:click={saveNotice} disabled={savingNotice}
      class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
      {savingNotice ? 'Saving…' : 'Save notification'}
    </button>
  </div>

  <!-- Welcome suggestion -->
  <div class="rounded-2xl bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-ink">Welcome suggestion</p>
        <p class="text-[11px] text-ink/50">
          A friendly tip shown to customers who don't have a funding account yet. It disappears once they get one.
        </p>
      </div>
      <label class="flex cursor-pointer items-center gap-2 text-xs text-ink/60">
        {suggestion.enabled ? 'On' : 'Off'}
        <input type="checkbox" bind:checked={suggestion.enabled} class="h-4 w-4 accent-fanu-600" />
      </label>
    </div>

    <label class="mb-3 flex flex-col gap-1 text-xs">
      <span class="font-medium text-ink/60">Title</span>
      <input type="text" maxlength="80" bind:value={suggestion.title}
        class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
    </label>
    <label class="mb-4 flex flex-col gap-1 text-xs">
      <span class="font-medium text-ink/60">Message</span>
      <textarea rows="3" maxlength="240" bind:value={suggestion.message}
        class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm"></textarea>
    </label>

    <div class="flex items-center gap-3">
      <button type="button" on:click={saveSuggestion} disabled={savingSuggestion}
        class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
        {savingSuggestion ? 'Saving…' : 'Save suggestion'}
      </button>
      <button type="button" on:click={() => (suggestion = { ...DEFAULT_SUGGESTION })}
        class="text-xs font-medium text-ink/50 hover:text-ink">Reset to default</button>
    </div>
  </div>
{/if}
