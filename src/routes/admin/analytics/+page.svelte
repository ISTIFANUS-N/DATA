<script lang="ts">
  import { allTransactionsForAdmin, allAccountsForAdmin, todayLoginCount } from '$lib/stores/db';
  import { formatNaira } from '$lib/format';
  import { planTypes } from '$lib/stores/settings';
  import type { Transaction } from '$lib/types';

  type TxWithUser = Transaction & { userEmail: string; userName: string };

  // ── Helpers ──────────────────────────────────────────────────────────────
  function dateKey(iso: string) { return iso.slice(0, 10); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function subtractDays(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
  function last7() { return Array.from({ length: 7 }, (_, i) => subtractDays(6 - i)); }
  function last30() { return Array.from({ length: 30 }, (_, i) => subtractDays(29 - i)); }
  function shortDate(iso: string) { const [,m,d] = iso.split('-'); return `${d}/${m}`; }

  const REVENUE_TYPES = ['airtime','data','electricity','cable','bulk_sms','result_checker','recharge_card_printing'];
  const NETWORKS = ['MTN','GLO','AIRTEL','9MOBILE'];
  const NET_COLORS: Record<string,string> = { MTN:'#FFCB05', GLO:'#00A651', AIRTEL:'#ED1C24', '9MOBILE':'#006D5B' };
  const NET_BG: Record<string,string> = { MTN:'#FFF9E0', GLO:'#E6F7EF', AIRTEL:'#FDEAEA', '9MOBILE':'#E0F6F5' };

  $: DATA_PLAN_TYPES = $planTypes.map((t) => t.code);
  const PLAN_TYPE_LABELS: Record<string,string> = {
    SME:'SME', GIFTING:'Gifting', DATA_SHARE:'Data Share', CORPORATE_GIFTING:'Corporate Gifting'
  };

  const TYPE_LABELS: Record<string,string> = {
    airtime:'Airtime', data:'Data', electricity:'Electricity', cable:'Cable TV',
    bulk_sms:'Bulk SMS', result_checker:'Result checker', recharge_card_printing:'Recharge cards'
  };
  const TYPE_COLORS: Record<string,string> = {
    airtime:'#166029', data:'#1F7A34', electricity:'#E8701F', cable:'#3F9450',
    bulk_sms:'#FFCB05', result_checker:'#00A651', recharge_card_printing:'#ED1C24'
  };

  // ── Core data ────────────────────────────────────────────────────────────
  $: allTxs = $allTransactionsForAdmin as TxWithUser[];
  $: txs = allTxs.filter(t => t.status === 'success');
  $: revenueTxs = txs.filter(t => REVENUE_TYPES.includes(t.type));

  // ── KPIs ─────────────────────────────────────────────────────────────────
  $: totalRevenue = revenueTxs.reduce((s,t) => s + t.amount, 0);
  $: todayRevenue = revenueTxs.filter(t => dateKey(t.createdAt) === today()).reduce((s,t) => s + t.amount, 0);
  $: todayTxCount = allTxs.filter(t => dateKey(t.createdAt) === today()).length;
  $: todayFailed = allTxs.filter(t => dateKey(t.createdAt) === today() && t.status === 'failed').length;
  $: failureRate = todayTxCount > 0 ? Math.round(todayFailed / todayTxCount * 100) : 0;

  // ── Daily revenue chart ──────────────────────────────────────────────────
  let chartPeriod: '7d' | '30d' = '7d';
  $: chartDays = chartPeriod === '7d' ? last7() : last30();
  $: chartData = chartDays.map(d => ({
    date: d, label: shortDate(d), isToday: d === today(),
    amount: revenueTxs.filter(t => dateKey(t.createdAt) === d).reduce((s,t) => s + t.amount, 0),
    count: allTxs.filter(t => dateKey(t.createdAt) === d).length,
    failed: allTxs.filter(t => dateKey(t.createdAt) === d && t.status === 'failed').length,
  }));
  $: chartMax = Math.max(...chartData.map(d => d.amount), 1);
  $: chartBarW = chartPeriod === '7d' ? 48 : 20;
  $: chartGap = chartPeriod === '7d' ? 76 : 30;
  $: chartSvgW = Math.max(chartData.length * chartGap, 560);

  // ── Revenue by service ───────────────────────────────────────────────────
  $: revenueByType = REVENUE_TYPES.map(type => ({
    type,
    amount: revenueTxs.filter(t => t.type === type).reduce((s,t) => s + t.amount, 0),
    count: txs.filter(t => t.type === type).length,
    failed: allTxs.filter(t => t.type === type && t.status === 'failed').length,
  })).filter(r => r.amount > 0 || r.count > 0).sort((a,b) => b.amount - a.amount);

  // ── DATA breakdown by network ────────────────────────────────────────────
  $: dataTxs = txs.filter(t => t.type === 'data');
  $: dataByNetwork = NETWORKS.map(net => ({
    network: net,
    amount: dataTxs.filter(t => t.meta?.network === net).reduce((s,t) => s + t.amount, 0),
    count: dataTxs.filter(t => t.meta?.network === net).length,
  })).filter(r => r.count > 0).sort((a,b) => b.amount - a.amount);

  $: dataByNetworkMax = Math.max(...dataByNetwork.map(r => r.amount), 1);

  // ── DATA breakdown by plan type ──────────────────────────────────────────
  $: dataByPlanType = DATA_PLAN_TYPES.map(type => ({
    type,
    label: PLAN_TYPE_LABELS[type],
    amount: dataTxs.filter(t => t.meta?.planType === type).reduce((s,t) => s + t.amount, 0),
    count: dataTxs.filter(t => t.meta?.planType === type).length,
  })).filter(r => r.count > 0).sort((a,b) => b.amount - a.amount);

  // ── DATA: network × plan type matrix ────────────────────────────────────
  $: dataMatrix = NETWORKS.map(net => ({
    network: net,
    types: DATA_PLAN_TYPES.map(type => ({
      type,
      label: PLAN_TYPE_LABELS[type],
      count: dataTxs.filter(t => t.meta?.network === net && t.meta?.planType === type).length,
      amount: dataTxs.filter(t => t.meta?.network === net && t.meta?.planType === type).reduce((s,t) => s + t.amount, 0),
    }))
  })).filter(r => r.types.some(t => t.count > 0));

  // ── AIRTIME breakdown by network ─────────────────────────────────────────
  $: airtimeTxs = txs.filter(t => t.type === 'airtime');
  $: airtimeByNetwork = NETWORKS.map(net => ({
    network: net,
    amount: airtimeTxs.filter(t => t.meta?.network === net).reduce((s,t) => s + t.amount, 0),
    count: airtimeTxs.filter(t => t.meta?.network === net).length,
  })).filter(r => r.count > 0).sort((a,b) => b.amount - a.amount);

  // ── CABLE breakdown by provider ──────────────────────────────────────────
  $: cableTxs = txs.filter(t => t.type === 'cable');
  $: cableByProvider = ['DSTV','GOTV','STARTIMES'].map(prov => ({
    provider: prov,
    amount: cableTxs.filter(t => t.meta?.provider === prov).reduce((s,t) => s + t.amount, 0),
    count: cableTxs.filter(t => t.meta?.provider === prov).length,
  })).filter(r => r.count > 0).sort((a,b) => b.amount - a.amount);

  // ── ELECTRICITY breakdown by disco ───────────────────────────────────────
  $: elecTxs = txs.filter(t => t.type === 'electricity');
  $: elecByDisco = elecTxs.reduce((acc: Record<string, {amount:number;count:number}>, t) => {
    const disco = t.meta?.disco ?? 'Unknown';
    if (!acc[disco]) acc[disco] = { amount: 0, count: 0 };
    acc[disco].amount += t.amount;
    acc[disco].count += 1;
    return acc;
  }, {});
  $: elecDiscos = Object.entries(elecByDisco).map(([disco, d]) => ({ disco, ...d })).sort((a,b) => b.amount - a.amount);

  // ── Top users ─────────────────────────────────────────────────────────────
  $: topUsers = $allAccountsForAdmin.map(u => ({
    email: u.email,
    name: u.profile.fullName || u.email,
    spend: revenueTxs.filter(t => t.userEmail === u.email).reduce((s,t) => s + t.amount, 0),
    count: allTxs.filter(t => t.userEmail === u.email).length,
    package: u.profile.package,
  })).filter(u => u.spend > 0).sort((a,b) => b.spend - a.spend).slice(0, 8);

  // ── Today's feed ─────────────────────────────────────────────────────────
  $: todayTxs = allTxs.filter(t => dateKey(t.createdAt) === today()).slice(0, 20);

  // ── Tab state ────────────────────────────────────────────────────────────
  let tab: 'overview' | 'data' | 'airtime' | 'cable' | 'electricity' | 'users' = 'overview';
  function setTab(id: string) { tab = id as typeof tab; }

  // ── Shared bar component (inline function) ───────────────────────────────
  function pct(val: number, max: number) { return max > 0 ? Math.round(val / max * 100) : 0; }
</script>

<svelte:head><title>Analytics — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Analytics</h1>

<!-- KPI cards -->
<div class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Total revenue</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-fanu-700">{formatNaira(totalRevenue)}</p>
    <p class="mt-0.5 text-[10px] text-ink/35">All time · successful</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Today's revenue</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-fanu-700">{formatNaira(todayRevenue)}</p>
    <p class="mt-0.5 text-[10px] text-ink/35">{todayTxCount} transactions</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Logins today</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{$todayLoginCount}</p>
    <p class="mt-0.5 text-[10px] text-ink/35">{$allAccountsForAdmin.length} accounts</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Failure rate (today)</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums"
      class:text-red-600={failureRate > 20}
      class:text-amber-600={failureRate > 10 && failureRate <= 20}
      class:text-fanu-700={failureRate <= 10}
    >{failureRate}%</p>
    <p class="mt-0.5 text-[10px] text-ink/35">{todayFailed} failed</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Data transactions</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{dataTxs.length}</p>
    <p class="mt-0.5 text-[10px] text-ink/35">{airtimeTxs.length} airtime</p>
  </div>
</div>

<!-- Tab bar -->
<div class="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
  {#each [
    { id: 'overview', label: 'Overview' },
    { id: 'data', label: '📶 Data' },
    { id: 'airtime', label: '📱 Airtime' },
    { id: 'cable', label: '📺 Cable' },
    { id: 'electricity', label: '💡 Electricity' },
    { id: 'users', label: '👥 Users' },
  ] as t}
    <button type="button" on:click={() => setTab(t.id)}
      class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition"
      class:bg-fanu-600={tab === t.id} class:text-white={tab === t.id}
      class:text-ink={tab !== t.id} class:hover:bg-fanu-50={tab !== t.id}
    >{t.label}</button>
  {/each}
</div>

<!-- ══ OVERVIEW TAB ══════════════════════════════════════════════════════ -->
{#if tab === 'overview'}

  <!-- Daily revenue chart -->
  <div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Daily revenue</p>
      <div class="flex gap-1">
        <button type="button" on:click={() => (chartPeriod = '7d')}
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          class:bg-fanu-600={chartPeriod === '7d'} class:text-white={chartPeriod === '7d'}
          class:text-ink={chartPeriod !== '7d'}
        >7 days</button>
        <button type="button" on:click={() => (chartPeriod = '30d')}
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          class:bg-fanu-600={chartPeriod === '30d'} class:text-white={chartPeriod === '30d'}
          class:text-ink={chartPeriod !== '30d'}
        >30 days</button>
      </div>
    </div>
    <div class="overflow-x-auto px-5 py-4">
      <svg width={chartSvgW} height="220" viewBox="0 0 {chartSvgW} 220" class="overflow-visible">
        {#each chartData as day, i}
          {@const x = i * chartGap + (chartGap - chartBarW) / 2}
          {@const barH = chartMax > 0 ? Math.round((day.amount / chartMax) * 160) : 0}
          {@const y = 175 - barH}
          <g>
            <!-- Failed bar (stacked behind) -->
            {#if day.failed > 0 && day.count > 0}
              {@const failH = Math.round((day.failed / day.count) * barH)}
              <rect x={x} y={175 - failH} width={chartBarW} height={Math.max(failH, 2)}
                rx="4" fill="rgba(220,38,38,0.18)" />
            {/if}
            <!-- Revenue bar -->
            <rect x={x} y={y} width={chartBarW} height={Math.max(barH, 2)}
              rx="5" fill={day.isToday ? '#166029' : day.amount > 0 ? '#D7EBDA' : '#f3f3f1'}
            />
            <!-- Amount label (7d only) -->
            {#if day.amount > 0 && chartPeriod === '7d'}
              <text x={x + chartBarW/2} y={y - 7} text-anchor="middle"
                font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" fill="#16211A">
                ₦{day.amount >= 1000 ? (day.amount/1000).toFixed(1)+'k' : day.amount}
              </text>
            {/if}
            <!-- Day label -->
            <text x={x + chartBarW/2} y="195" text-anchor="middle" font-size="10"
              fill={day.isToday ? '#166029' : 'rgba(22,33,26,0.4)'} font-family="Arial"
              font-weight={day.isToday ? '700' : '400'}>
              {chartPeriod === '30d' && i % 5 !== 0 ? '' : day.label}
            </text>
            <!-- Tx count (7d only) -->
            {#if day.count > 0 && chartPeriod === '7d'}
              <circle cx={x + chartBarW/2} cy={y + barH + 9} r="8" fill="#EFF7F0"/>
              <text x={x + chartBarW/2} y={y + barH + 13} text-anchor="middle"
                font-size="8" font-weight="700" font-family="Arial" fill="#166029">{day.count}</text>
            {/if}
          </g>
        {/each}
      </svg>
    </div>
    <div class="flex gap-4 border-t border-fanu-50 px-5 py-2 text-[10px] text-ink/45">
      <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-fanu-200"></span>Revenue</span>
      <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-red-100"></span>Failed (overlay)</span>
      <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-fanu-600"></span>Today</span>
    </div>
  </div>

  <!-- Revenue by service -->
  <div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Revenue by service</p>
    </div>
    {#if revenueByType.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">Make purchases to see breakdown here.</p>
    {:else}
      <div class="px-5 py-4">
        {#each revenueByType as svc}
          {@const p = pct(svc.amount, totalRevenue)}
          <div class="mb-3">
            <div class="mb-1 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" style="background:{TYPE_COLORS[svc.type] ?? '#166029'}"></span>
                <span class="font-semibold text-ink">{TYPE_LABELS[svc.type] ?? svc.type}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-ink/45">{svc.count} txns{svc.failed > 0 ? ` · ${svc.failed} failed` : ''}</span>
                <span class="font-mono font-semibold text-ink">{formatNaira(svc.amount)}</span>
                <span class="w-8 text-right text-ink/40">{p}%</span>
              </div>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-fanu-50">
              <div class="h-full rounded-full" style="width:{p}%;background:{TYPE_COLORS[svc.type] ?? '#166029'}"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Today's activity -->
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-ink">Today's transactions</p>
      <p class="text-xs text-ink/40">{todayTxs.length} shown</p>
    </div>
    {#if todayTxs.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No transactions today yet.</p>
    {:else}
      {#each todayTxs as tx}
        <div class="flex items-center gap-3 border-b border-fanu-50 px-5 py-3 last:border-0">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{tx.description}</p>
            <p class="text-[11px] text-ink/40">
              {tx.userName || tx.userEmail}
              {#if tx.meta?.network} · {tx.meta.network}{/if}
              · {tx.createdAt.slice(11,16)}
            </p>
          </div>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
            class:bg-fanu-50={tx.status==='success'} class:text-fanu-700={tx.status==='success'}
            class:bg-red-50={tx.status==='failed'} class:text-red-600={tx.status==='failed'}
            class:bg-amber-50={tx.status==='pending'} class:text-amber-700={tx.status==='pending'}
          >{tx.status}</span>
          <p class="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">{formatNaira(tx.amount)}</p>
        </div>
      {/each}
    {/if}
  </div>

<!-- ══ DATA TAB ══════════════════════════════════════════════════════════ -->
{:else if tab === 'data'}
  <div class="mb-6 grid gap-4 md:grid-cols-2">

    <!-- By network -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="border-b border-fanu-50 px-5 py-3">
        <p class="text-sm font-semibold text-ink">Data by network</p>
        <p class="text-[11px] text-ink/40">{dataTxs.length} transactions total</p>
      </div>
      {#if dataByNetwork.length === 0}
        <p class="px-5 py-8 text-center text-sm text-ink/40">No data transactions yet.</p>
      {:else}
        <div class="px-5 py-4">
          {#each dataByNetwork as row}
            {@const p = pct(row.amount, dataByNetworkMax)}
            <div class="mb-4">
              <div class="mb-1.5 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-black"
                    style="background:{NET_COLORS[row.network]};color:{row.network==='MTN'?'#002B5B':'white'}">
                    {row.network === '9MOBILE' ? '9M' : row.network.slice(0,2)}
                  </span>
                  <span class="font-semibold text-ink">{row.network}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-ink/45">{row.count} txns</span>
                  <span class="font-mono font-semibold text-ink">{formatNaira(row.amount)}</span>
                </div>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-fanu-50">
                <div class="h-full rounded-full transition-all" style="width:{p}%;background:{NET_COLORS[row.network]}"></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- By plan type -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="border-b border-fanu-50 px-5 py-3">
        <p class="text-sm font-semibold text-ink">Data by plan type</p>
      </div>
      {#if dataByPlanType.length === 0}
        <p class="px-5 py-8 text-center text-sm text-ink/40">No data transactions yet.</p>
      {:else}
        {@const typeMax = Math.max(...dataByPlanType.map(r => r.amount), 1)}
        <div class="px-5 py-4">
          {#each dataByPlanType as row}
            {@const p = pct(row.amount, typeMax)}
            <div class="mb-4">
              <div class="mb-1.5 flex justify-between text-xs">
                <span class="font-semibold text-ink">{row.label}</span>
                <div class="flex items-center gap-3">
                  <span class="text-ink/45">{row.count} txns</span>
                  <span class="font-mono font-semibold text-ink">{formatNaira(row.amount)}</span>
                </div>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-fanu-50">
                <div class="h-full rounded-full bg-fanu-500 transition-all" style="width:{p}%"></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Network × Plan type matrix -->
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Network × Plan type breakdown</p>
      <p class="text-[11px] text-ink/40">Transactions and revenue per combination</p>
    </div>
    {#if dataMatrix.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No data transactions yet.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-fanu-50 bg-fanu-50/40">
              <th class="px-4 py-2.5 text-left font-semibold text-ink/50">Network</th>
              {#each DATA_PLAN_TYPES as type}
                <th class="px-3 py-2.5 text-center font-semibold text-ink/50">{PLAN_TYPE_LABELS[type]}</th>
              {/each}
              <th class="px-3 py-2.5 text-right font-semibold text-ink/50">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each dataMatrix as row}
              {@const rowTotal = row.types.reduce((s,t) => s + t.amount, 0)}
              {@const rowCount = row.types.reduce((s,t) => s + t.count, 0)}
              {#if rowCount > 0}
                <tr class="border-b border-fanu-50 last:border-0 hover:bg-fanu-50/30">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-black"
                        style="background:{NET_COLORS[row.network]};color:{row.network==='MTN'?'#002B5B':'white'}">
                        {row.network === '9MOBILE' ? '9M' : row.network.slice(0,2)}
                      </span>
                      <span class="font-semibold text-ink">{row.network}</span>
                    </div>
                  </td>
                  {#each row.types as cell}
                    <td class="px-3 py-3 text-center">
                      {#if cell.count > 0}
                        <p class="font-mono font-semibold tabular-nums text-ink">{formatNaira(cell.amount)}</p>
                        <p class="text-ink/40">{cell.count} txn{cell.count !== 1 ? 's' : ''}</p>
                      {:else}
                        <span class="text-ink/20">—</span>
                      {/if}
                    </td>
                  {/each}
                  <td class="px-3 py-3 text-right">
                    <p class="font-mono font-semibold tabular-nums text-fanu-700">{formatNaira(rowTotal)}</p>
                    <p class="text-ink/40">{rowCount} txns</p>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

<!-- ══ AIRTIME TAB ═══════════════════════════════════════════════════════ -->
{:else if tab === 'airtime'}
  <div class="mb-6 rounded-2xl bg-white shadow-sm overflow-hidden">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Airtime by network</p>
      <p class="text-[11px] text-ink/40">{airtimeTxs.length} transactions · {formatNaira(airtimeTxs.reduce((s,t) => s+t.amount,0))} total</p>
    </div>
    {#if airtimeByNetwork.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No airtime transactions yet.</p>
    {:else}
      {@const airMax = Math.max(...airtimeByNetwork.map(r => r.amount), 1)}
      <div class="px-5 py-4">
        {#each airtimeByNetwork as row}
          {@const p = pct(row.amount, airMax)}
          <div class="mb-5">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black"
                  style="background:{NET_COLORS[row.network]};color:{row.network==='MTN'?'#002B5B':'white'}">
                  {row.network === '9MOBILE' ? '9M' : row.network.slice(0,2)}
                </span>
                <span class="font-semibold text-ink">{row.network}</span>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-ink/50">{row.count} purchases</span>
                <span class="font-mono font-bold text-ink">{formatNaira(row.amount)}</span>
              </div>
            </div>
            <div class="h-4 overflow-hidden rounded-full bg-fanu-50">
              <div class="flex h-full items-center rounded-full transition-all" style="width:{p}%;background:{NET_COLORS[row.network]}">
                {#if p > 15}<span class="pl-2 text-[9px] font-bold" style="color:{row.network==='MTN'?'#002B5B':'white'}">{p}%</span>{/if}
              </div>
            </div>
            {#if p <= 15}<p class="mt-0.5 text-[10px] text-ink/40">{p}% of airtime revenue</p>{/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Recent airtime transactions -->
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Recent airtime transactions</p>
    </div>
    {#each airtimeTxs.slice(0,10) as tx}
      <div class="flex items-center gap-3 border-b border-fanu-50 px-5 py-3 last:border-0">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
          style="background:{NET_COLORS[tx.meta?.network??'']??'#EFF7F0'};color:{tx.meta?.network==='MTN'?'#002B5B':'white'}">
          {tx.meta?.network === '9MOBILE' ? '9M' : (tx.meta?.network?.slice(0,2) ?? '?')}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-ink">{tx.description}</p>
          <p class="text-[11px] text-ink/40">{tx.userName || tx.userEmail} · {tx.createdAt.slice(0,10)}</p>
        </div>
        <p class="font-mono text-sm font-semibold tabular-nums text-ink">{formatNaira(tx.amount)}</p>
      </div>
    {:else}
      <p class="px-5 py-6 text-center text-sm text-ink/40">No airtime transactions.</p>
    {/each}
  </div>

<!-- ══ CABLE TAB ══════════════════════════════════════════════════════════ -->
{:else if tab === 'cable'}
  <div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Cable TV by provider</p>
      <p class="text-[11px] text-ink/40">{cableTxs.length} subscriptions · {formatNaira(cableTxs.reduce((s,t) => s+t.amount,0))}</p>
    </div>
    {#if cableByProvider.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No cable transactions yet.</p>
    {:else}
      {@const cableMax = Math.max(...cableByProvider.map(r => r.amount), 1)}
      <div class="px-5 py-4">
        {#each cableByProvider as row}
          {@const p = pct(row.amount, cableMax)}
          <div class="mb-5">
            <div class="mb-1.5 flex justify-between text-sm">
              <span class="font-semibold text-ink">{row.provider}</span>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-ink/50">{row.count} subs</span>
                <span class="font-mono font-bold text-ink">{formatNaira(row.amount)}</span>
              </div>
            </div>
            <div class="h-4 overflow-hidden rounded-full bg-fanu-50">
              <div class="h-full rounded-full bg-fanu-500 transition-all" style="width:{p}%"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ══ ELECTRICITY TAB ═══════════════════════════════════════════════════ -->
{:else if tab === 'electricity'}
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Electricity by DisCo</p>
      <p class="text-[11px] text-ink/40">{elecTxs.length} payments · {formatNaira(elecTxs.reduce((s,t) => s+t.amount,0))}</p>
    </div>
    {#if elecDiscos.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No electricity transactions yet.</p>
    {:else}
      {@const elecMax = Math.max(...elecDiscos.map(r => r.amount), 1)}
      <div class="px-5 py-4">
        {#each elecDiscos as row}
          {@const p = pct(row.amount, elecMax)}
          <div class="mb-5">
            <div class="mb-1.5 flex justify-between text-sm">
              <span class="font-semibold text-ink">{row.disco}</span>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-ink/50">{row.count} payments</span>
                <span class="font-mono font-bold text-fanu-700">{formatNaira(row.amount)}</span>
              </div>
            </div>
            <div class="h-4 overflow-hidden rounded-full bg-fanu-50">
              <div class="h-full rounded-full bg-spark-500 transition-all" style="width:{p}%"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ══ USERS TAB ══════════════════════════════════════════════════════════ -->
{:else if tab === 'users'}
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="border-b border-fanu-50 px-5 py-3">
      <p class="text-sm font-semibold text-ink">Top users by spend</p>
    </div>
    {#if topUsers.length === 0}
      <p class="px-5 py-8 text-center text-sm text-ink/40">No spend data yet.</p>
    {:else}
      {@const spendMax = Math.max(...topUsers.map(u => u.spend), 1)}
      <div>
        {#each topUsers as user, i}
          <div class="border-b border-fanu-50 px-5 py-4 last:border-0">
            <div class="mb-2 flex items-center gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fanu-100 font-mono text-xs font-bold text-fanu-700">
                {i + 1}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p class="truncate text-[11px] text-ink/40">{user.email} · {user.count} txns · {user.package === 'reseller' ? 'Reseller' : 'Smart User'}</p>
              </div>
              <p class="font-mono text-sm font-bold tabular-nums text-fanu-700">{formatNaira(user.spend)}</p>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-fanu-50">
              <div class="h-full rounded-full bg-fanu-600 transition-all" style="width:{pct(user.spend, spendMax)}%"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
