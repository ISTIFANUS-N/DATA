<script lang="ts">
  import { showToast } from '$lib/stores/toast';

  export let status: 'success' | 'failed';
  export let title: string;
  export let subtitle: string;
  export let rows: { label: string; value: string; emphasis?: boolean }[];
  export let reference: string;
  export let shareText: string;
  export let onDone: () => void;
  export let onBuyAgain: (() => void) | undefined = undefined;
  export let onRetry: (() => void) | undefined = undefined;
  export let retrying = false;

  let generating = false;

  async function handleCopyReference() {
    try { await navigator.clipboard.writeText(reference); showToast('Reference copied'); } catch { /* */ }
  }

  // Draws the receipt to a canvas and returns a data URL — no external library needed
  function buildReceiptCanvas(): HTMLCanvasElement {
    const W = 640, PAD = 40, HEADER = 180;
    const rowH = 52;
    const rows_h = rows.length * rowH + 60; // rows + reference row
    const btns_h = 80;
    const H = HEADER + rows_h + btns_h + 40;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#F6F5F1';
    ctx.fillRect(0, 0, W, H);

    // Card
    const cx = PAD, cy = PAD, cw = W - PAD * 2, ch = H - PAD * 2;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx, cy, cw, ch, 20);
    ctx.fill();

    // Status circle
    const circR = 36, circX = W / 2, circY = cy + 56;
    ctx.beginPath();
    ctx.arc(circX, circY, circR, 0, Math.PI * 2);
    ctx.fillStyle = status === 'success' ? '#EFF7F0' : '#FEF2F2';
    ctx.fill();

    ctx.fillStyle = status === 'success' ? '#166029' : '#DC2626';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(status === 'success' ? '✓' : '✕', circX, circY);

    // Title
    ctx.fillStyle = '#16211A';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, W / 2, circY + circR + 30);

    // Subtitle
    ctx.fillStyle = 'rgba(22,33,26,0.5)';
    ctx.font = '14px Arial';
    ctx.fillText(subtitle, W / 2, circY + circR + 56);

    // Separator
    const sepY = circY + circR + 76;
    ctx.strokeStyle = '#EFF7F0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 20, sepY); ctx.lineTo(cx + cw - 20, sepY); ctx.stroke();

    // Rows
    let ry = sepY + 16;
    const allRows = [...rows, { label: 'Reference', value: reference }];
    for (const row of allRows) {
      ctx.fillStyle = 'rgba(22,33,26,0.5)';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(row.label, cx + 28, ry + 14);

      ctx.textAlign = 'right';
      if ('emphasis' in row && row.emphasis) {
        ctx.fillStyle = '#166029';
        ctx.font = 'bold 14px Arial';
      } else if (row.label === 'Reference') {
        ctx.fillStyle = 'rgba(22,33,26,0.6)';
        ctx.font = '13px monospace';
      } else {
        ctx.fillStyle = '#16211A';
        ctx.font = '600 14px Arial';
      }
      ctx.fillText(row.value, cx + cw - 28, ry + 14);

      ctx.strokeStyle = '#EFF7F0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + 20, ry + 30); ctx.lineTo(cx + cw - 20, ry + 30); ctx.stroke();
      ry += rowH;
    }

    // Brand footer
    const footY = H - PAD - 36;
    ctx.fillStyle = '#166029';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Stefanx Data Services', W / 2, footY);
    ctx.fillStyle = 'rgba(22,33,26,0.35)';
    ctx.font = '11px Arial';
    ctx.fillText('stefanxdata.com · stefansservice@gmail.com', W / 2, footY + 18);

    return canvas;
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  async function generateAndShare() {
    generating = true;
    try {
      const canvas = buildReceiptCanvas();
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'receipt.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `Stefanx receipt — ${reference}`,
          files: [new File([blob], `stefanx-receipt-${reference}.png`, { type: 'image/png' })]
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `stefanx-receipt-${reference}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Receipt saved as image');
      }
    } catch (e) {
      showToast('Could not share — receipt downloaded instead');
    } finally {
      generating = false;
    }
  }

  function handleRetry() { onRetry?.(); }
</script>

<div class="px-4 py-8">
  <div
    class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
    class:bg-fanu-600={status === 'success'}
    class:bg-red-500={status === 'failed'}
  >
    {status === 'success' ? '✓' : '✕'}
  </div>

  <p class="text-center font-display text-lg font-bold text-ink">{title}</p>
  <p class="mx-auto mt-1 max-w-xs text-center text-sm text-ink/50">{subtitle}</p>

  {#if status === 'failed'}
    <div class="mx-auto mt-5 flex max-w-sm items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">
      <span class="mt-px">⚠</span>
      <span>Your wallet was not charged for this failed transaction.</span>
    </div>
  {/if}

  <div class="mx-auto mt-5 max-w-sm divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
    {#each rows as row}
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/55">{row.label}</span>
        <span class="text-sm font-medium" class:text-fanu-700={row.emphasis} class:text-ink={!row.emphasis}>
          {row.value}
        </span>
      </div>
    {/each}
    <div class="flex items-center justify-between py-3">
      <span class="text-sm text-ink/55">Reference</span>
      <button type="button" on:click={handleCopyReference} class="flex items-center gap-1.5 text-sm font-medium text-ink">
        <span class="font-mono">{reference}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink/35">
          <rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="mx-auto mt-6 flex max-w-sm flex-col gap-2.5">
    {#if status === 'success'}
      <button type="button" on:click={onDone}
        class="w-full rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700">
        Done
      </button>
      <div class="flex gap-2.5">
        {#if onBuyAgain}
          <button type="button" on:click={onBuyAgain}
            class="flex-1 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50">
            Buy Again
          </button>
        {/if}
        <button type="button" on:click={generateAndShare} disabled={generating}
          class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50 disabled:opacity-60">
          {#if generating}
            <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"></span>
            Generating…
          {:else}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share receipt
          {/if}
        </button>
      </div>
    {:else}
      <button type="button" on:click={generateAndShare} disabled={generating}
        class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50 disabled:opacity-60">
        {#if generating}
          <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"></span>
          Generating…
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share receipt
        {/if}
      </button>
      <button type="button" on:click={handleRetry} disabled={!onRetry || retrying}
        class="w-full rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700 disabled:opacity-60">
        {retrying ? 'Retrying…' : 'Try Again'}
      </button>
      <a href="mailto:stefansservice@gmail.com?subject=Transaction%20issue%20—%20{reference}"
        class="w-full rounded-xl border border-fanu-100 py-3 text-center text-sm font-semibold text-ink/70 transition hover:bg-fanu-50">
        Contact Support
      </a>
    {/if}
  </div>
</div>
