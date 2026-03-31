"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Archive,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

import styles from "./design.module.scss"; // ✅ MODULE IMPORT

const menu = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Products", path: "/admin/products", icon: Boxes },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { name: "Inventory", path: "/admin/inventory", icon: Archive },
  { name: "Customers", path: "/admin/customers", icon: Users },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>PANDO</div>

      <div className={styles.section}>MANAGEMENT</div>

      <nav className={styles.menu}>
        {menu.map((item, i) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.path ||
            (item.path !== "/admin" && pathname.startsWith(item.path));

          return (
            <Link key={i} href={item.path} className={styles.link}>
              <div
                className={`${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`}
              >
                <Icon className={styles.icon} size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}