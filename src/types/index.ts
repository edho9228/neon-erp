// NEON ERP Types

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Company types
export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string;
  bankName?: string;
  bankAccount?: string;
}

// Master Item types
export interface MasterItem {
  id: string;
  code: string;
  name: string;
  category: 'Civil' | 'MEP' | 'Interior' | 'General';
  unit: string;
  price: number;
  description?: string;
  isActive: boolean;
}

// Project types
export type ProjectStatus = 'Draft' | 'Negotiation' | 'Deal' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  code: string;
  name: string;
  clientName: string;
  clientContact: string;
  clientEmail?: string;
  clientAddress?: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  progress: number;
  progressNote?: string;
  contractValue: number;
  modalKerja: number;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RAB types
export interface RABItem {
  id: string;
  projectId: string;
  itemId: string;
  item?: MasterItem;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

// Transaction types
export type TransactionType = 'Income' | 'Expense';
export type TransactionCategory = 'Material' | 'Labor' | 'Overhead' | 'Payment' | 'Other';

export interface Transaction {
  id: string;
  projectId: string;
  userId?: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: Date;
  receipt?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tender types
export type TenderStatus = 'Submitted' | 'Negotiation' | 'Won' | 'Lost';

export interface Tender {
  id: string;
  projectId: string;
  name: string;
  value: number;
  status: TenderStatus;
  submitDate: Date;
  resultDate?: Date;
  notes?: string;
}

// Inventory types
export interface InventoryHO {
  id: string;
  itemId: string;
  item?: MasterItem;
  quantity: number;
  minStock: number;
  location?: string;
}

export interface InventorySite {
  id: string;
  projectId: string;
  itemId: string;
  quantity: number;
}

// Budget Plan types
export type BudgetCategory = 'Material' | 'Labor' | 'Equipment' | 'Overhead' | 'Subcon';

export interface BudgetPlan {
  id: string;
  projectId: string;
  category: BudgetCategory;
  description: string;
  planned: number;
  actual: number;
  variance: number;
  month: number;
  year: number;
}

// Progress History
export interface ProgressHistory {
  id: string;
  projectId: string;
  progress: number;
  note?: string;
  date: Date;
}

// Activity Log
export interface ActivityLog {
  id: string;
  userId?: string;
  module: string;
  action: string;
  details?: string;
  projectId?: string;
  createdAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalExpenses: number;
  totalIncome: number;
  netProfitLoss: number;
  projectsByStatus: { status: string; count: number }[];
  monthlyData: { month: string; income: number; expense: number }[];
  projectProfitLoss: { id: string; name: string; value: number }[];
  recentActivities: ActivityLog[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProjectFormData {
  code: string;
  name: string;
  clientName: string;
  clientContact: string;
  clientEmail?: string;
  clientAddress?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  progress: number;
  progressNote?: string;
  contractValue: number;
  modalKerja: number;
}

export interface TransactionFormData {
  projectId: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  notes?: string;
}

export interface ItemFormData {
  code: string;
  name: string;
  category: 'Civil' | 'MEP' | 'Interior' | 'General';
  unit: string;
  price: number;
  description?: string;
}

export interface RABFormData {
  projectId: string;
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

export interface BudgetPlanFormData {
  projectId: string;
  category: BudgetCategory;
  description: string;
  planned: number;
  month: number;
  year: number;
}
