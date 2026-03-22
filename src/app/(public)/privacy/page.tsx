import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Golden Coast Stay",
  description: "Read our privacy policy to understand how we collect, use, and protect your data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, including:
• Personal identification information (name, email address, phone number)
• Account credentials (encrypted password)
• Booking information (check-in/out dates, guest count, payment details)
• Property submission information if you apply to list your property
• Communications with our team

We also automatically collect certain information when you visit our platform, including device information, IP address, browser type, pages visited, and cookies.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:
• Process bookings and payments
• Send booking confirmations and updates
• Communicate with you about your account or inquiries
• Improve our platform and services
• Send promotional communications (with your consent)
• Comply with legal obligations
• Prevent fraud and ensure platform security`,
  },
  {
    title: "3. Information Sharing",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:
• Property owners (limited booking details to facilitate your stay)
• Payment processors (Paystack) to process transactions
• Service providers who assist in our operations
• Law enforcement when required by law

All third-party service providers are contractually obligated to keep your information confidential.`,
  },
  {
    title: "4. Data Security",
    content: `We implement industry-standard security measures to protect your personal information:
• SSL/TLS encryption for all data transmission
• Encrypted password storage using bcrypt
• Secure payment processing via Paystack (PCI DSS compliant)
• Regular security audits and monitoring
• Limited access to personal data on a need-to-know basis

However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "5. Cookies",
    content: `We use cookies and similar tracking technologies to enhance your experience on our platform. Cookies help us:
• Keep you signed in to your account
• Remember your preferences
• Analyze site traffic and usage patterns
• Deliver targeted content

You can control cookies through your browser settings. Disabling cookies may affect some functionality of our platform.`,
  },
  {
    title: "6. Your Rights",
    content: `You have the right to:
• Access your personal information we hold
• Correct inaccurate or incomplete information
• Request deletion of your account and data
• Opt out of marketing communications
• Lodge a complaint with relevant data protection authorities

To exercise these rights, contact us at privacy@goldencoaststays.com`,
  },
  {
    title: "7. Data Retention",
    content: `We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Booking records are retained for 7 years for accounting and legal purposes. You may request deletion of your account at any time, after which your personal data will be anonymized or deleted within 30 days, except where retention is required by law.`,
  },
  {
    title: "8. Third-Party Links",
    content: `Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed to children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our platform after such changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us at:

Golden Coast Stay
East Legon, Accra, Ghana
Email: privacy@goldencoaststays.com
Phone: +233 XX XXX XXXX`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <div className="pt-28 pb-14 bg-[#0a0a0a] relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(201,169,97,0.12) 0%, transparent 60%)" }} />
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <p className="text-[#c9a961] text-sm font-semibold tracking-widest uppercase mb-3">Legal</p>
          <h1 className="font-['Playfair_Display'] text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <div className="w-14 h-0.5 bg-gradient-to-r from-[#c9a961] to-[#e8d5a3] mx-auto mb-5 rounded-full" />
          <p className="text-[#9ca3af] text-lg">Last updated: March 2025</p>
        </div>
      </div>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-2xl p-6 mb-10">
            <p className="text-[#6c757d] leading-relaxed">
              At Golden Coast Stay, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map(s => (
              <div key={s.title} className="group">
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-3">
                  <span className="w-1 h-6 bg-gradient-to-b from-[#c9a961] to-[#9a7b3c] rounded-full inline-block" />
                  {s.title}
                </h2>
                <div className="pl-4">
                  <p className="text-[#6c757d] leading-relaxed whitespace-pre-line text-sm">{s.content}</p>
                </div>
                <div className="mt-6 h-px bg-[#f0f0f0]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
