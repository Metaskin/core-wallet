import { useState, useEffect, useCallback, useRef } from 'react';
import { plaidAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// ─── Status display helpers ───────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-600',
};
const STATUS_LABEL = {
  pending:    'Pending',
  processing: 'Processing',
  completed:  'Completed',
  failed:     'Failed',
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BankTransfer() {
  // 0=list  1=search  2=link  3=details  4=review  5=result
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(true);

  // Data
  const [accounts,       setAccounts]       = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [transfers,      setTransfers]      = useState([]);

  // Wizard state
  const [selectedBank,          setSelectedBank]          = useState(null);
  const [selectedLinkedAccount, setSelectedLinkedAccount] = useState(null);
  const [bankSearch,            setBankSearch]            = useState({ query: '', results: [], searching: false });
  const [linkForm,              setLinkForm]              = useState({ accountName: '', routingNumber: '', accountNumber: '', accountType: 'checking' });
  const [transferForm,          setTransferForm]          = useState({ amount: '', fromAccountId: '', memo: '' });
  const [submittedTransfer,     setSubmittedTransfer]     = useState(null);
  const [submitting,            setSubmitting]            = useState(false);
  const [linking,               setLinking]               = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [accRes, linkedRes, txRes] = await Promise.all([
        accountAPI.getAll(),
        plaidAPI.getAccounts(),
        plaidAPI.getTransfers(),
      ]);
      const accs = accRes.data.data?.accounts || accRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
      setLinkedAccounts(linkedRes.data.data?.accounts || []);
      setTransfers(txRes.data.data?.transfers || []);
    } catch {
      toast.error('Failed to load bank transfer data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Pre-select checking account in transfer form
  useEffect(() => {
    if (accounts.length && !transferForm.fromAccountId) {
      const checking = accounts.find(a => a.account_type === 'checking') || accounts[0];
      if (checking) setTransferForm(f => ({ ...f, fromAccountId: checking.id }));
    }
  }, [accounts]);

  // ── Bank search ────────────────────────────────────────────────────────────
  const searchTimeout = useRef(null);
  const handleBankSearch = (q) => {
    setBankSearch(s => ({ ...s, query: q, searching: !!q.trim() }));
    clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setBankSearch({ query: '', results: [], searching: false });
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await plaidAPI.searchInstitutions(q);
        setBankSearch(s => ({ ...s, results: res.data.data?.institutions || [], searching: false }));
      } catch {
        setBankSearch(s => ({ ...s, searching: false }));
      }
    }, 350);
  };

  // Show popular banks immediately when step opens
  useEffect(() => {
    if (step === 1 && !bankSearch.query) {
      (async () => {
        try {
          const res = await plaidAPI.searchInstitutions('');
          setBankSearch(s => ({ ...s, results: res.data.data?.institutions || [] }));
        } catch {}
      })();
    }
  }, [step]);

  // ── Wizard handlers ────────────────────────────────────────────────────────
  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setLinkForm({ accountName: '', routingNumber: '', accountNumber: '', accountType: 'checking' });
    setSelectedLinkedAccount(null);
    setStep(2);
  };

  const handleSelectExistingAccount = (acct) => {
    setSelectedLinkedAccount(acct);
    setSelectedBank({ name: acct.institution_name });
    setStep(3);
  };

  const handleLinkAccount = async () => {
    const { accountName, routingNumber, accountNumber, accountType } = linkForm;
    if (!accountName.trim())           { toast.error('Account name is required');           return; }
    if (!/^\d{9}$/.test(routingNumber))     { toast.error('Routing number must be 9 digits');    return; }
    if (!/^\d{4,17}$/.test(accountNumber))  { toast.error('Account number must be 4–17 digits'); return; }

    setLinking(true);
    try {
      const res = await plaidAPI.addManualAccount({
        institutionName: selectedBank.name,
        institutionId:   selectedBank.institution_id || '',
        accountName,
        accountType,
        routingNumber,
        accountNumber,
      });
      const linked = res.data.data?.account;
      setLinkedAccounts(prev => [linked, ...prev]);
      setSelectedLinkedAccount(linked);
      toast.success('Bank account linked');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link account');
    } finally {
      setLinking(false);
    }
  };

  const handleSubmitTransfer = async () => {
    const parsed = parseFloat(transferForm.amount);
    if (!parsed || parsed <= 0)       { toast.error('Enter a valid amount');           return; }
    if (!transferForm.fromAccountId)  { toast.error('Select a source account');         return; }
    if (!selectedLinkedAccount)       { toast.error('No destination account selected'); return; }

    setSubmitting(true);
    try {
      const res = await plaidAPI.createTransfer({
        linkedAccountId: selectedLinkedAccount.id,
        fromAccountId:   transferForm.fromAccountId,
        amount:          parsed,
        memo:            transferForm.memo.trim() || null,
      });
      const transfer = res.data.data?.transfer;
      setSubmittedTransfer(transfer);
      setTransfers(prev => [transfer, ...prev]);
      setStep(5);
      toast.success('Transfer submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshStatus = async () => {
    if (!submittedTransfer) return;
    try {
      const res = await plaidAPI.getOneTransfer(submittedTransfer.id);
      const updated = res.data.data?.transfer;
      setSubmittedTransfer(updated);
      setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch {
      toast.error('Failed to refresh status');
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedBank(null);
    setSelectedLinkedAccount(null);
    setBankSearch({ query: '', results: [], searching: false });
    setLinkForm({ accountName: '', routingNumber: '', accountNumber: '', accountType: 'checking' });
    setTransferForm(f => ({ ...f, amount: '', memo: '' }));
    setSubmittedTransfer(null);
  };

  const handleUnlink = async (id) => {
    try {
      await plaidAPI.unlinkAccount(id);
      setLinkedAccounts(prev => prev.filter(a => a.id !== id));
      toast.success('Account unlinked');
    } catch {
      toast.error('Failed to unlink account');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Bank Transfer</h1>
          <p className="text-gray-500 text-sm mt-1">Send money to an external bank account</p>
        </div>
        {step === 0 && (
          <button onClick={() => setStep(1)} className="btn-primary text-sm flex items-center gap-1.5">
            <PlusIcon /> New Transfer
          </button>
        )}
        {step > 0 && step < 5 && (
          <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeftIcon /> All Transfers
          </button>
        )}
      </div>

      {/* Demo notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5 animate-fade-up">
        <InfoIcon className="text-amber-500 shrink-0 mt-px" />
        <p className="text-amber-800 text-xs leading-relaxed">
          <span className="font-semibold">Demo mode:</span> Transfers are simulated — no real money moves. Only the last 4 digits of routing and account numbers are stored. Connect a live payment provider to enable real transfers.
        </p>
      </div>

      {step === 0 && (
        <ListStep
          transfers={transfers}
          linkedAccounts={linkedAccounts}
          onNew={() => setStep(1)}
          onSelectAccount={handleSelectExistingAccount}
          onUnlink={handleUnlink}
        />
      )}

      {step === 1 && (
        <SearchStep
          bankSearch={bankSearch}
          onSearch={handleBankSearch}
          onSelectBank={handleSelectBank}
          linkedAccounts={linkedAccounts}
          onSelectAccount={handleSelectExistingAccount}
        />
      )}

      {step === 2 && selectedBank && (
        <LinkStep
          bank={selectedBank}
          form={linkForm}
          setForm={setLinkForm}
          onLink={handleLinkAccount}
          linking={linking}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedLinkedAccount && (
        <DetailsStep
          linked={selectedLinkedAccount}
          accounts={accounts}
          form={transferForm}
          setForm={setTransferForm}
          onContinue={() => setStep(4)}
          onBack={() => setStep(selectedBank?.institution_id ? 2 : 1)}
        />
      )}

      {step === 4 && selectedLinkedAccount && (
        <ReviewStep
          linked={selectedLinkedAccount}
          accounts={accounts}
          form={transferForm}
          onSubmit={handleSubmitTransfer}
          submitting={submitting}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && submittedTransfer && (
        <ResultStep
          transfer={submittedTransfer}
          onRefresh={refreshStatus}
          onDone={reset}
        />
      )}
    </div>
  );
}

// ─── Step 0: List ─────────────────────────────────────────────────────────────
function ListStep({ transfers, linkedAccounts, onNew, onSelectAccount, onUnlink }) {
  return (
    <div className="space-y-6 animate-fade-up">

      {/* Linked accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Linked Accounts</h2>
          <button onClick={onNew} className="text-xs text-navy hover:underline font-medium">+ Add Account</button>
        </div>
        {linkedAccounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <BankIcon className="text-gray-300 mx-auto mb-2" size={28} />
            <p className="text-gray-500 text-sm">No bank accounts linked yet</p>
            <button onClick={onNew} className="btn-primary text-xs mt-3">Link a Bank Account</button>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedAccounts.map(acct => (
              <div key={acct.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-navy/30 transition-colors">
                <button className="flex items-center gap-3 flex-1 text-left" onClick={() => onSelectAccount(acct)}>
                  <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                    <BankIcon className="text-navy" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{acct.institution_name}</p>
                    <p className="text-xs text-gray-500">
                      {acct.account_name} · {acct.account_type === 'checking' ? 'Checking' : 'Savings'} ···{acct.account_number_last4}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => onUnlink(acct.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-2"
                  title="Unlink account"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transfer history */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Transfer History</h2>
        {transfers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">No transfers yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map(t => (
              <TransferCard key={t.id} transfer={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TransferCard({ transfer: t }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <BankIcon className="text-gray-500" size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{t.institution_name}</p>
          <p className="text-xs text-gray-500">
            {t.account_name} · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {t.failure_reason && (
            <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate">{t.failure_reason}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-sm font-bold text-gray-900">{formatCurrency(t.amount)}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[t.status] || t.status}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1: Bank search ──────────────────────────────────────────────────────
function SearchStep({ bankSearch, onSearch, onSelectBank, linkedAccounts, onSelectAccount }) {
  return (
    <div className="animate-fade-up space-y-5">
      <StepHeader step={1} total={4} title="Select Bank" />

      {/* Existing linked accounts shortcut */}
      {linkedAccounts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Use Existing Account</p>
          <div className="space-y-1.5">
            {linkedAccounts.slice(0, 3).map(acct => (
              <button key={acct.id}
                onClick={() => onSelectAccount(acct)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-navy/40 hover:bg-[#EEF4FF] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                  <BankIcon className="text-navy" size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{acct.institution_name}</p>
                  <p className="text-xs text-gray-500">{acct.account_name} ···{acct.account_number_last4}</p>
                </div>
                <ChevronRightIcon className="ml-auto text-gray-400" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or link a new bank</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by bank name…"
          value={bankSearch.query}
          onChange={e => onSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
          autoFocus
        />
        {bankSearch.searching && (
          <SpinnerIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Results grid */}
      {bankSearch.results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {bankSearch.results.map(bank => (
            <button
              key={bank.institution_id}
              onClick={() => onSelectBank(bank)}
              className="flex items-center gap-2.5 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-navy/40 hover:bg-[#EEF4FF] transition-all text-left"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                style={{ backgroundColor: bank.primary_color || '#003087' }}
              >
                {bank.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-gray-800 truncate">{bank.name}</span>
            </button>
          ))}
        </div>
      )}

      {bankSearch.query && !bankSearch.searching && bankSearch.results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No banks found for "{bankSearch.query}"</p>
      )}
    </div>
  );
}

// ─── Step 2: Link account ────────────────────────────────────────────────────
function LinkStep({ bank, form, setForm, onLink, linking, onBack }) {
  return (
    <div className="animate-fade-up space-y-5">
      <StepHeader step={2} total={4} title="Link Account" onBack={onBack} />

      {/* Selected bank */}
      <div className="flex items-center gap-3 bg-[#EEF4FF] border border-navy/20 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
          {bank.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-navy">{bank.name}</p>
          <p className="text-xs text-gray-500">Enter your account details below</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <FormField label="Account Nickname" required>
          <input
            type="text"
            placeholder="e.g. My Chase Checking"
            value={form.accountName}
            onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
            maxLength={60}
            className="input-field"
          />
        </FormField>

        <FormField label="Account Type">
          <select
            value={form.accountType}
            onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
            className="input-field"
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </FormField>

        <FormField label="Routing Number (9 digits)" required>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123456789"
            value={form.routingNumber}
            onChange={e => setForm(f => ({ ...f, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
            className="input-field"
          />
        </FormField>

        <FormField label="Account Number" required>
          <input
            type="text"
            inputMode="numeric"
            placeholder="•••••••• (4–17 digits)"
            value={form.accountNumber}
            onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) }))}
            className="input-field"
          />
        </FormField>

        {/* Privacy note */}
        <div className="flex items-center gap-2 text-gray-500 text-xs pt-1">
          <LockIcon />
          <span>Only the last 4 digits of your routing and account numbers are saved.</span>
        </div>
      </div>

      <button
        onClick={onLink}
        disabled={linking}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {linking ? <><SpinnerIcon className="animate-spin" /> Linking…</> : 'Link Account'}
      </button>
    </div>
  );
}

// ─── Step 3: Transfer details ─────────────────────────────────────────────────
function DetailsStep({ linked, accounts, form, setForm, onContinue, onBack }) {
  const handleAmountKey = (e) => {
    // Allow: digits, backspace, delete, tab, arrows, decimal point
    const allowed = /[\d.]|Backspace|Delete|Tab|Arrow|Home|End/;
    if (!allowed.test(e.key) && !e.ctrlKey) e.preventDefault();
  };

  return (
    <div className="animate-fade-up space-y-5">
      <StepHeader step={3} total={4} title="Transfer Details" onBack={onBack} />

      {/* Destination */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
          <BankIcon className="text-navy" size={16} />
        </div>
        <div>
          <p className="text-xs text-gray-500">Sending to</p>
          <p className="text-sm font-semibold text-gray-800">{linked.institution_name} — {linked.account_name}</p>
          <p className="text-xs text-gray-400">···{linked.account_number_last4}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        {/* Amount */}
        <FormField label="Amount" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onKeyDown={handleAmountKey}
              onChange={e => {
                const val = e.target.value.replace(/[^\d.]/g, '');
                setForm(f => ({ ...f, amount: val }));
              }}
              className="input-field pl-7"
              autoFocus
            />
          </div>
        </FormField>

        {/* From account */}
        <FormField label="From Account" required>
          <select
            value={form.fromAccountId}
            onChange={e => setForm(f => ({ ...f, fromAccountId: e.target.value }))}
            className="input-field"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.account_type === 'checking' ? 'Checking' : 'Savings'} ···{(a.account_number || a.id).slice(-4)} — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
        </FormField>

        {/* Memo */}
        <FormField label="Memo (optional)">
          <input
            type="text"
            placeholder="What's this for?"
            value={form.memo}
            onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            maxLength={255}
            className="input-field"
          />
        </FormField>
      </div>

      <button
        onClick={onContinue}
        disabled={!form.amount || parseFloat(form.amount) <= 0}
        className="btn-primary w-full"
      >
        Review Transfer
      </button>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────
function ReviewStep({ linked, accounts, form, onSubmit, submitting, onBack }) {
  const fromAccount = accounts.find(a => a.id === form.fromAccountId);
  const amount      = parseFloat(form.amount);

  return (
    <div className="animate-fade-up space-y-5">
      <StepHeader step={4} total={4} title="Review & Confirm" onBack={onBack} />

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-navy px-5 py-4">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Transfer Summary</p>
          <p className="text-white text-2xl font-bold mt-1">{formatCurrency(amount)}</p>
        </div>
        <div className="divide-y divide-gray-100">
          <SummaryRow label="To"          value={`${linked.institution_name} — ${linked.account_name}`} />
          <SummaryRow label="Account"     value={`···${linked.account_number_last4 || '——'}`} />
          <SummaryRow label="From"        value={fromAccount ? `${fromAccount.account_type === 'checking' ? 'Checking' : 'Savings'} ···${(fromAccount.account_number || fromAccount.id).slice(-4)}` : '—'} />
          {form.memo && <SummaryRow label="Memo" value={form.memo} />}
          <SummaryRow label="Est. Arrival" value="3 business days" />
        </div>
      </div>

      {/* Demo warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <InfoIcon className="text-amber-500 shrink-0 mt-px" />
        <p className="text-amber-800 text-xs">
          <span className="font-semibold">Demo transfer:</span> This will be submitted and simulated but no real money will move. The transfer will be marked failed because no real payment rail is connected.
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {submitting ? <><SpinnerIcon className="animate-spin" /> Submitting…</> : 'Confirm & Submit Transfer'}
      </button>
    </div>
  );
}

// ─── Step 5: Result ───────────────────────────────────────────────────────────
function ResultStep({ transfer, onRefresh, onDone }) {
  const [refreshing, setRefreshing] = useState(false);
  const polled = useRef(false);

  // Auto-poll once after 8 seconds
  useEffect(() => {
    if (polled.current) return;
    polled.current = true;
    const timer = setTimeout(async () => {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onRefresh]);

  const isPending    = transfer.status === 'pending' || transfer.status === 'processing';
  const isFailed     = transfer.status === 'failed';
  const isCompleted  = transfer.status === 'completed';

  return (
    <div className="animate-fade-up space-y-5">
      {/* Status header */}
      <div className={`rounded-2xl p-6 text-center ${isFailed ? 'bg-red-50 border border-red-200' : isPending ? 'bg-blue-50 border border-blue-200' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${isFailed ? 'bg-red-100' : isPending ? 'bg-blue-100' : 'bg-emerald-100'}`}>
          {isFailed    && <XCircleIcon className="text-red-500" />}
          {isPending   && <SpinnerIcon className={`${refreshing ? 'animate-spin' : ''} text-blue-500`} />}
          {isCompleted && <CheckCircleIcon className="text-emerald-500" />}
        </div>
        <p className={`font-bold text-lg ${isFailed ? 'text-red-700' : isPending ? 'text-blue-700' : 'text-emerald-700'}`}>
          {isFailed ? 'Transfer Failed' : isPending ? 'Transfer Submitted' : 'Transfer Complete'}
        </p>
        {isFailed && transfer.failure_reason && (
          <p className="text-red-600 text-sm mt-1">{transfer.failure_reason}</p>
        )}
        {isPending && (
          <p className="text-blue-600 text-sm mt-1">Your transfer is being processed…</p>
        )}
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <SummaryRow label="Amount"      value={formatCurrency(transfer.amount)} />
        <SummaryRow label="To"          value={`${transfer.institution_name} — ${transfer.account_name}`} />
        <SummaryRow label="Account"     value={`···${transfer.account_number_last4 || '——'}`} />
        <SummaryRow label="Status"      value={
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[transfer.status] || 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[transfer.status] || transfer.status}
          </span>
        } />
        <SummaryRow label="Submitted"   value={new Date(transfer.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {isPending && (
          <button
            onClick={async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }}
            disabled={refreshing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshIcon className={refreshing ? 'animate-spin' : ''} /> Refresh Status
          </button>
        )}
        <button onClick={onDone} className="flex-1 btn-primary text-sm">
          {isFailed ? 'Try Another Transfer' : 'Done'}
        </button>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function StepHeader({ step, total, title, onBack }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeftIcon />
          </button>
        )}
        <span className="text-xs text-gray-400 font-medium">Step {step} of {total}</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <SpinnerIcon className="animate-spin" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()                        { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function ChevronLeftIcon()                 { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevronRightIcon({ className })   { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function InfoIcon({ className })           { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function SearchIcon({ className })         { return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function SpinnerIcon({ className })        { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function BankIcon({ className, size = 18 }) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>; }
function LockIcon()                        { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function RefreshIcon({ className })        { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>; }
function XIcon()                           { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function XCircleIcon({ className })        { return <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }
function CheckCircleIcon({ className })    { return <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11.5 14.5 15 10"/></svg>; }
