"use client";

const WITHOUT_QUANTUM_VAULT = [
  "Ed25519 only",
  "Quantum-breakable signature",
  "No post-quantum identity",
  "Vulnerable to Shor's Algorithm",
];

const WITH_QUANTUM_VAULT = [
  "Ed25519 + ML-DSA-65 hybrid",
  "PQ fingerprint stored on-chain",
  "Cryptographic wallet binding",
  "NIST FIPS 204 protected",
];

export default function BeforeAfter() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 pb-6">
      <div
        className="rounded-3xl border border-white/10 p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.9) 100%)",
        }}
      >
        <div className="text-center mb-7">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold">
            Security Posture Shift
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Before vs After Quantum Vault
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="rounded-2xl border border-red-500/25 p-5 sm:p-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,29,29,0.22) 0%, rgba(17,24,39,0.5) 100%)",
            }}
          >
            <h3 className="text-lg font-bold text-red-300 mb-4">
              Without Quantum Vault
            </h3>
            <ul className="space-y-3">
              {WITHOUT_QUANTUM_VAULT.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl border border-emerald-500/25 p-5 sm:p-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,78,59,0.22) 0%, rgba(17,24,39,0.5) 100%)",
            }}
          >
            <h3 className="text-lg font-bold text-emerald-300 mb-4">
              With Quantum Vault
            </h3>
            <ul className="space-y-3">
              {WITH_QUANTUM_VAULT.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
