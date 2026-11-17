import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  MessageSquare, 
  Clock, 
  Printer, 
  Star, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/login');
  };

  const features = [
    {
      title: "24/7 WhatsApp Receptionist",
      desc: "Autonomously answers patients, handles booking inquiries, and structures appointment schedules without your assistant lifting a finger.",
      icon: MessageSquare
    },
    {
      title: "Live Queue Timeline",
      desc: "Displays real-time checked-in progression of patients directly inside the doctor's workspace. Easily manage walks-ins and booking slots.",
      icon: Clock
    },
    {
      title: "One-Click Prescription Print",
      desc: "Instantly generates pre-filled patient info handout sheets. The doctor or assistant prints it directly to write medications on.",
      icon: Printer
    },
    {
      title: "GMB Review Booster",
      desc: "Queues a friendly WhatsApp review request link exactly 2 hours after visit. Explode positive Google Map ratings autonomously.",
      icon: Star
    }
  ];

  const plans = [
    {
      name: "Solo Doctor Starter",
      price: "₹1,999",
      period: "per month",
      cta: "Get Starter",
      features: [
        "24/7 Bilingual WhatsApp Receptionist",
        "Zero-Typing Doctor Voice-to-Rx",
        "Live OPD Token Queue Tracker",
        "Instant PDFKit Rx with WhatsApp QR",
        "1,500 WhatsApp Utility Credits",
        "Email & Chat Support"
      ],
      premium: false
    },
    {
      name: "Clinic AI Pro",
      price: "₹3,499",
      period: "per month",
      cta: "Get Clinic Pro",
      features: [
        "Everything in Starter, plus:",
        "Multimodal Lab Report Vision OCR",
        "Patient Medicine Strip Verification",
        "Vernacular 30s Audio Rx Explainer",
        "Sentiment-Gated Google Review Booster",
        "Day-3 & Day-25 Chronic Refill Loops",
        "3,000 WhatsApp Utility Credits"
      ],
      premium: true,
      badge: "Most Popular"
    },
    {
      name: "Polyclinic Multi-Specialty",
      price: "₹7,999",
      period: "per month",
      cta: "Contact Sales",
      features: [
        "Up to 5 Doctors & Visiting Specialists",
        "Live Pharmacy & Lab Desk Real-Time Board",
        "Front-Desk Cash/UPI Fraud Audit Ledger",
        "WhatsApp Flows 1-Screen Booking",
        "10,000 WhatsApp Utility Credits",
        "Dedicated Account Setup Manager"
      ],
      premium: false
    }
  ];

  const testimonials = [
    {
      quote: "Our Google Maps rating went from 4.1 to 4.8 in just 30 days! The review booster request works like magic right after the consultation ends.",
      author: "Dr. Sandeep Sharma",
      role: "Pediatrician, Delhi Care Clinic"
    },
    {
      quote: "My assistant saves at least 3 hours daily. Patients book themselves via WhatsApp, and the prefilled Rx handout is printed with one click.",
      author: "Dr. Ananya Nair",
      role: "Dermatologist, Skin Wellness"
    }
  ];

  const faqs = [
    {
      q: "How does the WhatsApp booking process work?",
      a: "Our bot integrates directly with your business WhatsApp. When a patient texts to book, the AI reads details, checks availability, registers them in the database, and reflects the checked-in status immediately on your live timeline dashboard."
    },
    {
      q: "Does this require custom WhatsApp API keys?",
      a: "No complex setup needed. You can connect your WhatsApp number via QR code scan in less than 2 minutes directly from the settings panel."
    },
    {
      q: "How does the GMB review campaign work?",
      a: "When you print the blank Rx handout, the system registers the patient visit as complete. Two hours later, a customizable WhatsApp message is triggered asking for feedback, linking directly to your Google Business maps profile."
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar Header */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', backgroundColor: '#fff', borderBottom: '1px solid var(--slate-250)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-icon-box" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
            <Stethoscope style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--slate-800)', letterSpacing: '-0.025em' }}>AI Clinic</span>
        </div>
        <button className="btn-primary" onClick={handleCTA} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
          Portal Login
        </button>
      </nav>

      {/* Hero Section (AIDA Attention) */}
      <header className="landing-hero">
        <div className="landing-container" style={{ position: 'relative', zIndex: 10 }}>
          <span className="landing-hero-badge">
            <Sparkles style={{ width: '12px', height: '12px' }} />
            Automated WhatsApp Receptionist
          </span>
          <h1 className="landing-hero-title">
            The AI Clinic Manager That Justifies ₹8,000/Month
          </h1>
          <p className="landing-hero-desc">
            Stop wasting hours handling patient bookings manually. Automate chats, print pre-filled prescriptions, and collect 10x more Google Business reviews automatically.
          </p>
          <div className="landing-hero-actions">
            <button className="btn-primary" onClick={handleCTA} style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Start 14-Day Free Trial
              <ChevronRight style={{ width: '18px', height: '18px' }} />
            </button>
            <button className="btn-secondary" onClick={handleCTA} style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '1rem', backgroundColor: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
              See Pricing Plans
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '1.5rem' }}>
            No setup fee · Connect your clinic phone number in 2 minutes
          </p>
        </div>
      </header>

      {/* Features Section (AIDA Interest) */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Streamline Your Patient Workflow</h2>
            <p className="landing-section-desc">Four key modules engineered to save time, reduce overhead billing, and grow your local practice.</p>
          </div>

          <div className="features-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-card-icon">
                  <feat.icon style={{ width: '22px', height: '22px' }} />
                </div>
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (AIDA Desire building proof) */}
      <section className="landing-section alt">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Trusted By Modern Clinics</h2>
            <p className="landing-section-desc">See how local practitioners justify their Clinic Pro subscription.</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((test, idx) => (
              <div key={idx} className="testimonial-card">
                <p className="testimonial-quote">"{test.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {test.author.split(' ').pop().charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)', margin: 0 }}>{test.author}</p>
                    <p style={{ fontSize: '11px', color: 'var(--slate-400)', margin: 0 }}>{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (AIDA Action Trigger) */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Simple, ROI-Focused Pricing</h2>
            <p className="landing-section-desc">One patient review or one hour of saved assistant time covers the subscription cost.</p>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, idx) => (
              <div key={idx} className={`pricing-card ${plan.premium ? 'premium' : ''}`}>
                {plan.premium && <span className="pricing-badge">{plan.badge}</span>}
                <p className="pricing-plan-name">{plan.name}</p>
                <div className="pricing-plan-price">
                  {plan.price}
                  <span className="pricing-plan-period"> / {plan.period}</span>
                </div>
                <ul className="pricing-features-list">
                  {plan.features.map((feat, fidx) => (
                    <li key={fidx} className="pricing-feature-item">
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--indigo-600)', flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={plan.premium ? "btn-primary" : "btn-secondary"} 
                  onClick={handleCTA}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: 'auto' }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="landing-section alt">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Frequently Asked Questions</h2>
            <p className="landing-section-desc">Everything you need to know about the onboarding process.</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <h4 className="faq-question">{faq.q}</h4>
                <p className="faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Action */}
      <section className="landing-section" style={{ backgroundColor: 'var(--slate-900)', color: '#fff', textAlign: 'center' }}>
        <div className="landing-container">
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>Ready to Grow Your Local Practice?</h2>
          <p style={{ color: 'var(--slate-400)', maxWidth: '500px', margin: '0.75rem auto 2.5rem auto', fontSize: '0.95rem' }}>
            Set up the receptionist in less than 2 minutes. Focus on what you do best—helping your patients.
          </p>
          <button className="btn-primary" onClick={handleCTA} style={{ padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '1rem', margin: '0 auto' }}>
            Get Started Now
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck style={{ width: '14px', height: '14px' }} />
              Secure Data Encryption
            </span>
            <span>·</span>
            <span>14-day Money Back Guarantee</span>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--slate-200)', fontSize: '0.75rem', color: 'var(--slate-400)', backgroundColor: '#fff' }}>
        <p>© 2026 AI Clinic Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
