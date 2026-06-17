// ─────────────────────────────────────────────────────────────────────────────
// Influence Connect — Legal content (single source of truth)
//
// These documents are written for an Indian audience and reflect how the
// platform actually operates: a subscription-based marketplace that *connects*
// brands and influencers but is not itself a party to the collaborations they
// agree. Premium subscriptions are billed through Razorpay; the platform never
// takes a cut of the deals users strike with each other.
//
// ⚠️  BEFORE GOING LIVE: replace the placeholders wrapped in 〔…〕 in
//     `LEGAL_ENTITY` below (registered business name, address, grievance
//     officer) with your real, registered details. Payment gateways (Razorpay)
//     and app stores require accurate operator and grievance information.
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_ENTITY = {
  brandName: 'Influence Connect',
  // The registered entity that operates the platform. Update with real details.
  legalName: '〔Registered business name〕',
  address: '〔Registered office address, City, State, PIN, India〕',
  email: 'support@influenceconnect.in',
  grievanceOfficer: '〔Grievance Officer name〕',
  grievanceEmail: 'grievance@influenceconnect.in',
  website: 'influenceconnect.in',
  lastUpdated: '17 June 2026',
};

export type LegalSlug = 'terms' | 'privacy' | 'refund';

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'sub'; text: string };

export interface LegalSectionData {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  subtitle: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSectionData[];
}

const p = (text: string): LegalBlock => ({ type: 'p', text });
const list = (items: string[]): LegalBlock => ({ type: 'list', items });

// ─────────────────────────────────────────────────────────────────────────────
// TERMS & CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms & Conditions',
  subtitle: 'The agreement that governs your use of the Influence Connect platform.',
  lastUpdated: LEGAL_ENTITY.lastUpdated,
  intro:
    `These Terms & Conditions ("Terms") are a legally binding agreement between you and ${LEGAL_ENTITY.brandName} ` +
    `("Influence Connect", "we", "us", or "our"), the operator of the website and applications available at ` +
    `${LEGAL_ENTITY.website} (the "Platform"). They apply to everyone who accesses or uses the Platform, whether as a ` +
    `brand, as an influencer/creator, or as a visitor. Please read them carefully — by creating an account or using the ` +
    `Platform you agree to be bound by these Terms.`,
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of these Terms',
      blocks: [
        p(
          `By registering for an account, accessing, or using the Platform in any way, you confirm that you have read, ` +
          `understood, and agree to be bound by these Terms and by our Privacy Policy and Refund & Cancellation Policy, ` +
          `each of which is incorporated into these Terms by reference. If you are using the Platform on behalf of a ` +
          `company or other organisation, you represent that you are authorised to bind that entity, and "you" refers to ` +
          `that entity.`
        ),
        p(
          `If you do not agree with any part of these Terms, you must not access or use the Platform.`
        ),
      ],
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      blocks: [
        list([
          `"Brand" means a business, agency, or individual using the Platform to discover influencers and run marketing campaigns.`,
          `"Influencer" or "Creator" means an individual or entity offering content-creation or promotional services through the Platform.`,
          `"User", "you", or "your" means any Brand, Influencer, or visitor who accesses the Platform.`,
          `"Collaboration" or "Deal" means any arrangement, campaign, or transaction agreed directly between a Brand and an Influencer.`,
          `"Subscription" means a paid Premium plan that unlocks additional Platform features, as described on the Billing page.`,
          `"Content" means any text, images, links, briefs, profiles, messages, or other material submitted to or displayed on the Platform.`,
        ]),
      ],
    },
    {
      id: 'eligibility',
      title: '3. Eligibility & Account Registration',
      blocks: [
        p(
          `You must be at least 18 years old and capable of forming a legally binding contract under the Indian Contract ` +
          `Act, 1872 to use the Platform. By registering, you represent and warrant that you meet these requirements and ` +
          `that all information you provide is true, accurate, current, and complete.`
        ),
        p(
          `You may register using your email address and mobile number (verified by a one-time password) or by signing in ` +
          `with a supported third-party provider such as Google. You are responsible for keeping your account credentials ` +
          `confidential and for all activity that occurs under your account. Notify us immediately at ` +
          `${LEGAL_ENTITY.email} if you suspect any unauthorised use of your account. We are not liable for any loss ` +
          `arising from your failure to safeguard your credentials.`
        ),
      ],
    },
    {
      id: 'our-role',
      title: '4. Our Role — We Are a Facilitator, Not a Party to Deals',
      blocks: [
        p(
          `Influence Connect is an online intermediary that helps Brands and Influencers discover one another, communicate, ` +
          `and arrange Collaborations. We are an "intermediary" within the meaning of the Information Technology Act, 2000 ` +
          `and the rules made under it.`
        ),
        p(
          `Any Collaboration is a direct agreement between the Brand and the Influencer. We are not a party to, and do not ` +
          `control, guarantee, or take responsibility for, any Collaboration. In particular:`
        ),
        list([
          `We do not take any commission or cut from the fees a Brand pays an Influencer, or from the value of any Deal.`,
          `We do not guarantee the quality, legality, safety, timeliness, or delivery of any content, services, or payment exchanged between Users.`,
          `We do not verify, and are not responsible for, the accuracy of follower counts, engagement rates, campaign results, or any claims made by Users.`,
          `Any dispute arising from a Collaboration is between the Brand and the Influencer; while we may offer optional support, we are under no obligation to mediate or resolve it.`,
        ]),
        p(
          `You use the Platform, and enter into Collaborations, at your own risk and on your own commercial judgement.`
        ),
      ],
    },
    {
      id: 'brand-obligations',
      title: '5. Obligations of Brands',
      blocks: [
        p(`If you use the Platform as a Brand, you agree that you will:`),
        list([
          `provide accurate campaign briefs, budgets, deliverables, and timelines;`,
          `only promote products and services that are lawful and that you are authorised to promote;`,
          `not make, or ask Influencers to make, false, misleading, or unsubstantiated claims;`,
          `comply with all applicable advertising standards, including the ASCI Code and the Consumer Protection Act, 2019 and its guidelines on misleading advertisements and endorsements;`,
          `provide truthful business information, including GST details where requested, for verification and invoicing; and`,
          `honour the commercial terms you agree with Influencers, including agreed payments.`,
        ]),
      ],
    },
    {
      id: 'influencer-obligations',
      title: '6. Obligations of Influencers',
      blocks: [
        p(`If you use the Platform as an Influencer, you agree that you will:`),
        list([
          `provide truthful information about your profile, audience, niche, and metrics, and not artificially inflate or misrepresent them;`,
          `deliver content that is original, lawful, and consistent with the brief you accept;`,
          `clearly and conspicuously disclose any sponsored, paid, or partnership content as required by the ASCI Guidelines for Influencer Advertising and applicable law;`,
          `not post content that is defamatory, obscene, infringing, deceptive, or otherwise unlawful; and`,
          `honour the commercial terms you agree with Brands.`,
        ]),
      ],
    },
    {
      id: 'collaborations',
      title: '7. Collaborations, Deals & Payments Between Users',
      blocks: [
        p(
          `Payments for Collaborations are arranged and settled directly between the Brand and the Influencer using payment ` +
          `methods they choose. The Platform does not process, hold, escrow, or guarantee these payments, and your ` +
          `subscription fee to us is entirely separate from any amount payable under a Collaboration.`
        ),
        p(
          `You are solely responsible for negotiating, documenting, performing, invoicing, and paying any applicable taxes ` +
          `on your Collaborations. We strongly recommend that Brands and Influencers record the agreed scope, deliverables, ` +
          `fees, and timelines in writing before commencing work.`
        ),
      ],
    },
    {
      id: 'subscriptions',
      title: '8. Subscriptions, Fees & Billing',
      blocks: [
        p(
          `The Platform offers a free "Freemium" plan and a paid "Premium" plan. Premium features and prices are described ` +
          `on the Billing page and may differ for Brands and Influencers. Prices are shown in Indian Rupees (₹) and are ` +
          `exclusive of applicable taxes unless stated otherwise.`
        ),
        p(
          `Premium subscriptions are billed in advance on a monthly or yearly basis through our payment partner, Razorpay. ` +
          `By purchasing a Subscription you authorise us (through Razorpay) to charge the applicable fee for the billing ` +
          `cycle you select. Subscriptions renew automatically at the end of each cycle unless cancelled beforehand. We do ` +
          `not store your full card or bank details on our servers.`
        ),
        p(
          `We may change our prices or plan features with reasonable prior notice. Any price change will take effect from ` +
          `your next billing cycle. Refunds and cancellations are governed by our Refund & Cancellation Policy.`
        ),
      ],
    },
    {
      id: 'cancellation',
      title: '9. Cancellation & Refunds',
      blocks: [
        p(
          `You may cancel your Premium Subscription at any time from the Billing page; you will retain Premium access until ` +
          `the end of the period you have already paid for, after which your account reverts to the Freemium plan. Refund ` +
          `eligibility, exceptions, and processing timelines are set out in our Refund & Cancellation Policy, which forms ` +
          `part of these Terms.`
        ),
      ],
    },
    {
      id: 'ip',
      title: '10. Intellectual Property',
      blocks: [
        p(
          `The Platform, including its software, design, text, graphics, logos, and the "Influence Connect" name and marks, ` +
          `is owned by us or our licensors and is protected by intellectual-property laws. We grant you a limited, ` +
          `non-exclusive, non-transferable, revocable licence to access and use the Platform for its intended purpose. You ` +
          `may not copy, modify, distribute, sell, reverse-engineer, or create derivative works from any part of the ` +
          `Platform without our prior written consent.`
        ),
      ],
    },
    {
      id: 'user-content',
      title: '11. Your Content & Licence to Us',
      blocks: [
        p(
          `You retain ownership of the Content you submit to the Platform. By submitting Content, you grant us a ` +
          `worldwide, non-exclusive, royalty-free licence to host, store, display, and distribute that Content solely to ` +
          `the extent necessary to operate and provide the Platform — for example, showing your profile to relevant Brands ` +
          `or your campaign brief to relevant Influencers.`
        ),
        p(
          `You represent that you own or have the necessary rights to the Content you submit and that it does not infringe ` +
          `any third party's rights or violate any law. You are solely responsible for your Content.`
        ),
      ],
    },
    {
      id: 'prohibited',
      title: '12. Prohibited Conduct',
      blocks: [
        p(`You agree that you will not:`),
        list([
          `scrape, crawl, harvest, or use automated tools to extract data from the Platform;`,
          `impersonate any person or entity or misrepresent your affiliation;`,
          `upload or transmit spam, malware, or any harmful or malicious code;`,
          `attempt to gain unauthorised access to any account, system, or network connected to the Platform;`,
          `use the Platform to harass, abuse, defraud, or harm another User;`,
          `circumvent, disable, or interfere with security or rate-limiting features; or`,
          `use the Platform for any unlawful purpose or in violation of these Terms.`,
        ]),
      ],
    },
    {
      id: 'third-party',
      title: '13. Third-Party Services',
      blocks: [
        p(
          `The Platform integrates with or links to third-party services such as Razorpay (payments), Google (sign-in), and ` +
          `email/SMS delivery providers. Your use of those services is subject to their own terms and policies. We are not ` +
          `responsible for the content, availability, or practices of any third-party service.`
        ),
      ],
    },
    {
      id: 'disclaimer',
      title: '14. Disclaimer of Warranties',
      blocks: [
        p(
          `The Platform is provided on an "as is" and "as available" basis without warranties of any kind, whether express ` +
          `or implied, including any implied warranties of merchantability, fitness for a particular purpose, or ` +
          `non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, secure, or that any ` +
          `Collaboration arranged through it will meet your expectations.`
        ),
      ],
    },
    {
      id: 'liability',
      title: '15. Limitation of Liability',
      blocks: [
        p(
          `To the fullest extent permitted by law, Influence Connect and its directors, employees, and partners will not be ` +
          `liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, ` +
          `revenue, data, or goodwill, arising out of or relating to your use of the Platform or any Collaboration. Our ` +
          `total aggregate liability for any claim relating to the Platform will not exceed the total subscription fees you ` +
          `paid to us in the three (3) months immediately preceding the event giving rise to the claim.`
        ),
      ],
    },
    {
      id: 'indemnity',
      title: '16. Indemnification',
      blocks: [
        p(
          `You agree to indemnify and hold harmless Influence Connect and its directors, employees, and partners from and ` +
          `against any claims, damages, liabilities, costs, and expenses (including reasonable legal fees) arising out of ` +
          `or related to your Content, your use of the Platform, your Collaborations, or your breach of these Terms or of ` +
          `any law or third-party right.`
        ),
      ],
    },
    {
      id: 'termination',
      title: '17. Suspension & Termination',
      blocks: [
        p(
          `We may suspend or terminate your access to the Platform, with or without notice, if you breach these Terms, if ` +
          `your conduct poses a risk to other Users or to us, or as required by law. You may delete your account at any ` +
          `time from Account Settings. On termination, your right to use the Platform ends immediately; sections relating ` +
          `to intellectual property, disclaimers, limitation of liability, indemnification, and governing law survive.`
        ),
      ],
    },
    {
      id: 'changes',
      title: '18. Changes to the Platform & these Terms',
      blocks: [
        p(
          `We may modify or discontinue features of the Platform at any time. We may also update these Terms from time to ` +
          `time; when we make material changes, we will update the "last updated" date and, where appropriate, notify you ` +
          `through the Platform or by email. Your continued use of the Platform after changes take effect constitutes ` +
          `acceptance of the revised Terms.`
        ),
      ],
    },
    {
      id: 'governing-law',
      title: '19. Governing Law & Dispute Resolution',
      blocks: [
        p(
          `These Terms are governed by and construed in accordance with the laws of India. Subject to the grievance ` +
          `mechanism below, the courts at 〔City〕, India will have exclusive jurisdiction over any dispute arising out of ` +
          `or in connection with these Terms or the Platform. If any provision of these Terms is held to be unenforceable, ` +
          `the remaining provisions will continue in full force and effect.`
        ),
      ],
    },
    {
      id: 'grievance',
      title: '20. Grievance Redressal',
      blocks: [
        p(
          `In accordance with the Information Technology Act, 2000 and the rules made under it, complaints about Content or ` +
          `your use of the Platform may be made to our Grievance Officer:`
        ),
        list([
          `Grievance Officer: ${LEGAL_ENTITY.grievanceOfficer}`,
          `Email: ${LEGAL_ENTITY.grievanceEmail}`,
          `Address: ${LEGAL_ENTITY.address}`,
        ]),
        p(
          `We will acknowledge complaints within 24 hours and aim to resolve them within 15 days of receipt.`
        ),
      ],
    },
    {
      id: 'contact',
      title: '21. Contact Us',
      blocks: [
        p(
          `If you have any questions about these Terms, please contact us at ${LEGAL_ENTITY.email}. We aim to respond ` +
          `within 2 business days.`
        ),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY POLICY
// ─────────────────────────────────────────────────────────────────────────────

const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  subtitle: 'How Influence Connect collects, uses, shares, and protects your personal data.',
  lastUpdated: LEGAL_ENTITY.lastUpdated,
  intro:
    `This Privacy Policy explains how ${LEGAL_ENTITY.brandName} ("we", "us", or "our") collects, uses, shares, and ` +
    `safeguards your personal data when you use the Platform at ${LEGAL_ENTITY.website}. It applies to both Brands and ` +
    `Influencers, and is designed to be consistent with the Digital Personal Data Protection Act, 2023 and the ` +
    `Information Technology Act, 2000 and rules made under it. By using the Platform, you consent to the practices ` +
    `described here.`,
  sections: [
    {
      id: 'scope',
      title: '1. Scope & Your Consent',
      blocks: [
        p(
          `This Policy covers personal data we process when you register for, access, or use the Platform. Where we rely on ` +
          `your consent to process data, you may withdraw it at any time as described in "Your Rights" below, though this ` +
          `may limit your ability to use certain features.`
        ),
      ],
    },
    {
      id: 'collect',
      title: '2. Information We Collect',
      blocks: [
        { type: 'sub', text: 'Information you provide' },
        list([
          `Account details: name, email address, mobile number, and password.`,
          `Brand profiles: company/brand name, logo, and business information including GST details where provided.`,
          `Influencer profiles: social-media handles, niche/categories, audience and follower statistics, and portfolio information.`,
          `Communications: messages, campaign briefs, applications, offers, and support requests you send through the Platform.`,
          `Billing information: subscription plan and payment confirmations. Card and bank details are collected and processed directly by Razorpay — we do not store your full payment-instrument details.`,
        ]),
        { type: 'sub', text: 'Information we collect automatically' },
        list([
          `Usage data: pages visited, features used, campaign and messaging activity, and timestamps.`,
          `Device and technical data: IP address, browser type, device type, and similar identifiers.`,
          `Cookies and similar technologies used to keep you signed in and to remember preferences such as your theme.`,
        ]),
        { type: 'sub', text: 'Information from third parties' },
        list([
          `If you sign in with Google, we receive basic profile information (such as your name and email) that Google shares with your permission.`,
        ]),
      ],
    },
    {
      id: 'use',
      title: '3. How We Use Your Information',
      blocks: [
        p(`We use your personal data to:`),
        list([
          `create and manage your account and authenticate you (including OTP and Google sign-in);`,
          `operate, maintain, and improve the Platform and match Brands with relevant Influencers;`,
          `send transactional communications such as OTP codes, campaign and deal notifications, and service updates;`,
          `process Premium subscription payments and issue receipts;`,
          `provide customer support and respond to your enquiries;`,
          `detect, prevent, and address fraud, abuse, security issues, and violations of our Terms; and`,
          `comply with our legal and regulatory obligations.`,
        ]),
        p(`We do not sell your personal data.`),
      ],
    },
    {
      id: 'legal-basis',
      title: '4. Legal Bases for Processing',
      blocks: [
        p(
          `We process your personal data where you have given consent (for example, when you register), where processing is ` +
          `necessary to provide the service you have requested, where we have a legitimate interest such as keeping the ` +
          `Platform secure, and where processing is required to comply with applicable law.`
        ),
      ],
    },
    {
      id: 'sharing',
      title: '5. How We Share Your Information',
      blocks: [
        p(`We share personal data only in the following circumstances:`),
        list([
          `With other Users, as needed for the Platform to function — a Brand's campaign details are visible to relevant Influencers, and an Influencer's public profile is visible to Brands.`,
          `With service providers who process data on our behalf under confidentiality obligations, including Razorpay (payments), our email and SMS/OTP delivery providers, Google (sign-in), and cloud hosting providers.`,
          `For legal reasons, where disclosure is required by law, regulation, legal process, or to protect the rights, property, or safety of Influence Connect, our Users, or the public.`,
          `In a business transfer, such as a merger, acquisition, or sale of assets, in which case personal data may be transferred subject to this Policy.`,
        ]),
      ],
    },
    {
      id: 'cookies',
      title: '6. Cookies & Similar Technologies',
      blocks: [
        p(
          `We use cookies and local storage to keep you signed in, secure your session, and remember preferences such as ` +
          `your light/dark theme. You can control cookies through your browser settings, but disabling them may affect how ` +
          `the Platform works.`
        ),
      ],
    },
    {
      id: 'retention',
      title: '7. Data Retention',
      blocks: [
        p(
          `We retain your personal data for as long as your account is active. If you request deletion of your account, we ` +
          `will erase or anonymise your personal data within 30 days, except where we are required or permitted by law to ` +
          `retain it for longer — for example, for tax, accounting, fraud-prevention, or dispute-resolution purposes. ` +
          `Aggregated and anonymised data that no longer identifies you may be retained indefinitely.`
        ),
      ],
    },
    {
      id: 'security',
      title: '8. How We Protect Your Information',
      blocks: [
        p(
          `We implement reasonable security practices and procedures designed to protect your personal data, including ` +
          `encrypted data transmission (HTTPS/TLS), hashed password storage, and token-based authentication with limited ` +
          `validity. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute ` +
          `security. You are responsible for keeping your credentials confidential and for notifying us of any suspected ` +
          `compromise.`
        ),
      ],
    },
    {
      id: 'rights',
      title: '9. Your Rights & Choices',
      blocks: [
        p(`Subject to applicable law, you have the right to:`),
        list([
          `access the personal data we hold about you and request a summary of how it is processed;`,
          `correct or update inaccurate or incomplete data, much of which you can edit directly in Account Settings;`,
          `request deletion of your account and associated personal data;`,
          `withdraw consent where processing is based on consent; and`,
          `nominate another individual to exercise your rights in the event of death or incapacity, as provided under the Digital Personal Data Protection Act, 2023.`,
        ]),
        p(
          `To exercise any of these rights, contact us at ${LEGAL_ENTITY.email}. We may need to verify your identity before ` +
          `acting on your request.`
        ),
      ],
    },
    {
      id: 'children',
      title: '10. Children’s Privacy',
      blocks: [
        p(
          `The Platform is not directed at, and is not intended for use by, anyone under the age of 18. We do not knowingly ` +
          `collect personal data from minors. If we learn that we have collected personal data from a minor, we will ` +
          `delete it and close the associated account.`
        ),
      ],
    },
    {
      id: 'storage-location',
      title: '11. Data Storage & Transfers',
      blocks: [
        p(
          `Your personal data is processed and stored on servers operated by our hosting and service providers. Where data ` +
          `is transferred to or stored in a location outside India, we take steps to ensure it remains protected in ` +
          `accordance with this Policy and applicable law.`
        ),
      ],
    },
    {
      id: 'changes',
      title: '12. Changes to This Policy',
      blocks: [
        p(
          `We may update this Privacy Policy from time to time. When we make material changes, we will update the "last ` +
          `updated" date and, where appropriate, notify you through the Platform or by email before the changes take ` +
          `effect. Your continued use of the Platform after that constitutes acceptance of the updated Policy.`
        ),
      ],
    },
    {
      id: 'grievance',
      title: '13. Grievance Officer & Contact',
      blocks: [
        p(
          `If you have any questions, requests, or complaints about your personal data or this Policy, please contact our ` +
          `Grievance Officer, who is responsible for addressing data-protection concerns:`
        ),
        list([
          `Grievance Officer: ${LEGAL_ENTITY.grievanceOfficer}`,
          `Email: ${LEGAL_ENTITY.grievanceEmail}`,
          `General privacy queries: ${LEGAL_ENTITY.email}`,
          `Address: ${LEGAL_ENTITY.address}`,
        ]),
        p(`We aim to acknowledge privacy requests within 24 hours and to resolve them within a reasonable period.`),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// REFUND & CANCELLATION POLICY
// ─────────────────────────────────────────────────────────────────────────────

const REFUND: LegalDoc = {
  slug: 'refund',
  title: 'Refund & Cancellation Policy',
  subtitle: 'Our policy on Premium subscription cancellations, refunds, and billing.',
  lastUpdated: LEGAL_ENTITY.lastUpdated,
  intro:
    `This Refund & Cancellation Policy explains how cancellations and refunds work for paid Premium subscriptions on the ` +
    `${LEGAL_ENTITY.brandName} Platform. It forms part of, and should be read together with, our Terms & Conditions. ` +
    `This Policy applies only to subscription fees paid to Influence Connect — it does not apply to payments exchanged ` +
    `directly between Brands and Influencers for their Collaborations.`,
  sections: [
    {
      id: 'scope',
      title: '1. What This Policy Covers',
      blocks: [
        p(
          `This Policy covers Premium subscription fees you pay to Influence Connect through our payment partner, Razorpay. ` +
          `It does not cover, and we are not responsible for refunding, any amount agreed or paid between a Brand and an ` +
          `Influencer for a Collaboration — those are direct transactions between Users and we do not process or hold ` +
          `those funds.`
        ),
      ],
    },
    {
      id: 'plans',
      title: '2. Plans & Billing',
      blocks: [
        p(
          `The Platform offers a free Freemium plan and a paid Premium plan. Premium is billed in advance on a monthly or ` +
          `yearly basis, in Indian Rupees, through Razorpay. Yearly plans are offered at a discount compared with paying ` +
          `monthly. Subscriptions renew automatically at the end of each billing cycle unless you cancel before the ` +
          `renewal date.`
        ),
      ],
    },
    {
      id: 'free-plan',
      title: '3. Free Plan',
      blocks: [
        p(
          `The Freemium plan is free of charge. You can use core features of the Platform on the Freemium plan without ` +
          `providing payment details, so no refund applies to it.`
        ),
      ],
    },
    {
      id: 'cancellation',
      title: '4. Cancelling Your Subscription',
      blocks: [
        p(
          `You can cancel your Premium subscription at any time from the Billing page. When you cancel:`
        ),
        list([
          `your subscription will not renew for the next billing cycle;`,
          `you keep Premium access until the end of the period you have already paid for; and`,
          `at the end of that period, your account automatically moves to the Freemium plan.`,
        ]),
        p(
          `Cancelling stops future charges. By itself, cancellation does not trigger a refund of the current period — see ` +
          `the refund rules below.`
        ),
      ],
    },
    {
      id: 'refund-eligibility',
      title: '5. Refund Eligibility',
      blocks: [
        p(
          `Premium subscription fees are generally non-refundable, because access to Premium features is made available to ` +
          `you immediately and for the full billing period. However, we will review refund requests in good faith and may ` +
          `issue a full or partial refund in circumstances such as:`
        ),
        list([
          `a duplicate or accidental charge for the same billing period;`,
          `you were charged after cancelling, and did not use Premium features in the new period;`,
          `a verified technical failure on our side that prevented you from accessing Premium features for a significant part of the billing period and that we were unable to resolve in reasonable time; or`,
          `an unauthorised transaction that you report promptly and that we are able to verify.`,
        ]),
        p(`Approved refunds are made to your original payment method through Razorpay.`),
      ],
    },
    {
      id: 'non-refundable',
      title: '6. Circumstances Where Refunds Are Not Provided',
      blocks: [
        p(`Except where required by law, we do not provide refunds:`),
        list([
          `simply because you did not use the Platform or the Premium features during a paid period;`,
          `for the unused portion of a billing cycle after you cancel (you retain access until the period ends);`,
          `where your account has been suspended or terminated for breach of our Terms; or`,
          `for any payment made directly between a Brand and an Influencer for a Collaboration.`,
        ]),
      ],
    },
    {
      id: 'how-to-request',
      title: '7. How to Request a Refund',
      blocks: [
        p(
          `To request a refund, email us at ${LEGAL_ENTITY.email} within 7 days of the charge, from the email address ` +
          `registered to your account. Please include:`
        ),
        list([
          `your registered name and account email;`,
          `the date and amount of the charge; and`,
          `the reason for your request and any supporting details.`,
        ]),
      ],
    },
    {
      id: 'processing',
      title: '8. Refund Processing & Timelines',
      blocks: [
        p(
          `We aim to review refund requests within 5 business days. If a refund is approved, it will be initiated through ` +
          `Razorpay to your original payment method. Once initiated, it typically takes a further 5–7 business days for the ` +
          `amount to appear in your account, depending on your bank or card issuer. We will keep you informed of the status ` +
          `of your request.`
        ),
      ],
    },
    {
      id: 'failed-payments',
      title: '9. Failed or Pending Payments',
      blocks: [
        p(
          `If a payment fails or is shown as pending but the amount was debited, it is usually reversed automatically by ` +
          `Razorpay or your bank within a few business days. If you do not see the reversal, contact us with the ` +
          `transaction details and we will help you follow up.`
        ),
      ],
    },
    {
      id: 'price-changes',
      title: '10. Price Changes',
      blocks: [
        p(
          `We may change subscription prices from time to time. Any change will be communicated in advance and will apply ` +
          `from your next billing cycle. You can choose to cancel before the change takes effect if you do not wish to ` +
          `continue at the new price.`
        ),
      ],
    },
    {
      id: 'changes',
      title: '11. Changes to This Policy',
      blocks: [
        p(
          `We may update this Refund & Cancellation Policy from time to time. When we make material changes, we will update ` +
          `the "last updated" date and, where appropriate, notify you through the Platform. The version in effect at the ` +
          `time of your purchase applies to that purchase.`
        ),
      ],
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      blocks: [
        p(
          `For any questions about cancellations, refunds, or billing, contact us at ${LEGAL_ENTITY.email}. We aim to ` +
          `respond within 2 business days.`
        ),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  terms: TERMS,
  privacy: PRIVACY,
  refund: REFUND,
};

export const LEGAL_INDEX: { slug: LegalSlug; title: string; desc: string }[] = [
  { slug: 'terms', title: 'Terms & Conditions', desc: 'The agreement governing your use of Influence Connect.' },
  { slug: 'privacy', title: 'Privacy Policy', desc: 'How we collect, use, and protect your personal data.' },
  { slug: 'refund', title: 'Refund & Cancellation Policy', desc: 'Our policy on subscription refunds and cancellations.' },
];
