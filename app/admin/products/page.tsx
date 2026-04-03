"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Package, AlertTriangle, XCircle } from "lucide-react";

type Status = "In Stock" | "Low Stock" | "Out of Stock";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: Status;
  image: string | null;
  description?: string;
  sizes?: number[];
}

const EMPTY_FORM = {
  name: "",
  category: "Men",
  price: "",
  stock: "",
  imageUrl: "",
  description: "",
};

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Low Stock" | "Out of Stock"
  >("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sizes state
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);

  const [form, setForm] = useState(EMPTY_FORM);

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const data: Product[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalItems = products.length;
  const lowStockCount = products.filter((p) => p.status === "Low Stock").length;
  const outOfStock = products.filter((p) => p.status === "Out of Stock").length;

  // ─── Stat cards config ────────────────────────────────────────────────────
  const STAT_CARDS = [
    {
      label: "Total Items",
      value: totalItems,
      icon: <Package size={20} color="#a07840" />,
      active: statusFilter === "All",
      onClick: () => setStatusFilter("All"),
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      icon: <AlertTriangle size={20} color="#a07840" />,
      active: statusFilter === "Low Stock",
      onClick: () =>
        setStatusFilter(statusFilter === "Low Stock" ? "All" : "Low Stock"),
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: <XCircle size={20} color="#a07840" />,
      active: statusFilter === "Out of Stock",
      onClick: () =>
        setStatusFilter(
          statusFilter === "Out of Stock" ? "All" : "Out of Stock",
        ),
    },
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const statusStyles: Record<Status, string> = {
    "In Stock": "bg-green-100 text-green-700",
    "Low Stock": "bg-yellow-100 text-yellow-700",
    "Out of Stock": "bg-red-100 text-red-700",
  };

  const getStatus = (stock: number): Status => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 5) return "Low Stock";
    return "In Stock";
  };

  // ─── Toggle size ──────────────────────────────────────────────────────────
  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b),
    );
  };

  // ─── Open modal for Add ───────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setSelectedSizes([]);
    setShowModal(true);
  };

  // ─── Open modal for Edit ──────────────────────────────────────────────────
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.image || "",
      description: product.description || "",
    });
    setImageFile(null);
    setImagePreview(product.image || "");
    setSelectedSizes(product.sizes ?? []);
    setShowModal(true);
  };

  // ─── Handle file selection ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  // ─── Convert image to Base64 ──────────────────────────────────────────────
  const uploadImage = async (): Promise<string | null> => {
    if (imageFile) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    }
    if (form.imageUrl) return form.imageUrl;
    return editingProduct?.image || null;
  };

  // ─── Save (Add or Edit) ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) return;
    setSaving(true);

    try {
      const stock = parseInt(form.stock);
      const imageUrl = await uploadImage();

      const payload = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        stock,
        status: getStatus(stock),
        image: imageUrl,
        description: form.description || "",
        sizes: selectedSizes,
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), payload);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      closeModal();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product.");
    }
  };

  // ─── Close modal ──────────────────────────────────────────────────────────
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setSelectedSizes([]);
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategory === "All Categories" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col p-8 bg-[#f5f1ed] font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2b1a0e]">
            Product Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your shoe inventory
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#2b1a0e] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#3d2510] transition"
        >
          <span className="text-lg leading-none">+</span> Add Product
        </button>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {STAT_CARDS.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: card.active
                ? "0 0 0 2px #a07840, 0 2px 10px rgba(60,36,20,0.08)"
                : "0 1px 6px rgba(60,36,20,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              border: "none",
              textAlign: "left",
              transition: "box-shadow 0.18s",
              fontFamily: "Georgia, serif",
            }}
            onMouseEnter={(e) => {
              if (!card.active)
                e.currentTarget.style.boxShadow =
                  "0 0 0 1.5px #d4b896, 0 2px 10px rgba(60,36,20,0.08)";
            }}
            onMouseLeave={(e) => {
              if (!card.active)
                e.currentTarget.style.boxShadow =
                  "0 1px 6px rgba(60,36,20,0.06)";
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
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20 bg-white"
            >
              <option>All Categories</option>
              <option>Men</option>
              <option>Women</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
              ▾
            </span>
          </div>

          {/* Active status filter badge */}
          {statusFilter !== "All" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#fdf3e6] border border-[#d4b896] text-xs text-[#a07840] font-semibold">
              {statusFilter}
              <button
                onClick={() => setStatusFilter("All")}
                className="ml-1 text-[#a07840] hover:text-[#2b1a0e] transition font-bold leading-none"
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading products…
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-gray-400 text-xs tracking-widest uppercase">
                  <th className="pb-3 pr-4 font-semibold">Image</th>
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 font-semibold">Price</th>
                  <th className="pb-3 pr-4 font-semibold">Stock</th>
                  <th className="pb-3 pr-4 font-semibold">Sizes</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-4 pr-4">
                      <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-300 text-xl">👟</span>
                        )}
                      </div>
                    </td>
                    <td className="pr-4 font-semibold text-[#2b1a0e]">
                      {p.name}
                    </td>
                    <td className="pr-4 text-gray-500">{p.category}</td>
                    <td className="pr-4 font-semibold text-[#2b1a0e]">
                      ₱{p.price.toLocaleString()}
                    </td>
                    <td className="pr-4 text-gray-700">{p.stock}</td>
                    <td className="pr-4 text-gray-500 text-xs">
                      {p.sizes && p.sizes.length > 0 ? (
                        p.sizes.join(", ")
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-amber-500 hover:text-amber-700 transition"
                          title="Edit product"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-600 transition"
                          title="Delete product"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-gray-400 text-sm"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#2b1a0e] mb-1">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <hr className="border-gray-100 mb-6 mt-3" />

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Product Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
                />
              </div>

              {/* Category + Price */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-sm text-gray-500 mb-1 block">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20 bg-white"
                    >
                      <option>Men</option>
                      <option>Women</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                      ▾
                    </span>
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="text-sm text-gray-500 mb-1 block">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Stock
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
                />
              </div>

              {/* Shoe Sizes */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">
                  Available Sizes (EU)
                  <span className="ml-2 text-xs text-gray-400">
                    — click to toggle on/off
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const active = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`w-11 h-11 rounded-lg text-xs font-semibold border transition-all
                          ${
                            active
                              ? "bg-[#2b1a0e] text-white border-[#2b1a0e] scale-105"
                              : "bg-white text-gray-500 border-gray-200 hover:border-[#2b1a0e]/50 hover:text-[#2b1a0e]"
                          }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {selectedSizes.length > 0 ? (
                  <p className="mt-2 text-xs text-[#2b1a0e]/60 font-medium">
                    Selected: EU {selectedSizes.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-300">
                    No sizes selected yet
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Product Image
                </label>

                {imagePreview && (
                  <div className="mb-3 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setForm((prev) => ({ ...prev, imageUrl: "" }));
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-[#2b1a0e]/40 hover:bg-gray-50 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-400">
                    {imageFile
                      ? imageFile.name
                      : "Click to choose an image from your desktop"}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">or paste a URL</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <input
                  value={form.imageUrl}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    setImagePreview(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="mt-3 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#2b1a0e]/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#2b1a0e] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3d2510] transition disabled:opacity-60 flex items-center gap-2"
              >
                {saving && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {saving
                  ? "Saving…"
                  : editingProduct
                    ? "Save Changes"
                    : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
