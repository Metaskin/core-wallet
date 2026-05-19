import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { settingsAPI, securityAPI } from '../api';
import SetPinModal from '../components/modals/SetPinModal';
import toast from 'react-hot-toast';

// ─── Navigation ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'profile',       label: 'Profile',       icon: UserIcon       },
  { id: 'security',      label: 'Security',      icon: ShieldIcon     },
  { id: 'notifications', label: 'Notifications', icon: BellIcon       },
  { id: 'cards',         label: 'Cards',         icon: CardIcon       },
  { id: 'accounts',      label: 'Accounts',      icon: BuildingIcon   },
  { id: 'payments',      label: 'Payments',      icon: TransferIcon   },
  { id: 'financial',     label: 'Financial',     icon: ChartIcon      },
  { id: 'privacy',       label: 'Privacy',       icon: LockIcon       },
];

export default function Settings() {
  const [active, setActive] = useState('profile');
  const { user, changePassword, changeEmail } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, security, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
        {/* Sidebar nav */}
        <nav className="lg:w-52 shrink-0">
          {/* Mobile: horizontal scroll */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                  ${active === id
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
          {/* Desktop: vertical list */}
          <div className="hidden lg:flex flex-col gap-1 bank-card p-2">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${active === id
                    ? 'bg-navy text-white'
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {active === 'profile'       && <ProfileSection user={user} />}
          {active === 'security'      && <SecuritySection user={user} changePassword={changePassword} />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'cards'         && <CardsSection />}
          {active === 'accounts'      && <AccountsSection />}
          {active === 'payments'      && <PaymentsSection />}
          {active === 'financial'     && <FinancialSection />}
          {active === 'privacy'       && <PrivacySection user={user} changeEmail={changeEmail} />}
        </div>
      </div>
    </div>
  );
}

// ── 1. Profile & Identity ─────────────────────────────────────────────────────

const EMPTY_PROFILE = {
  first_name: '', last_name: '', phone: '', date_of_birth: '',
  nationality: '', occupation: '', employer: '',
  address_line1: '', address_line2: '', city: '', state: '', zip_code: '',
  country: 'United States', preferred_language: 'en', timezone: 'America/New_York',
};

function ProfileSection({ user }) {
  const [form,    setForm]    = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getProfile()
      .then(({ data: res }) => {
        const p = res.data || {};
        setForm({
          first_name:    p.first_name    || '',
          last_name:     p.last_name     || '',
          phone:         p.phone         || '',
          date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
          nationality:   p.nationality   || '',
          occupation:    p.occupation    || '',
          employer:      p.employer      || '',
          address_line1: p.address_line1 || '',
          address_line2: p.address_line2 || '',
          city:          p.city          || '',
          state:         p.state         || '',
          zip_code:      p.zip_code      || '',
          country:       p.country       || 'United States',
          preferred_language: p.preferred_language || 'en',
          timezone:      p.timezone      || 'America/New_York',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.updateProfile(form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-3">{[0,1,2,3].map(i => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <SectionHeader title="Profile & Identity" desc="Your personal information and contact details" icon={<UserIcon size={16} />} />

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name">
            <input className="input-base" value={form.first_name} onChange={set('first_name')} placeholder="First name" />
          </Field>
          <Field label="Last Name">
            <input className="input-base" value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
          </Field>
        </div>
        <Field label="Phone Number">
          <input className="input-base" type="tel" value={form.phone} onChange={set('phone')} placeholder="(614) 555-0194" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth">
            <input className="input-base" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </Field>
          <Field label="Nationality">
            <input className="input-base" value={form.nationality} onChange={set('nationality')} placeholder="American" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Occupation">
            <input className="input-base" value={form.occupation} onChange={set('occupation')} placeholder="IT Consultant" />
          </Field>
          <Field label="Employer">
            <input className="input-base" value={form.employer} onChange={set('employer')} placeholder="Company name" />
          </Field>
        </div>
      </div>

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</p>
        <Field label="Address Line 1">
          <input className="input-base" value={form.address_line1} onChange={set('address_line1')} placeholder="4721 Riverside Dr" />
        </Field>
        <Field label="Address Line 2 (optional)">
          <input className="input-base" value={form.address_line2} onChange={set('address_line2')} placeholder="Apt, Suite, etc." />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City">
            <input className="input-base" value={form.city} onChange={set('city')} placeholder="Columbus" />
          </Field>
          <Field label="State">
            <input className="input-base" value={form.state} onChange={set('state')} placeholder="Ohio" />
          </Field>
          <Field label="ZIP">
            <input className="input-base" value={form.zip_code} onChange={set('zip_code')} placeholder="43219" />
          </Field>
        </div>
        <Field label="Country">
          <input className="input-base" value={form.country} onChange={set('country')} placeholder="United States" />
        </Field>
      </div>

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferences</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Language">
            <select className="input-base" value={form.preferred_language} onChange={set('preferred_language')}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="tr">Türkçe</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select className="input-base" value={form.timezone} onChange={set('timezone')}>
              {[
                ['America/New_York',    'Eastern (ET)'],
                ['America/Chicago',     'Central (CT)'],
                ['America/Denver',      'Mountain (MT)'],
                ['America/Los_Angeles', 'Pacific (PT)'],
                ['Europe/London',       'London (GMT)'],
                ['Europe/Istanbul',     'Istanbul (TRT)'],
                ['Asia/Dubai',          'Dubai (GST)'],
              ].map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Spinner /> : null}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

// ── 2. Security Center ────────────────────────────────────────────────────────

const EMPTY_SEC = { two_factor_enabled: false, two_factor_method: 'none', auto_logout_minutes: 30, biometric_enabled: false };

function SecuritySection({ user, changePassword }) {
  const [secSettings, setSecSettings] = useState(EMPTY_SEC);
  const [loadingSec,  setLoadingSec]  = useState(true);
  const [savingSec,   setSavingSec]   = useState(false);
  const [hasPin,      setHasPin]      = useState(null);
  const [showPin,     setShowPin]     = useState(false);

  useEffect(() => {
    Promise.all([
      settingsAPI.getSecuritySettings(),
      securityAPI.hasPin(),
    ]).then(([secRes, pinRes]) => {
      const s = secRes.data?.data || {};
      setSecSettings({
        two_factor_enabled:  s.two_factor_enabled  ?? false,
        two_factor_method:   s.two_factor_method   || 'none',
        auto_logout_minutes: s.auto_logout_minutes  ?? 30,
        biometric_enabled:   s.biometric_enabled    ?? false,
      });
      setHasPin(pinRes.data?.data?.hasPin ?? false);
    }).catch(() => toast.error('Failed to load security settings'))
      .finally(() => setLoadingSec(false));
  }, []);

  const setSec = (field) => (val) => setSecSettings(s => ({ ...s, [field]: val }));

  const handleSaveSec = async () => {
    setSavingSec(true);
    try {
      await settingsAPI.updateSecuritySettings(secSettings);
      toast.success('Security settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingSec(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Security Center" desc="Manage your authentication and account access" icon={<ShieldIcon size={16} />} />

      {/* Change Password */}
      <ChangePasswordSection changePassword={changePassword} />

      {/* Transaction PIN */}
      <div className="bank-card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
            <KeyIcon />
          </div>
          <div>
            <p className="text-gray-800 font-semibold text-sm">Transaction PIN</p>
            <p className="text-gray-400 text-xs mt-0.5">Required when viewing full card details</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasPin === null ? <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              : hasPin      ? <div className="w-2 h-2 rounded-full bg-bank-green" />
                            : <div className="w-2 h-2 rounded-full bg-bank-amber animate-pulse" />}
            <span className="text-gray-600 text-sm">
              {hasPin === null ? 'Checking…' : hasPin ? 'PIN is active' : 'No PIN set'}
            </span>
          </div>
          <button onClick={() => setShowPin(true)} className="btn-primary text-xs py-1.5 px-3">
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
        </div>
      </div>

      {/* 2FA + auto-logout + biometric */}
      {loadingSec ? (
        <div className="h-40 rounded-xl shimmer" />
      ) : (
        <div className="bank-card p-5 space-y-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
              <ShieldIcon size={15} />
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm">Access Controls</p>
              <p className="text-gray-400 text-xs mt-0.5">Authentication and session settings</p>
            </div>
          </div>

          <ToggleRow
            label="Two-Factor Authentication"
            desc="Add an extra layer of login security"
            value={secSettings.two_factor_enabled}
            onChange={v => setSec('two_factor_enabled')(v)}
          />

          {secSettings.two_factor_enabled && (
            <Field label="2FA Method">
              <select
                className="input-base"
                value={secSettings.two_factor_method}
                onChange={e => setSec('two_factor_method')(e.target.value)}
              >
                <option value="totp">Authenticator App (TOTP)</option>
                <option value="sms">SMS Text Message</option>
              </select>
            </Field>
          )}

          <ToggleRow
            label="Biometric Login"
            desc="Use Face ID or fingerprint to sign in"
            value={secSettings.biometric_enabled}
            onChange={v => setSec('biometric_enabled')(v)}
          />

          <Field label="Auto-Logout">
            <select
              className="input-base"
              value={secSettings.auto_logout_minutes}
              onChange={e => setSec('auto_logout_minutes')(parseInt(e.target.value))}
            >
              {[[5,'5 minutes'],[15,'15 minutes'],[30,'30 minutes'],[60,'1 hour'],[120,'2 hours'],[0,'Never']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>

          <button onClick={handleSaveSec} disabled={savingSec} className="btn-primary text-sm">
            {savingSec ? <Spinner /> : null}
            {savingSec ? 'Saving…' : 'Save Security Settings'}
          </button>
        </div>
      )}

      {showPin && (
        <SetPinModal
          isChanging={!!hasPin}
          onClose={() => setShowPin(false)}
          onSaved={() => { setHasPin(true); setShowPin(false); }}
        />
      )}
    </div>
  );
}

// ── 3. Notifications ──────────────────────────────────────────────────────────

const EMPTY_PREFS = {
  push_enabled: true, email_enabled: true, sms_enabled: false,
  deposit_alerts: true, transaction_alerts: true, security_alerts: true,
  weekly_summary: true, monthly_summary: true, marketing: false,
  quiet_hours_enabled: false, quiet_hours_start: '22:00', quiet_hours_end: '08:00',
};

function NotificationsSection() {
  const [prefs,   setPrefs]   = useState(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getNotifPrefs()
      .then(({ data: res }) => setPrefs({ ...EMPTY_PREFS, ...(res.data || {}) }))
      .catch(() => toast.error('Failed to load notification preferences'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field) => setPrefs(p => ({ ...p, [field]: !p[field] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateNotifPrefs(prefs);
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}</div>;

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Control how and when you receive alerts" icon={<BellIcon size={16} />} />

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Channels</p>
        <ToggleRow label="Push Notifications"  desc="Alerts on this device"           value={prefs.push_enabled}  onChange={() => toggle('push_enabled')} />
        <ToggleRow label="Email Notifications" desc="Summaries to your email"         value={prefs.email_enabled} onChange={() => toggle('email_enabled')} />
        <ToggleRow label="SMS Alerts"          desc="Text messages to your phone"     value={prefs.sms_enabled}   onChange={() => toggle('sms_enabled')} />
      </div>

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alert Types</p>
        <ToggleRow label="Deposits"           desc="Incoming credits and deposits"    value={prefs.deposit_alerts}     onChange={() => toggle('deposit_alerts')} />
        <ToggleRow label="Transactions"       desc="Purchases, payments, transfers"   value={prefs.transaction_alerts} onChange={() => toggle('transaction_alerts')} />
        <ToggleRow label="Security Alerts"    desc="Sign-ins, password changes"       value={prefs.security_alerts}    onChange={() => toggle('security_alerts')} />
        <ToggleRow label="Weekly Summary"     desc="Weekly spending overview"         value={prefs.weekly_summary}     onChange={() => toggle('weekly_summary')} />
        <ToggleRow label="Monthly Statement"  desc="Monthly account summary"          value={prefs.monthly_summary}    onChange={() => toggle('monthly_summary')} />
        <ToggleRow label="Marketing & Offers" desc="Promotions and special offers"    value={prefs.marketing}          onChange={() => toggle('marketing')} />
      </div>

      <div className="bank-card p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quiet Hours</p>
        <ToggleRow
          label="Enable Quiet Hours"
          desc="Pause non-critical alerts during set hours"
          value={prefs.quiet_hours_enabled}
          onChange={() => toggle('quiet_hours_enabled')}
        />
        {prefs.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time">
              <input type="time" className="input-base"
                value={prefs.quiet_hours_start || '22:00'}
                onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))}
              />
            </Field>
            <Field label="End Time">
              <input type="time" className="input-base"
                value={prefs.quiet_hours_end || '08:00'}
                onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))}
              />
            </Field>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <Spinner /> : null}
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}

// ── 4. Cards ──────────────────────────────────────────────────────────────────

function CardsSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionHeader title="Card Management" desc="Manage your debit cards and card services" icon={<CardIcon size={16} />} />
      <div className="grid grid-cols-1 gap-3">
        {[
          { title: 'My Cards',        desc: 'View, freeze, or manage your cards',     path: '/cards',          icon: '💳' },
          { title: 'Card Services',   desc: 'Report lost, request replacement',        path: '/card-services',  icon: '🔄' },
          { title: 'Travel Notice',   desc: 'Notify us before you travel abroad',      path: '/travel-notice',  icon: '✈️' },
        ].map(({ title, desc, path, icon }) => (
          <button
            key={title}
            onClick={() => navigate(path)}
            className="bank-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
          >
            <span className="text-2xl w-10 text-center">{icon}</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 5. Accounts ───────────────────────────────────────────────────────────────

function AccountsSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionHeader title="Accounts" desc="Manage your checking and savings accounts" icon={<BuildingIcon size={16} />} />
      <div className="grid grid-cols-1 gap-3">
        {[
          { title: 'My Accounts',     desc: 'View balances and account details',        path: '/accounts',     icon: '🏦' },
          { title: 'Beneficiaries',   desc: 'Manage saved transfer recipients',          path: '/beneficiaries', icon: '👥' },
        ].map(({ title, desc, path, icon }) => (
          <button
            key={title}
            onClick={() => navigate(path)}
            className="bank-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
          >
            <span className="text-2xl w-10 text-center">{icon}</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 6. Transfers & Payments ───────────────────────────────────────────────────

function PaymentsSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionHeader title="Transfers & Payments" desc="Manage autopay, wires, and bill pay" icon={<TransferIcon size={16} />} />
      <div className="grid grid-cols-1 gap-3">
        {[
          { title: 'Autopay',       desc: 'Manage recurring automatic payments',   path: '/autopay',       icon: '🔁' },
          { title: 'Bill Pay',      desc: 'Pay bills and manage billers',           path: '/bill-pay',      icon: '📋' },
          { title: 'Wire Transfer', desc: 'Send domestic and international wires',  path: '/wire-transfer', icon: '🌐' },
        ].map(({ title, desc, path, icon }) => (
          <button
            key={title}
            onClick={() => navigate(path)}
            className="bank-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
          >
            <span className="text-2xl w-10 text-center">{icon}</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 7. Financial Tools ────────────────────────────────────────────────────────

function FinancialSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionHeader title="Financial Tools" desc="Monitor and grow your financial health" icon={<ChartIcon size={16} />} />
      <div className="grid grid-cols-1 gap-3">
        {[
          { title: 'Credit Score',    desc: 'Monitor your credit health',            path: '/credit-score', icon: '📊' },
          { title: 'Investments',     desc: 'View your investment portfolio',         path: '/investments',  icon: '📈' },
          { title: 'Cashback',        desc: 'Track rewards and redeem cashback',      path: '/cashback',     icon: '💰' },
          { title: 'Loans & Mortgage',desc: 'View loan options and calculator',       path: '/loans',        icon: '🏠' },
        ].map(({ title, desc, path, icon }) => (
          <button
            key={title}
            onClick={() => navigate(path)}
            className="bank-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
          >
            <span className="text-2xl w-10 text-center">{icon}</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 8. Privacy & Legal ────────────────────────────────────────────────────────

function PrivacySection({ user, changeEmail }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Privacy & Legal" desc="Email, data, and account preferences" icon={<LockIcon size={16} />} />

      <ChangeEmailSection user={user} changeEmail={changeEmail} />

      <div className="bank-card p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legal</p>
        {[
          { label: 'Privacy Policy',     href: '#' },
          { label: 'Terms of Service',   href: '#' },
          { label: 'Cookie Policy',      href: '#' },
          { label: 'FDIC Disclosure',    href: '#' },
        ].map(({ label, href }) => (
          <a key={label} href={href}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-gray-600 hover:text-navy text-sm transition-colors">
            {label}
            <ChevronRightIcon />
          </a>
        ))}
      </div>

      <div className="bank-card p-5 border border-red-100">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
        <p className="text-gray-500 text-xs mb-4">
          Closing your account is permanent and cannot be undone. All data will be removed after a 30-day grace period.
        </p>
        <button
          className="text-bank-red border border-red-200 rounded-xl px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors"
          onClick={() => toast.error('Please contact support to close your account')}
        >
          Request Account Closure
        </button>
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function SectionHeader({ title, desc, icon }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-navy shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-gray-900 font-bold text-lg">{title}</h2>
        <p className="text-gray-400 text-xs">{desc}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <p className="text-gray-700 text-sm font-medium">{label}</p>
        {desc && <p className="text-gray-400 text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
          ${value ? 'bg-navy' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
          ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ChangePasswordSection({ changePassword }) {
  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setSuccess(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8)          return toast.error('Min. 8 characters');
    if (form.newPassword !== form.confirm)     return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
          <LockIcon size={15} />
        </div>
        <div>
          <p className="text-gray-800 font-semibold text-sm">Change Password</p>
          <p className="text-gray-400 text-xs mt-0.5">Use a strong password you don't use anywhere else</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Current Password">
          <input type="password" className="input-base" placeholder="••••••••"
            value={form.currentPassword} onChange={update('currentPassword')} autoComplete="current-password" required />
        </Field>
        <Field label="New Password">
          <input type="password" className="input-base" placeholder="Min. 8 characters"
            value={form.newPassword} onChange={update('newPassword')} autoComplete="new-password" required minLength={8} />
          <PasswordStrength password={form.newPassword} />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" className="input-base" placeholder="Repeat new password"
            value={form.confirm} onChange={update('confirm')} autoComplete="new-password" required />
          {form.confirm && form.newPassword !== form.confirm && (
            <p className="text-bank-red text-xs mt-1">Passwords do not match</p>
          )}
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading || (form.confirm && form.newPassword !== form.confirm)} className="btn-primary text-sm">
            {loading ? <Spinner /> : null}
            {loading ? 'Updating…' : 'Update Password'}
          </button>
          {success && <span className="text-bank-green text-sm flex items-center gap-1"><CheckIcon /> Saved</span>}
        </div>
      </form>
    </div>
  );
}

function ChangeEmailSection({ user, changeEmail }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) return toast.error('That is already your current email');
    setLoading(true);
    try {
      await changeEmail(newEmail);
      setSuccess(true);
      setNewEmail('');
      toast.success('Email updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
          <MailIcon />
        </div>
        <div>
          <p className="text-gray-800 font-semibold text-sm">Change Email</p>
          <p className="text-gray-400 text-xs mt-0.5">Current: <span className="text-gray-600 font-medium">{user?.email}</span></p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="New Email Address">
          <input type="email" className="input-base" placeholder="new@example.com"
            value={newEmail} onChange={e => { setNewEmail(e.target.value); setSuccess(false); }} required />
        </Field>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary text-sm">
            {loading ? <Spinner /> : null}
            {loading ? 'Updating…' : 'Update Email'}
          </button>
          {success && <span className="text-bank-green text-sm flex items-center gap-1"><CheckIcon /> Saved</span>}
        </div>
      </form>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [password.length >= 8, password.length >= 12, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const levels = [{ l: 'Weak', c: '#C0392B' },{ l: 'Weak', c: '#C0392B' },{ l: 'Fair', c: '#B8860B' },{ l: 'Good', c: '#0072CE' },{ l: 'Strong', c: '#1A7A4A' },{ l: 'Strong', c: '#1A7A4A' }];
  const { l, c } = levels[score] || levels[0];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3,4].map(i => <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i < score ? c : '#E5E7EB' }} />)}
      </div>
      <p className="text-[10px]" style={{ color: c }}>{l}</p>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function UserIcon({ size = 16 })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function ShieldIcon({ size = 16 })   { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function BellIcon({ size = 16 })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function CardIcon({ size = 16 })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function BuildingIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>; }
function TransferIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>; }
function ChartIcon({ size = 16 })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function LockIcon({ size = 16 })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function KeyIcon()                   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function MailIcon()                  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function CheckIcon()                 { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ChevronRightIcon()          { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function Spinner()                   { return <svg className="animate-spin mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
