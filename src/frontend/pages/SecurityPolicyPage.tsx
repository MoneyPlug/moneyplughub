import React, { useState } from 'react';
import { 
  Shield, Lock, Key, CheckCircle, AlertTriangle, FileText, 
  Server, Eye, RefreshCw, Smartphone, Database, CheckSquare, Search, Copy, Check 
} from 'lucide-react';

export const SecurityPolicyPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const sections = [
    {
      num: 1,
      title: 'Purpose',
      icon: <Shield className="w-5 h-5 text-plug-accent" />,
      content: 'This policy defines the security standards for Plug In OS to ensure the confidentiality, integrity, and availability of business assets and consumer data.'
    },
    {
      num: 2,
      title: 'Scope',
      icon: <Eye className="w-5 h-5 text-sky-400" />,
      content: 'This policy applies to:\n• All personnel and contractors with access to Plug In OS information systems (Notion workspace, email, hosting, automations, and connected services).\n• All devices used to access company systems (mobile, laptop/desktop).\n• All data processed or stored in connected tools and databases.'
    },
    {
      num: 3,
      title: 'Roles & Responsibilities',
      icon: <CheckSquare className="w-5 h-5 text-emerald-400" />,
      content: '• Owner / Administrator: Maintains this policy, reviews access, and approves exceptions.\n• All Personnel: Follow security requirements, report incidents, and complete required security steps (passwords/MFA, updates).\n• Vendors / Service Providers: Must meet reasonable security standards and only access data necessary to provide services.'
    },
    {
      num: 4,
      title: 'Access Control',
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      content: '• Unique Credentials: Each person must use unique credentials for every service. Shared logins are prohibited.\n• Password Standard: Use long passphrases where available; never reuse passwords across services. Store credentials in an approved password manager when possible.\n• Multi‑Factor Authentication (MFA): MFA is required for all administrative and developer accounts (e.g., Notion, email, hosting platforms, automation platforms).\n• Least Privilege: Access to sensitive data is granted only to the extent necessary to perform assigned job duties. Access is reviewed periodically and removed promptly when no longer needed.\n• Session & Device Lock: Devices must use a screen lock (PIN/biometric) and auto-lock when idle.'
    },
    {
      num: 5,
      title: 'Data Classification & Handling',
      icon: <Database className="w-5 h-5 text-purple-400" />,
      content: '5.1 Data Categories:\n• Public: Intended for public distribution.\n• Internal: Operational information not meant for public release.\n• Sensitive: Consumer data, authentication data, financial data, or anything that could cause harm if exposed.\n\n5.2 Handling Requirements:\n• Minimize Collection: Collect only the data needed for the stated purpose.\n• Secure Sharing: Do not post sensitive data in public channels or unsecured documents. Use access-controlled pages and links; avoid wide-sharing unless required.\n• Secrets & Keys: API keys, tokens, and passwords must never be stored in plain text inside broadly shared pages. Rotate secrets if exposure is suspected.'
    },
    {
      num: 6,
      title: 'Data Protection',
      icon: <Key className="w-5 h-5 text-rose-400" />,
      content: '• Encryption in Transit: All data in transit must be protected using TLS 1.2 or better.\n• Encryption at Rest: All consumer data received via API or stored in databases must be encrypted at-rest using industry-standard protocols (or managed encryption provided by trusted platforms).\n• Backups: Where platform features allow, ensure backups/version history are enabled and protected with appropriate access controls.'
    },
    {
      num: 7,
      title: 'Operational Security',
      icon: <Server className="w-5 h-5 text-sky-400" />,
      content: '• Vulnerability Management: Use secure platform defaults provided by infrastructure partners (e.g., Notion, Framer) and keep software and systems updated to the latest secure versions.\n• Secure Configuration: Disable unused accounts/integrations. Use least-permission scopes for integrations.\n• Privacy & Consent: Obtain explicit, informed consent from consumers before collecting or processing their data.'
    },
    {
      num: 8,
      title: 'Incident Response',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      content: '• Reporting: Any suspected security incident (lost device, suspicious login, data exposure) must be reported as soon as possible.\n• Containment & Recovery: Revoke/rotate credentials, remove compromised integrations, and restore access safely.\n• Documentation: Record what happened, what data may have been impacted, and the remediation steps taken.'
    },
    {
      num: 9,
      title: 'Data Retention & Deletion',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
      content: '• Retention: Retain consumer data only as long as necessary for business purposes and legal obligations.\n• Deletion: Upon request, or when no longer required, data is securely deleted in accordance with applicable laws and platform capabilities.'
    },
    {
      num: 10,
      title: 'Compliance & Review',
      icon: <FileText className="w-5 h-5 text-plug-accent" />,
      content: '• This policy is reviewed at least annually or whenever a significant change in infrastructure occurs.\n• Personnel are responsible for adhering to these standards to maintain the organization’s security posture.'
    },
    {
      num: 11,
      title: 'Exceptions',
      icon: <Shield className="w-5 h-5 text-pink-400" />,
      content: 'Any exception to this policy must be explicitly approved by the Owner/Administrator, documented, and time-bound.'
    }
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
                🛡️ Security & Compliance
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                Active Policy v1.0
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Plug In OS Security Policy
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
              Confidentiality, integrity, and availability standards for business assets and consumer data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-plug-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Policy Compliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSections.map((sec) => (
          <div key={sec.num} className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {sec.icon}
                  </div>
                  <h3 className="font-extrabold text-white text-base">
                    {sec.num}. {sec.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-900 rounded">
                  Mandatory
                </span>
              </div>

              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 font-mono">
                {sec.content}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Enforced
              </span>
              <span>Section {sec.num} of 11</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Verification Footer Callout */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-white">
          <Shield className="w-4 h-4 text-plug-accent" />
          <span>Compliance Audit & Annual Review Cadence</span>
        </div>
        <p>
          All personnel, contractors, and automated workflows bound by Plug In OS must strictly comply with TLS 1.2+ in-transit encryption, AES-256 / managed at-rest database storage, strict least-privilege scoping, and MFA requirements.
        </p>
      </div>
    </div>
  );
};
