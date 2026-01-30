export const CATEGORY_SEPARATOR = " › ";

/**
 * Categories with subcategories. Each key is a main category,
 * each value is an array of subcategories.
 */
export const EXPENSE_CATEGORIES = {
  "Food & Dining": [
    "Groceries",
    "Restaurants",
    "Cafes & Coffee",
    "Food Delivery",
    "Alcohol & Bars",
    "Snacks",
    "Other",
  ],
  Transport: [
    "Fuel",
    "Public Transport",
    "Taxi & Rideshare",
    "Parking",
    "Car Maintenance",
    "Flights",
    "Railways",
    "Other",
  ],
  Shopping: [
    "Clothing",
    "Electronics",
    "Home & Garden",
    "Personal Care",
    "Gifts",
    "Other",
  ],
  "Bills & Utilities": [
    "Rent/Mortgage",
    "Electricity",
    "Water",
    "Gas",
    "Internet",
    "Phone",
    "Insurance",
    "Other",
  ],
  Entertainment: [
    "Movies",
    "Streaming",
    "Games",
    "Books",
    "Music",
    "Events",
    "Hobbies",
    "Other",
  ],
  Health: [
    "Doctor",
    "Pharmacy",
    "Gym",
    "Health Insurance",
    "Medical Supplies",
    "Other",
  ],
  Education: ["Courses", "School Fees", "Books", "Supplies", "Other"],
  Travel: [
    "Accommodation",
    "Flights",
    "Local Transport",
    "Activities",
    "Other",
  ],
  Personal: [
    "Gifts & Donations",
    "Subscriptions",
    "Pet Care",
    "Childcare",
    "Other",
  ],
  Business: ["Office Supplies", "Software", "Professional Services", "Other"],
  "Fees & Charges": ["Bank Fees", "Late Fees", "Interest", "Other"],
  Other: ["General"],
} as const satisfies Record<string, readonly string[]>;

export type ExpenseCategoryKey = keyof typeof EXPENSE_CATEGORIES;

export type ExpenseSubcategory =
  (typeof EXPENSE_CATEGORIES)[ExpenseCategoryKey][number];

/** Flattened list of all valid category values (e.g. "Food & Dining › Groceries") */
export function getAllCategoryValues(): string[] {
  const values: string[] = [];
  for (const [category, subcategories] of Object.entries(EXPENSE_CATEGORIES)) {
    for (const sub of subcategories) {
      values.push(`${category}${CATEGORY_SEPARATOR}${sub}`);
    }
  }
  return values;
}

export const ALL_CATEGORY_VALUES = getAllCategoryValues();

export interface Expense {
  id: string;
  userId: string;
  amount: number; // in paise (1 ₹ = 100 paise)
  category: string;
  note: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;
