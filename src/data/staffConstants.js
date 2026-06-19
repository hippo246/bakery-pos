// Initial staff data for BrewCRM

export const INIT_STAFF = [
  { id: "staff-001", name: "Rahul Sharma", role: "Manager", phone: "9876543210", email: "rahul@brewcrm.com", status: "active", joinDate: "2024-01-15", hourlyRate: 500, shifts: ["morning", "evening"], avatar: "RS" },
  { id: "staff-002", name: "Priya Patel", role: "Barista", phone: "9876543211", email: "priya@brewcrm.com", status: "active", joinDate: "2024-02-01", hourlyRate: 300, shifts: ["morning"], avatar: "PP" },
  { id: "staff-003", name: "Amit Kumar", role: "Barista", phone: "9876543212", email: "amit@brewcrm.com", status: "active", joinDate: "2024-02-15", hourlyRate: 300, shifts: ["evening"], avatar: "AK" },
  { id: "staff-004", name: "Sneha Reddy", role: "Waiter", phone: "9876543213", email: "sneha@brewcrm.com", status: "active", joinDate: "2024-03-01", hourlyRate: 250, shifts: ["morning", "evening"], avatar: "SR" },
  { id: "staff-005", name: "Vikram Singh", role: "Chef", phone: "9876543214", email: "vikram@brewcrm.com", status: "active", joinDate: "2024-01-20", hourlyRate: 450, shifts: ["morning"], avatar: "VS" },
  { id: "staff-006", name: "Anjali Gupta", role: "Waiter", phone: "9876543215", email: "anjali@brewcrm.com", status: "on_leave", joinDate: "2024-03-10", hourlyRate: 250, shifts: ["evening"], avatar: "AG" },
  { id: "staff-007", name: "Rajesh Mehta", role: "Kitchen Staff", phone: "9876543216", email: "rajesh@brewcrm.com", status: "active", joinDate: "2024-02-20", hourlyRate: 280, shifts: ["morning", "evening"], avatar: "RM" },
  { id: "staff-008", name: "Kavita Nair", role: "Barista", phone: "9876543217", email: "kavita@brewcrm.com", status: "active", joinDate: "2024-04-01", hourlyRate: 300, shifts: ["morning"], avatar: "KN" },
];

export const STAFF_ROLES = ["All", "Manager", "Barista", "Waiter", "Chef", "Kitchen Staff"];
export const STAFF_STATUS = ["All", "active", "on_leave", "inactive"];
export const SHIFT_TYPES = ["morning", "evening", "night"];
