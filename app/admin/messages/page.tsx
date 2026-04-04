"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import {
  Mail,
  MailOpen,
  Clock,
  User,
  AtSign,
  MessageSquare,
  Trash2,
  Reply,
} from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "read" | "unread";
  createdAt: string;
}

type Filter = "all" | "unread" | "read";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "—",
          email: d.data().email ?? "—",
          subject: d.data().subject ?? "—",
          message: d.data().message ?? "—",
          status: d.data().status ?? "unread",
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? "",
        })),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const markAsRead = (id: string) =>
    updateDoc(doc(db, "messages", id), { status: "read" });
  const markAsUnread = (id: string) =>
    updateDoc(doc(db, "messages", id), { status: "unread" });
  const markAsReplied = (id: string) =>
    updateDoc(doc(db, "messages", id), { status: "replied" });
  const deleteMessage = (id: string) => deleteDoc(doc(db, "messages", id));

  const handleExpand = (msg: Message) => {
    const opening = expandedId !== msg.id;
    setExpandedId(opening ? msg.id : null);
    if (opening && msg.status === "unread") markAsRead(msg.id);
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  const filtered = messages.filter((m) => {
    const matchFilter =
      filter === "all" ||
      (filter === "unread" && m.status === "unread") ||
      (filter === "read" && m.status === "read");
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    fontFamily: "Georgia, serif",
    letterSpacing: "0.5px",
    background: active ? "#3a2414" : "#f0ebe4",
    color: active ? "#f5e6d3" : "#9a8070",
    transition: "all 0.15s",
  });

  const metaCards = (
    msg: Message,
  ): { label: string; value: string; Icon: React.ElementType }[] => [
    { label: "From", value: msg.name, Icon: User },
    { label: "Email", value: msg.email, Icon: AtSign },
    { label: "Subject", value: msg.subject, Icon: MessageSquare },
  ];

  const handleMarkUnread = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    markAsUnread(id);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    deleteMessage(id);
    setExpandedId(null);
  };

  return (
    <div
      style={{
        minHeight: "87vh",
        background: "#f3efe9",
        padding: "28px 32px 60px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#1a0e06",
              margin: "0 0 4px",
            }}
          >
            Messages
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
            Customer inquiries from the contact form
          </p>
        </div>
        {unreadCount > 0 && (
          <div
            style={{
              backgroundColor: "#a07840",
              color: "#fff",
              borderRadius: "20px",
              padding: "6px 18px",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "1px",
              alignSelf: "center",
            }}
          >
            {unreadCount} UNREAD
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {(
          [
            { label: "Total", value: messages.length, f: "all" },
            {
              label: "Unread",
              value: messages.filter((m) => m.status === "unread").length,
              f: "unread",
            },
            {
              label: "Read",
              value: messages.filter((m) => m.status === "read").length,
              f: "read",
            },
          ] as { label: string; value: number; f: Filter }[]
        ).map((card) => (
          <button
            key={card.label}
            onClick={() => setFilter(filter === card.f ? "all" : card.f)}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow:
                filter === card.f
                  ? "0 0 0 2px #a07840, 0 2px 10px rgba(60,36,20,0.08)"
                  : "0 1px 6px rgba(60,36,20,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              border: "none",
              fontFamily: "Georgia, serif",
              textAlign: "left",
              transition: "box-shadow 0.18s",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#9a8070",
                  margin: "0 0 8px",
                  fontWeight: 700,
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {loading ? "—" : card.value}
              </p>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fdf3e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={20} color="#a07840" />
            </div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f0ebe4",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
            <MessageSquare
              size={14}
              color="#b0a090"
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 36px",
                border: "1.5px solid #e8e0d8",
                borderRadius: "10px",
                fontSize: "0.85rem",
                color: "#3a2010",
                background: "#fdf9f5",
                outline: "none",
                fontFamily: "Georgia, serif",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["all", "unread", "read"] as Filter[]).map((f) => (
              <button
                key={f}
                style={pillStyle(filter === f)}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#9a8070",
              fontSize: "0.88rem",
            }}
          >
            Loading messages…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#9a8070",
              fontSize: "0.88rem",
            }}
          >
            No messages found.
          </div>
        ) : (
          filtered.map((msg, i) => {
            const isExpanded = expandedId === msg.id;
            const isLast = i === filtered.length - 1;
            const isUnread = msg.status === "unread";

            return (
              <React.Fragment key={msg.id}>
                {/* Row */}
                <div
                  onClick={() => handleExpand(msg)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr auto",
                    alignItems: "center",
                    gap: "16px",
                    padding: "15px 24px",
                    borderBottom:
                      isLast && !isExpanded ? "none" : "1px solid #f0ebe4",
                    background: isExpanded
                      ? "#fffcf9"
                      : isUnread
                        ? "#fdf9f5"
                        : "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded)
                      (e.currentTarget as HTMLDivElement).style.background =
                        "#fdf9f5";
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded)
                      (e.currentTarget as HTMLDivElement).style.background =
                        isUnread ? "#fdf9f5" : "#fff";
                  }}
                >
                  <div>
                    {isUnread ? (
                      <Mail size={17} color="#a07840" />
                    ) : (
                      <MailOpen size={17} color="#c0b0a0" />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "3px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: isUnread ? 700 : 500,
                          fontSize: "0.9rem",
                          color: "#1a0e06",
                        }}
                      >
                        {msg.name}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#9a8070" }}>
                        {msg.email}
                      </span>
                      {isUnread && (
                        <span
                          style={{
                            backgroundColor: "#a07840",
                            color: "#fff",
                            borderRadius: "10px",
                            padding: "1px 8px",
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            letterSpacing: "1px",
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#3a2010",
                        fontWeight: 600,
                        marginBottom: "2px",
                      }}
                    >
                      {msg.subject}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#7a6050",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "520px",
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.72rem",
                      color: "#9a8070",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Clock size={11} />
                    {formatDate(msg.createdAt)}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 24px 24px",
                      background: "#fffcf9",
                      borderBottom: !isLast ? "1px solid #f0ebe4" : "none",
                    }}
                  >
                    {/* Meta cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      {metaCards(msg).map(({ label, value, Icon }) => (
                        <div
                          key={label}
                          style={{
                            background: "#f7f3ef",
                            borderRadius: "10px",
                            marginTop: "15px",
                            padding: "12px 16px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.6rem",
                              letterSpacing: "2px",
                              textTransform: "uppercase",
                              color: "#9a8070",
                              margin: "0 0 5px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Icon size={12} />
                            {label}
                          </p>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#1a0e06",
                              margin: 0,
                              wordBreak: "break-all",
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Message body */}
                    <div
                      style={{
                        background: "#f7f3ef",
                        borderRadius: "10px",
                        padding: "16px 20px",
                        marginBottom: "14px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "#9a8070",
                          margin: "0 0 10px",
                          fontWeight: 700,
                        }}
                      >
                        Message
                      </p>
                      <p
                        style={{
                          fontSize: "0.88rem",
                          color: "#1a0e06",
                          margin: 0,
                          lineHeight: 1.75,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.message}
                      </p>
                    </div>

                    {/* Actions */}
                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                          handleMarkUnread(e, msg.id)
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#f0ebe4",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "#7a6050",
                          cursor: "pointer",
                          fontFamily: "Georgia, serif",
                        }}
                      >
                        <Mail size={13} />
                        Mark as unread
                      </button>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                            handleDelete(e, msg.id)
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#fdecea",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#c62828",
                            cursor: "pointer",
                            fontFamily: "Georgia, serif",
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>

                        <button
                          onClick={() => {
                            markAsReplied(msg.id); // ← add this
                            window.open(
                              "https://mail.google.com/mail/?view=cm&to=" +
                                encodeURIComponent(msg.email) +
                                "&su=" +
                                encodeURIComponent("Re: " + msg.subject) +
                                "&body=" +
                                encodeURIComponent(
                                  "\n\n---\nReplying to: " + msg.message,
                                ),
                              "_blank",
                            );
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#3a2414",
                            color: "#f5e6d3",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            letterSpacing: "0.5px",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "Georgia, serif",
                          }}
                        >
                          <Reply size={14} />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

        {/* Footer */}
        <div
          style={{
            padding: "13px 24px",
            borderTop: "1px solid #f0ebe4",
            fontSize: "0.73rem",
            color: "#9a8070",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {filtered.length} of {messages.length} messages
          </span>
          <span
            style={{
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontSize: "0.63rem",
            }}
          >
            Pando · Messages
          </span>
        </div>
      </div>
    </div>
  );
}
