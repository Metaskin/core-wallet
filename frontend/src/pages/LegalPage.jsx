import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

const PAGES = {
  status: {
    title: 'Service Status',
    updated: 'January 2024',
    summary:
      'Real-time operational status for MCT Bank platform services, APIs, and core infrastructure components.',
    sections: [
      {
        heading: 'Current Platform Status',
        body: `All MCT Bank systems are currently operational. Core services including account management, fund transfers, card issuance, and authentication are running within normal parameters.

Platform health is monitored continuously. Any service degradation will be reflected on this page within five minutes of detection.`,
      },
      {
        heading: 'Recent Incidents',
        body: `No incidents have been recorded in the past 90 days. MCT Bank targets 99.9% uptime across all production services. Historical incident records are retained for a period of twelve months.`,
      },
      {
        heading: 'Scheduled Maintenance',
        body: `Planned maintenance windows are communicated to affected users by email and in-app notification no fewer than 48 hours in advance. Maintenance is scheduled during low-traffic periods to minimise disruption.`,
      },
    ],
  },

  legal: {
    title: 'Legal Information',
    updated: 'January 2024',
    summary:
      'A directory of the legal agreements, disclosures, and regulatory documents that govern your use of Metropolitan Capital & Trust Bank.',
    sections: [
      {
        heading: 'About These Documents',
        body: `This section provides a reference index for all legal documents applicable to MCT Bank users. The agreements listed here form the complete contract between Metropolitan Capital & Trust Bank and you as a user of our platform.

If you have questions regarding any of these documents, contact our legal team at legal@mctbank.online.`,
      },
      {
        heading: 'Governing Law',
        body: `Metropolitan Capital & Trust Bank is incorporated in the State of Delaware, United States of America. Unless otherwise required by applicable local law, all agreements are governed by the laws of the State of Delaware, without regard to conflict of law provisions.`,
      },
      {
        heading: 'Dispute Resolution',
        body: `MCT Bank is committed to resolving user disputes fairly and efficiently. Users are encouraged to contact support before initiating formal proceedings. Full details of the dispute resolution process, including any binding arbitration provisions, are contained in the Terms of Service.`,
      },
    ],
  },

  licenses: {
    title: 'Regulatory Licenses',
    updated: 'January 2024',
    summary:
      "MCT Bank's regulatory registrations, money transmission licenses, and disclosures relating to our licensed banking partners.",
    sections: [
      {
        heading: 'Money Services Business',
        body: `Metropolitan Capital & Trust Bank is registered as a Money Services Business with the Financial Crimes Enforcement Network (FinCEN), U.S. Department of the Treasury.

MCT Bank holds money transmission licenses in the jurisdictions where such licensure is required. A full and current list of active licenses is available on request by contacting compliance@mctbank.online.`,
      },
      {
        heading: 'Banking Services & Card Issuance',
        body: `Deposit account and banking services are facilitated through MCT Bank's regulated banking partners. Visa® Prepaid Debit Cards are issued by partner financial institutions that are members of the FDIC, subject to the applicable cardholder agreement. Metropolitan Capital & Trust Bank partners with FDIC-insured institutions to provide deposit insurance coverage up to the maximum amount permitted by law.`,
      },
      {
        heading: 'Compliance Contact',
        body: `Regulatory inquiries and requests for license documentation should be directed to MCT Bank's Compliance department at compliance@mctbank.online. MCT Bank maintains all records in accordance with applicable federal and state requirements and cooperates fully with regulatory examinations.`,
      },
    ],
  },

  privacy: {
    title: 'Privacy Notice',
    updated: 'January 2024',
    summary:
      'This Privacy Notice describes how Metropolitan Capital & Trust Bank collects, uses, retains, and shares your personal information, and the rights you hold over that data.',
    sections: [
      {
        heading: 'Information We Collect',
        body: `MCT Bank collects personal information you provide when registering an account, completing identity verification, conducting transactions, or contacting support. This includes your full name, email address, phone number, date of birth, government-issued identification, and financial account details.

We also collect technical information automatically, including device identifiers, IP addresses, browser type, session data, and transaction metadata. This information is necessary to operate, secure, and improve the platform.`,
      },
      {
        heading: 'How We Use Your Information',
        body: `Your information is used to provide and maintain MCT Bank services, verify your identity, authorise and process transactions, detect and prevent fraud, comply with legal and regulatory obligations, and communicate with you about your account.

MCT Bank does not sell your personal information to third parties for their own commercial purposes. We may share information with service providers who assist in platform operations under appropriate data processing agreements.`,
      },
      {
        heading: 'Your Rights and Data Retention',
        body: `You have the right to access, correct, and request deletion of your personal information. Requests can be submitted to privacy@mctbank.online or through your account settings. MCT Bank will respond within the timeframes required by applicable law.

Some information may be retained beyond account closure where required by financial regulation, fraud prevention obligations, or legal process.`,
      },
    ],
  },

  'privacy-choices': {
    title: 'Your Privacy Choices',
    updated: 'January 2024',
    summary:
      'Manage how MCT Bank uses your personal information, including communication preferences, data sharing controls, and your right to request data deletion.',
    sections: [
      {
        heading: 'Communication Preferences',
        body: `You control which communications you receive from MCT Bank. Marketing and promotional messages can be unsubscribed from at any time via the unsubscribe link in any message, or through the Notifications section of your account settings. Transactional and security notifications are required for safe account operation and cannot be disabled while your account remains active.`,
      },
      {
        heading: 'Data Sharing Opt-Out',
        body: `MCT Bank does not sell your personal information. If you reside in a jurisdiction that provides a right to opt out of the sharing of your data for cross-context behavioural advertising purposes, you may exercise that right by contacting privacy@mctbank.online or adjusting your preferences in account settings.`,
      },
      {
        heading: 'Account Data and Deletion',
        body: `You may request an export of all personal data associated with your MCT Bank account at any time. Account deletion requests can be initiated from the Settings page or by contacting support. Please note that certain records may be retained for the period required by applicable financial regulation, even after an account is closed.`,
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    updated: 'January 2024',
    summary:
      'These Terms of Service constitute the binding agreement between you and Metropolitan Capital & Trust Bank governing your access to and use of the MCT Bank platform.',
    sections: [
      {
        heading: 'Account Eligibility and Responsibility',
        body: `To open an MCT Bank account, you must be at least 18 years of age and a resident of a supported jurisdiction. You are solely responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

You agree to provide accurate, complete, and current information at registration and to update that information as necessary to keep it accurate.`,
      },
      {
        heading: 'Acceptable Use',
        body: `MCT Bank may only be used for lawful purposes and in accordance with these terms. You agree not to use the platform to initiate, facilitate, or disguise transactions that are illegal, fraudulent, or in violation of applicable anti-money laundering, sanctions, or consumer protection regulations.

MCT Bank reserves the right to decline transactions, suspend accounts, or restrict access where required by law, regulation, or internal policy, without prior notice where immediate action is necessary.`,
      },
      {
        heading: 'Limitation of Liability',
        body: `To the fullest extent permitted by applicable law, Metropolitan Capital & Trust Bank and its affiliates, officers, and employees shall not be liable for indirect, incidental, consequential, or punitive damages arising from your use of, or inability to use, the platform. MCT Bank's total cumulative liability for claims arising under these terms shall not exceed the fees paid by you to MCT Bank in the twelve months immediately preceding the event giving rise to the claim.`,
      },
    ],
  },

  security: {
    title: 'Security',
    updated: 'January 2024',
    summary:
      'How MCT Bank protects your account and data, the controls available to you, and how to report a potential security vulnerability.',
    sections: [
      {
        heading: 'Platform Security Practices',
        body: `MCT Bank encrypts all data in transit using TLS 1.2 or higher and applies encryption at rest across all databases and storage systems. Account passwords are hashed using modern, computationally intensive algorithms and are never stored in recoverable form.

Multi-factor authentication (MFA) is available to all users and is strongly recommended. Suspicious sign-in attempts trigger automatic protective measures including temporary account locks and real-time user notifications.`,
      },
      {
        heading: 'Fraud Detection and Dispute Resolution',
        body: `MCT Bank operates real-time transaction monitoring to identify and interrupt potentially fraudulent activity. Transactions that fall outside your established usage patterns may require additional verification before processing.

If you notice unauthorised transactions or account activity, contact MCT Bank Support immediately. Disputes are reviewed and resolved within the timeframes required by applicable regulation and network rules.`,
      },
      {
        heading: 'Responsible Disclosure',
        body: `MCT Bank values the work of the independent security research community. If you believe you have identified a vulnerability in our platform, please report it to security@mctbank.online. Provide a clear description of the issue, steps to reproduce, and any relevant supporting material.

Please do not attempt to exploit vulnerabilities, access user data, or disrupt platform services in the course of your research.`,
      },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    updated: 'January 2024',
    summary:
      'This Cookie Policy explains the cookies and similar technologies MCT Bank uses, why we use them, and the controls available to you.',
    sections: [
      {
        heading: 'How We Use Cookies',
        body: `MCT Bank uses cookies and similar technologies to operate the platform, remember your preferences, improve user experience, and maintain security.

Essential cookies are strictly necessary for the platform to function. They enable authentication sessions, CSRF protection, and other core security features. These cookies cannot be declined without affecting your ability to use MCT Bank.

Analytics cookies help us understand aggregated, anonymised usage patterns so we can improve the platform. Data collected via analytics is not used to identify individual users.`,
      },
      {
        heading: 'Managing Your Cookie Preferences',
        body: `You can manage or block most cookies through your browser settings. Please note that disabling essential cookies may prevent core platform features from functioning correctly or prevent you from maintaining a signed-in session.

MCT Bank honours Do Not Track (DNT) browser signals where technically practicable.`,
      },
      {
        heading: 'Third-Party Technologies',
        body: `Some MCT Bank pages integrate with third-party service providers that may set their own cookies or use similar tracking technologies. These providers operate under their own privacy and cookie policies, which MCT Bank does not control. A full list of third-party sub-processors is available on request at privacy@mctbank.online.`,
      },
    ],
  },
};

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function MCTLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#003087"/>
      <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
      <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
      <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}

export default function LegalPage({ slug }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const page = PAGES[slug];

  if (!page) return <Navigate to="/" replace />;

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <div className="min-h-screen bg-[#0a0b0a] text-white">

      {/* Standalone top nav — unauthenticated only */}
      {!user && (
        <header className="sticky top-0 z-40 bg-[#0a0b0a]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 select-none">
              <MCTLogo />
              <div className="leading-none">
                <div className="font-bold text-white text-xs tracking-tight leading-none">Metropolitan Capital</div>
                <div className="text-white/40 text-[8px] tracking-widest uppercase leading-none mt-0.5">&amp; Trust Bank</div>
              </div>
            </Link>
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-white/35 hover:text-white text-xs transition-colors"
            >
              <ChevronLeft />
              Back
            </button>
          </div>
        </header>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Back button — authenticated in-app context */}
        {user && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-sm mb-8 transition-colors"
          >
            <ChevronLeft />
            Back
          </button>
        )}

        {/* Page header */}
        <div className="mb-10">
          <p className="text-blue-400/60 text-[10px] uppercase tracking-[0.15em] font-semibold mb-3">
            MCT Bank Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
            {page.title}
          </h1>
          <p className="text-white/45 text-base leading-relaxed mb-3 max-w-xl">{page.summary}</p>
          <p className="text-white/20 text-xs">Last updated: {page.updated}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {page.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-white font-semibold text-[17px] mb-3 pb-2.5 border-b border-white/[0.07]">
                {section.heading}
              </h2>
              <div className="text-white/48 text-sm leading-7 whitespace-pre-line">
                {section.body.trim()}
              </div>
            </section>
          ))}
        </div>

        {/* Cross-links to other legal pages */}
        <div className="mt-16 pt-8 border-t border-white/[0.07]">
          <p className="text-white/20 text-[10px] uppercase tracking-widest mb-4 font-medium">
            Other legal documents
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PAGES)
              .filter(([k]) => k !== slug)
              .map(([k, p]) => (
                <Link
                  key={k}
                  to={`/${k}`}
                  className="text-white/30 hover:text-blue-400 text-xs transition-colors
                             bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06]
                             hover:border-blue-500/20 rounded-lg px-3 py-1.5"
                >
                  {p.title}
                </Link>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
