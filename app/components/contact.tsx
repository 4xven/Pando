"use client";

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
} from "lucide-react";

export default function ContactPage() {
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E8DFD3",
        paddingTop: "120px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>

        {/* TITLE */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#3a2414",
              marginBottom: "12px",
              fontFamily: "Georgia, serif",
            }}
          >
            Get in Touch
          </h1>
          <p style={{ color: "#6d5d51", fontSize: "0.9rem", lineHeight: 1.6 }}>
            We&apos;d love to hear from you. Send us a message or visit our store.
          </p>
        </div>

        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* FORM */}
          <div
            style={{
              backgroundColor: "#f3efea",
              borderRadius: "10px",
              padding: "2rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <form onSubmit={handleSendMessage}>

              {/* NAME + EMAIL row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                {/* Full Name */}
                <div>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#3a2414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#bba899",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Fullname"
                      style={{
                        width: "100%",
                        backgroundColor: "#faf7f4",
                        border: "1px solid #e0d0bc",
                        borderRadius: "12px",
                        paddingLeft: "40px",
                        paddingRight: "14px",
                        paddingTop: "11px",
                        paddingBottom: "11px",
                        fontSize: "0.85rem",
                        outline: "none",
                        color: "#3a2414",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#3a2414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <AtSign
                      size={16}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#bba899",
                      }}
                    />
                    <input
                      type="email"
                      placeholder="email"
                      style={{
                        width: "100%",
                        backgroundColor: "#faf7f4",
                        border: "1px solid #e0d0bc",
                        borderRadius: "12px",
                        paddingLeft: "40px",
                        paddingRight: "14px",
                        paddingTop: "11px",
                        paddingBottom: "11px",
                        fontSize: "0.85rem",
                        outline: "none",
                        color: "#3a2414",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SUBJECT */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#3a2414",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Subject
                </label>
                <div style={{ position: "relative" }}>
                  <HelpCircle
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#bba899",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="General Inquiry"
                    style={{
                      width: "100%",
                      backgroundColor: "#faf7f4",
                      border: "1px solid #e0d0bc",
                      borderRadius: "12px",
                      paddingLeft: "40px",
                      paddingRight: "14px",
                      paddingTop: "11px",
                      paddingBottom: "11px",
                      fontSize: "0.85rem",
                      outline: "none",
                      color: "#3a2414",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* MESSAGE */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#3a2414",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Message
                </label>
                <div style={{ position: "relative" }}>
                  <MessageSquare
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "14px",
                      color: "#bba899",
                    }}
                  />
                  <textarea
                    rows={5}
                    placeholder="How can we help you?"
                    style={{
                      width: "100%",
                      backgroundColor: "#faf7f4",
                      border: "1px solid #e0d0bc",
                      borderRadius: "12px",
                      paddingLeft: "40px",
                      paddingRight: "14px",
                      paddingTop: "11px",
                      paddingBottom: "11px",
                      fontSize: "0.85rem",
                      outline: "none",
                      resize: "none",
                      color: "#3a2414",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#3a2414",
                  color: "#f5e6d3",
                  fontWeight: "600",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2a1a0f")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3a2414")
                }
              >
                Send Message
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* STORE INFO */}
          <div
            style={{
              background: "linear-gradient(135deg, #3a2414, #5a3a21)",
              color: "#f5e6d3",
              borderRadius: "10px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              height: "48.5vh",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "1.75rem",
              }}
            >
              Store Information
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* ADDRESS */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={15} />
                </div>
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "0.9rem" }}>Address</p>
                  <p style={{ color: "#d6c2aa", fontSize: "0.82rem", lineHeight: "1.6" }}>
                    
                    86 E Jacinto St, Marikina City<br />
                    1800 Marikina City
                  </p>
                </div>
              </div>

              {/* PHONE */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={15} />
                </div>
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "0.9rem" }}>Phone</p>
                  <p style={{ color: "#d6c2aa", fontSize: "0.82rem" }}>+63 912 345 6789</p>
                </div>
              </div>

              {/* EMAIL */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mail size={15} />
                </div>
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "0.9rem" }}>Email</p>
                  <p style={{ color: "#d6c2aa", fontSize: "0.82rem" }}>pandoshoes@gmail.com</p>
                </div>
              </div>

              {/* HOURS */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={15} />
                </div>
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "0.9rem" }}>Store Hours</p>
                  <p style={{ color: "#d6c2aa", fontSize: "0.82rem", lineHeight: "1.6" }}>
                    Mon - Sat: 9:00 AM - 6:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}