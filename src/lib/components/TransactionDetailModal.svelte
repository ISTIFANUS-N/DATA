<script lang="ts">
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import type { Transaction } from '$lib/types';

  export let tx: Transaction & { userEmail?: string; userName?: string } | null = null;
  export let onClose: () => void;

  let generating = false;

  const typeLabels: Record<string, string> = {
    wallet_funding: 'Wallet funding', airtime: 'Airtime', data: 'Data',
    electricity: 'Electricity', cable: 'Cable TV', airtime_to_cash: 'Airtime to cash',
    recharge_card_printing: 'Recharge card printing', bulk_sms: 'Bulk SMS',
    result_checker: 'Result checker', admin_adjustment: 'Admin adjustment'
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  function buildCanvas(): HTMLCanvasElement {
    if (!tx) return document.createElement('canvas');
    const W = 640, PAD = 40;
    const isCredit = tx.type === 'wallet_funding' || tx.type === 'airtime_to_cash' || tx.meta?.direction === 'credit';
    const rows = [
      { label: 'Service', value: typeLabels[tx.type] ?? tx.type },
      { label: 'Description', value: tx.description },
      ...(tx.userEmail ? [{ label: 'User', value: tx.userName || tx.userEmail }] : []),
      { label: 'Amount', value: `${isCredit ? '+' : '-'}${formatNaira(tx.amount)}`, emphasis: true },
      { label: 'Status', value: tx.status.toUpperCase() },
      { label: 'Date', value: formatDate(tx.createdAt) },
    ];
    const rowH = 52, H = 180 + rows.length * rowH + 60 + 80 + 40;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F6F5F1'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, 20); ctx.fill();

    const success = tx.status === 'success';
    const circR = 36, circX = W / 2, circY = PAD + 56;
    ctx.beginPath(); ctx.arc(circX, circY, circR, 0, Math.PI * 2);
    ctx.fillStyle = success ? '#EFF7F0' : tx.status === 'failed' ? '#FEF2F2' : '#FEF9C3';
    ctx.fill();
    ctx.fillStyle = success ? '#166029' : tx.status === 'failed' ? '#DC2626' : '#92400E';
    ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(success ? '✓' : tx.status === 'failed' ? '✕' : '⏳', circX, circY);

    ctx.fillStyle = '#16211A'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(success ? 'Transaction Successful' : tx.status === 'failed' ? 'Transaction Failed' : 'Transaction Pending', W / 2, circY + circR + 30);
    ctx.fillStyle = 'rgba(22,33,26,0.5)'; ctx.font = '13px Arial';
    ctx.fillText(typeLabels[tx.type] ?? tx.type, W / 2, circY + circR + 52);

    const sepY = circY + circR + 70;
    ctx.strokeStyle = '#EFF7F0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD + 20, sepY); ctx.lineTo(W - PAD - 20, sepY); ctx.stroke();

    let ry = sepY + 16;
    for (const row of rows) {
      ctx.fillStyle = 'rgba(22,33,26,0.5)'; ctx.font = '13px Arial'; ctx.textAlign = 'left';
      ctx.fillText(row.label, PAD + 28, ry + 14);
      ctx.textAlign = 'right';
      if (row.emphasis) { ctx.fillStyle = isCredit ? '#166029' : '#16211A'; ctx.font = 'bold 15px Arial'; }
      else { ctx.fillStyle = '#16211A'; ctx.font = '600 13px Arial'; }
      ctx.fillText(row.value, W - PAD - 28, ry + 14);
      ctx.strokeStyle = '#EFF7F0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD + 20, ry + 30); ctx.lineTo(W - PAD - 20, ry + 30); ctx.stroke();
      ry += rowH;
    }

    // Reference
    ctx.fillStyle = 'rgba(22,33,26,0.45)'; ctx.font = '12px Arial'; ctx.textAlign = 'left';
    ctx.fillText('Reference', PAD + 28, ry + 14);
    ctx.textAlign = 'right'; ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(22,33,26,0.6)';
    ctx.fillText(tx.reference, W - PAD - 28, ry + 14);

    const footY = H - PAD - 36;
    ctx.fillStyle = '#166029'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Stefanx Data Services', W / 2, footY);
    ctx.fillStyle = 'rgba(22,33,26,0.35)'; ctx.font = '11px Arial';
    ctx.fillText('stefanxdata.com · stefansservice@gmail.com', W / 2, footY + 18);

    return canvas;
  }

  async function shareImage() {
    generating = true;
    try {
      const canvas = buildCanvas();
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
      const file = new File([blob], `stefanx-${tx!.reference}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Stefanx receipt`, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `stefanx-${tx!.reference}.png`; a.click();
        URL.revokeObjectURL(url);
        showToast('Receipt saved as image');
      }
    } catch { showToast('Receipt downloaded'); }
    finally { generating = false; }
  }

  async function copyRef() {
    try { await navigator.clipboard.writeText(tx!.reference); showToast('Reference copied'); } catch { }
  }

  $: isCredit = tx?.type === 'wallet_funding' || tx?.type === 'airtime_to_cash' || tx?.meta?.direction === 'credit';
</script>

{#if tx}
  <div class="fixed inset-0 z-50 flex items-end justify-center md:items-center" on:click|self={onClose}>
    <div class="fixed inset-0 bg-ink/40 backdrop-blur-sm" on:click={onClose}></div>
    <div class="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-6 pb-10 shadow-2xl md:rounded-3xl md:pb-6">

      <!-- Status icon -->
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl"
        class:bg-fanu-50={tx.status === 'success'}
        class:text-fanu-700={tx.status === 'success'}
        class:bg-red-50={tx.status === 'failed'}
        class:text-red-600={tx.status === 'failed'}
        class:bg-amber-50={tx.status === 'pending'}
        class:text-amber-700={tx.status === 'pending'}
      >
        {tx.status === 'success' ? '✓' : tx.status === 'failed' ? '✕' : '⏳'}
      </div>
      <p class="text-center font-display text-base font-bold text-ink">{typeLabels[tx.type] ?? tx.type}</p>
      <p class="text-center text-xs capitalize text-ink/50">{tx.status}</p>

      <!-- Rows -->
      <div class="mt-4 divide-y divide-fanu-50 rounded-2xl bg-fanu-50/40 px-4">
        <div class="flex justify-between py-2.5 text-xs">
          <span class="text-ink/55">Description</span>
          <span class="max-w-[55%] text-right font-medium text-ink">{tx.description}</span>
        </div>
        {#if tx.userEmail}
          <div class="flex justify-between py-2.5 text-xs">
            <span class="text-ink/55">User</span>
            <span class="font-medium text-ink">{tx.userName || tx.userEmail}</span>
          </div>
        {/if}
        <div class="flex justify-between py-2.5 text-xs">
          <span class="text-ink/55">Amount</span>
          <span class="font-mono font-bold" class:text-fanu-700={isCredit} class:text-ink={!isCredit}>
            {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
          </span>
        </div>
        <div class="flex justify-between py-2.5 text-xs">
          <span class="text-ink/55">Date</span>
          <span class="font-medium text-ink">{formatDate(tx.createdAt)}</span>
        </div>
        <button type="button" on:click={copyRef} class="flex w-full items-center justify-between py-2.5 text-xs hover:opacity-70">
          <span class="text-ink/55">Reference</span>
          <span class="flex items-center gap-1 font-mono text-ink">
            {tx.reference}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink/30"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          </span>
        </button>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex gap-2.5">
        <button type="button" on:click={shareImage} disabled={generating}
          class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-fanu-600 py-3 text-xs font-semibold text-white disabled:opacity-60">
          {#if generating}
            <span class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            Generating…
          {:else}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share as image
          {/if}
        </button>
        <button type="button" on:click={onClose}
          class="rounded-xl border border-fanu-100 px-4 py-3 text-xs font-semibold text-ink/60 hover:bg-fanu-50">
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
