import { useState } from "react";
import { MENU_ITEMS, INIT_ORDERS, INIT_CUSTOMERS, INIT_KDS } from "../data/constants";
import { INIT_TABLES } from "../data/tableConstants";
import { INIT_STAFF } from "../data/staffConstants";
import { INIT_DISCOUNTS } from "../data/discountConstants";
import { INIT_INVENTORY } from "../data/inventoryConstants.js";
import Orders from "./orders/Orders";
import Kitchen from "./kitchen/Kitchen";
import CRM from "./crm/CRM";
import Analytics from "./analytics/Analytics";
import Menu from "./menu/Menu";
import Inventory from "./inventory/Inventory";
import Staff from "./staff/Staff";
import Tables from "./tables/Tables";
import Discounts from "./discounts/Discounts";
import Settings from "./settings/Settings";
import Delivery from "./delivery/Delivery";
import Layout from "./layout/Layout";

export default function BrewCRM() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [kdsCards, setKdsCards] = useState(INIT_KDS);
  const [menuItems, setMenuItems] = useState(MENU_ITEMS.map(m => ({ ...m, active: true, eightySixed: false })));
  const [tables, setTables] = useState(INIT_TABLES);
  const [staff, setStaff] = useState(INIT_STAFF);
  const [discounts, setDiscounts] = useState(INIT_DISCOUNTS);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [inventory, setInventory] = useState(INIT_INVENTORY);

  const newOrderCount = orders.filter(o => o.status === "NEW").length;
  const urgentKds = kdsCards.filter(c => c.urgency === "urgent").length;

  console.log("BrewCRM rendering", { tab, orders, customers, kdsCards, menuItems });

  return (
    <Layout tab={tab} setTab={setTab} newOrderCount={newOrderCount} urgentKds={urgentKds}>
      {tab === "orders" && <Orders orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} tables={tables} setTables={setTables} staff={staff} discounts={discounts} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} />}
      {tab === "kitchen" && <Kitchen kdsCards={kdsCards} setKdsCards={setKdsCards} orders={orders} setOrders={setOrders} />}
      {tab === "crm" && <CRM customers={customers} setCustomers={setCustomers} orders={orders} kdsCards={kdsCards} />}
      {tab === "analytics" && <Analytics orders={orders} customers={customers} />}
      {tab === "menu" && <Menu menuItems={menuItems} setMenuItems={setMenuItems} />}
      {tab === "inventory" && <Inventory inventory={inventory} setInventory={setInventory} />}
      {tab === "staff" && <Staff staff={staff} setStaff={setStaff} orders={orders} />}
      {tab === "tables" && <Tables tables={tables} setTables={setTables} />}
      {tab === "discounts" && <Discounts discounts={discounts} setDiscounts={setDiscounts} />}
      {tab === "delivery" && <Delivery deliveryOrders={deliveryOrders} setDeliveryOrders={setDeliveryOrders} orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} />}
      {tab === "settings" && <Settings />}
    </Layout>
  );
}
