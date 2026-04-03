"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  User,
  AtSign,
  HelpCircle,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const EMAILJS_SERVICE_ID = "service_7gexsrq";
const EMAILJS_TEMPLATE_ID = "template_x0iuf5i";
const EMAILJS_PUBLIC_KEY = "zhJdl_0VxTi6SRvef";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          subject: form.subject,
          message: form.message,
          reply_to: form.email,
        },
        EMAILJS_PUBLIC_KEY,
      );
      await addDoc(collection(db, "messages"), {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        status: "unread",
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .contact-root {
          --cream: #f5f0e8;
          --warm: #e8dfd3;
          --brown-dark: #2a1508;
          --brown-mid: #5a3520;
          --brown-light: #9a7a5a;
          --gold: #b8864e;
          --gold-light: #d4a96a;
          --text-body: #4a3828;
          --font-display: 'Cormorant Garamond', Georgia, serif;
          --font-body: 'Jost', sans-serif;
        }
        .contact-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero ── */
        .contact-hero {
          background: var(--brown-dark);
          padding: 100px 60px 70px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(184,134,78,0.2);
        }
        .contact-hero::before {
          content: 'CONTACT';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display);
          font-size: 14rem;
          font-weight: 600;
          color: rgba(255,255,255,0.02);
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }
        .contact-hero-top-rule {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold), transparent);
        }
        .contact-hero-eyebrow {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.2s forwards;
        }
        .contact-hero-title {
          font-family: var(--font-display);
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 300;
          color: #f5ebe0;
          line-height: 1.05;
          letter-spacing: 0.01em;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.35s forwards;
        }
        .contact-hero-title em { font-style: italic; color: var(--gold-light); }
        .contact-hero-rule {
          width: 40px; height: 1px;
          background: var(--gold);
          margin: 24px auto;
          opacity: 0;
          animation: fadeIn 0.8s ease 0.5s forwards;
        }
        .contact-hero-sub {
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 300;
          color: rgba(235,220,200,0.65);
          line-height: 1.85;
          max-width: 460px;
          margin: 0 auto;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.6s forwards;
        }

        /* ── Body ── */
        .contact-body {
          background: var(--warm);
          padding: 80px 60px;
        }

        .contact-section-label {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .contact-section-label::before {
          content: '';
          display: block;
          width: 28px; height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: start;
        }

        /* ── Form card ── */
        .contact-form-card {
          background: var(--cream);
          padding: 44px 40px;
          border: 1px solid rgba(184,134,78,0.15);
           height: 77vh;
        }

        .contact-form-heading {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .contact-form-heading em { font-style: italic; color: var(--brown-mid); }

        .contact-form-sub {
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 300;
          color: var(--brown-light);
          line-height: 1.75;
          margin-bottom: 32px;
        }

        .contact-divider {
          width: 100%; height: 1px;
          background: rgba(184,134,78,0.15);
          margin-bottom: 32px;
        }

        /* Status banners */
        .contact-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 18px;
          border: 1px solid;
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          margin-bottom: 28px;
        }
        .contact-banner.success {
          background: rgba(46,125,50,0.06);
          border-color: rgba(46,125,50,0.25);
          color: #2e7d32;
        }
        .contact-banner.error {
          background: rgba(185,28,28,0.06);
          border-color: rgba(185,28,28,0.2);
          color: #b91c1c;
        }

        /* Row */
        .contact-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .contact-field { margin-bottom: 30px; }
        .contact-field:last-of-type { margin-bottom: 0; }

        .contact-label {
          font-family: var(--font-body);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--brown-mid);
          display: block;
          margin-bottom: 10px;
        }

        .contact-input-wrap { position: relative; }
        .contact-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--brown-light);
          pointer-events: none;
          opacity: 0.7;
        }
        .contact-textarea-icon {
          position: absolute;
          left: 14px;
          top: 14px;
          color: var(--brown-light);
          pointer-events: none;
          opacity: 0.7;
        }

        .contact-input {
          width: 100%;
          background: #faf7f3;
          border: 1px solid rgba(184,134,78,0.2);
          padding: 12px 14px 12px 40px;
          font-family: var(--font-body);
          font-size: 0.83rem;
          font-weight: 300;
          color: var(--brown-dark);
          outline: none;
          transition: border-color 0.25s;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .contact-input::placeholder { color: rgba(154,122,90,0.45); }
        .contact-input:focus { border-color: var(--gold); background: #fff; }

        .contact-textarea {
          width: 100%;
          background: #faf7f3;
          border: 1px solid rgba(184,134,78,0.2);
          padding: 12px 14px 12px 40px;
          font-family: var(--font-body);
          font-size: 0.83rem;
          font-weight: 300;
          color: var(--brown-dark);
          outline: none;
          transition: border-color 0.25s;
          resize: none;
          line-height: 1.7;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .contact-textarea::placeholder { color: rgba(154,122,90,0.45); }
        .contact-textarea:focus { border-color: var(--gold); background: #fff; }

        .contact-submit {
          width: 100%;
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 15px 24px;
          border: 1px solid var(--brown-dark);
          background: var(--brown-dark);
          color: #f5ebe0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 48px;
          transition: all 0.25s;
        }
        .contact-submit:hover:not(:disabled) {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }
        .contact-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Info card ── */
        .contact-info-card {
          background: var(--brown-dark);
          padding: 25px 36px;
          border: 1px solid rgba(184,134,78,0.15);
          position: relative;
          overflow: hidden;
        }
        .contact-info-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, var(--gold), transparent);
        }

        .contact-info-heading {
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 300;
          color: #f5ebe0;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .contact-info-heading em { font-style: italic; color: var(--gold-light); }

        .contact-info-sub {
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 300;
          color: rgba(200,168,120,0.6);
          letter-spacing: 0.08em;
          margin-bottom: 32px;
        }

        .contact-info-divider {
          width: 100%; height: 1px;
          background: rgba(184,134,78,0.12);
          margin-bottom: 28px;
        }

        .contact-info-items {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .contact-info-icon-wrap {
          width: 36px; height: 36px;
          border: 1px solid rgba(184,134,78,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
          transition: background 0.25s;
        }
        .contact-info-item:hover .contact-info-icon-wrap {
          background: rgba(184,134,78,0.1);
        }

        .contact-info-label {
          font-family: var(--font-body);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .contact-info-value {
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 300;
          color: rgba(220,200,175,0.85);
          line-height: 1.7;
        }

        /* Map accent strip */
        .contact-map-strip {
          background: var(--brown-dark);
          border-top: 1px solid rgba(184,134,78,0.15);
          padding: 0;
          overflow: hidden;
          height: 240px;
          position: relative;
        }
        .contact-map-strip iframe {
          width: 100%;
          height: 100%;
          border: none;
          opacity: 0.75;
          filter: sepia(0.4) contrast(0.9);
        }
        .contact-map-strip-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(42,21,8,0.15), transparent 30%, transparent 70%, rgba(42,21,8,0.3));
          pointer-events: none;
        }
        .contact-map-label {
          position: absolute;
          bottom: 20px; left: 28px;
          font-family: var(--font-body);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #f5ebe0;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.9;
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .contact-body { padding: 60px 32px; }
          .contact-grid { grid-template-columns: 1fr; }
          .contact-info-card { order: -1; }
        }
        @media (max-width: 600px) {
          .contact-hero { padding: 80px 24px 56px; }
          .contact-body { padding: 48px 20px; }
          .contact-form-card { padding: 32px 24px; }
          .contact-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="contact-root">
        {/* ── HERO ── */}
        <div className="contact-hero">
          <div className="contact-hero-top-rule" />
          <p className="contact-hero-eyebrow">Marikina · Handcrafted</p>
          <h1 className="contact-hero-title">
            Get in <em>Touch</em>
          </h1>
          <div className="contact-hero-rule" />
          <p className="contact-hero-sub">
            We&apos;d love to hear from you. Send us a message and our team will
            get back to you within one business day.
          </p>
        </div>

        {/* ── BODY ── */}
        <div className="contact-body">
          <p className="contact-section-label">Send a Message</p>

          <div className="contact-grid">
            {/* FORM CARD */}
            <div className="contact-form-card">
              <h2 className="contact-form-heading">
                A message, <em>a connection.</em>
              </h2>
              <p className="contact-form-sub">
                Whether it&apos;s a question about sizing, an order inquiry, or
                simply saying hello — we&apos;re here to help.
              </p>
              <div className="contact-divider" />

              {status === "success" && (
                <div className="contact-banner success">
                  <CheckCircle size={14} strokeWidth={2} />
                  Your message has been sent — we&apos;ll be in touch soon.
                </div>
              )}
              {status === "error" && (
                <div className="contact-banner error">
                  <AlertCircle size={14} strokeWidth={2} />
                  Something went wrong. Please try again.
                </div>
              )}

              <form onSubmit={handleSendMessage}>
                <div className="contact-row">
                  {/* Name */}
                  <div>
                    <label className="contact-label">Full Name</label>
                    <div className="contact-input-wrap">
                      <User
                        size={14}
                        strokeWidth={1.5}
                        className="contact-input-icon"
                      />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        className="contact-input"
                      />
                    </div>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="contact-label">Email Address</label>
                    <div className="contact-input-wrap">
                      <AtSign
                        size={14}
                        strokeWidth={1.5}
                        className="contact-input-icon"
                      />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        required
                        className="contact-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="contact-field">
                  <label className="contact-label">Subject</label>
                  <div className="contact-input-wrap">
                    <HelpCircle
                      size={14}
                      strokeWidth={1.5}
                      className="contact-input-icon"
                    />
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="General Inquiry"
                      required
                      className="contact-input"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="contact-field">
                  <label className="contact-label">Message</label>
                  <div className="contact-input-wrap">
                    <MessageSquare
                      size={14}
                      strokeWidth={1.5}
                      className="contact-textarea-icon"
                    />
                    <textarea
                      rows={5}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      required
                      className="contact-textarea"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="contact-submit"
                >
                  {status === "loading" ? "Sending…" : "Send Message"}
                  <Send size={13} strokeWidth={2} />
                </button>
              </form>
            </div>

            {/* INFO CARD */}
            <div>
              <div className="contact-info-card">
                <h3 className="contact-info-heading">
                  Find <em>us</em> here.
                </h3>
                <p className="contact-info-sub">Marikina · Est. 2015</p>
                <div className="contact-info-divider" />
                <div className="contact-info-items">
                  {[
                    {
                      icon: <MapPin size={14} strokeWidth={1.5} />,
                      label: "Address",
                      value: (
                        <>
                          86 E Jacinto St, Marikina City
                          <br />
                          1800 Metro Manila
                        </>
                      ),
                    },
                    {
                      icon: <Phone size={14} strokeWidth={1.5} />,
                      label: "Phone",
                      value: "+63 912 345 6789",
                    },
                    {
                      icon: <Mail size={14} strokeWidth={1.5} />,
                      label: "Email",
                      value: "pandoshoes@gmail.com",
                    },
                    {
                      icon: <Clock size={14} strokeWidth={1.5} />,
                      label: "Store Hours",
                      value: (
                        <>
                          Mon – Sat: 9:00 AM – 6:00 PM
                          <br />
                          Sunday: Closed
                        </>
                      ),
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="contact-info-item">
                      <div className="contact-info-icon-wrap">{icon}</div>
                      <div>
                        <p className="contact-info-label">{label}</p>
                        <p className="contact-info-value">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="contact-map-strip">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.986441264871!2d121.097024!3d14.650254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b8b7d16cbe01%3A0x2b2d8c9f1c7c0b5e!2s86%20E%20Jacinto%20St%2C%20Marikina%20City%201800%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1700000000000"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pando Store Location"
                />
                <div className="contact-map-strip-overlay" />
                <p className="contact-map-label">
                  <MapPin size={11} strokeWidth={2} />
                  86 E Jacinto St, Marikina City 1800, Metro Manila
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
