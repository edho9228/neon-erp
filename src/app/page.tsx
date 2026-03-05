'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, ReferenceLine
} from 'recharts';
import { 
  LayoutDashboard, FolderKanban, Calculator, Package, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Printer, Search,
  TrendingUp, TrendingDown, DollarSign, Building2, Users, Users2, UserPlus,
  Calendar, CheckCircle, Clock, AlertTriangle, ArrowRightLeft,
  ChevronRight, ChevronDown, Menu, X, Loader2, MessageCircle, Send, LogIn, Upload,
  RefreshCw, HandCoins, Undo2, History, Download, Database, AlertCircle, HardDrive, Box
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Client {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  _count?: { projects: number };
}

interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  client?: Client;
  status: string;
  progress: number;
  contractValue: number;
  modalKerja: number;
  startDate?: string;
  endDate?: string;
  responsible?: string;
  rabItems?: RABItem[];
  transactions?: Transaction[];
  budgetPlans?: BudgetPlan[];
}

interface MasterItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
}

interface RABItem {
  id: string;
  itemId: string;
  item: MasterItem;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

interface Transaction {
  id: string;
  projectId: string;
  project?: Project;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

interface BudgetPlan {
  id: string;
  category: string;
  description?: string;
  planned: number;
  actual: number;
  variance: number;
  month: number;
  year: number;
}

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice: number;
  currentValue: number;
  condition: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  isActive: boolean;
  // Loan fields
  loanStatus: string;
  borrowerName?: string;
  loanDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  loans?: AssetLoan[];
}

interface AssetLoan {
  id: string;
  assetId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerAddress?: string;
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: string;
  notes?: string;
  returnNotes?: string;
  returnedCondition?: string;
  asset?: {
    code: string;
    name: string;
    category: string;
    condition: string;
  };
}

interface DashboardStats {
  totalProjects: number;
  totalContractValue: number;
  totalBudget: number;
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
  profitMargin: number;
}

interface TreemapData {
  id: string;
  name: string;
  profit: number;
  isProfit: boolean;
  value: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  recipientId?: string;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'InProgress': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    case 'Deal': return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'Negotiation': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    case 'Draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    case 'Cancelled':
    case 'Lost': return 'bg-red-500/20 text-red-400 border-red-500/50';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  }
};

const COLORS = ['#00f3ff', '#00ff41', '#f59e0b', '#a855f7', '#f97316', '#ef4444', '#3b82f6'];

export default function NEONERP() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isVisitor, setIsVisitor] = useState(false);

  // Users management
  const [users, setUsers] = useState<any[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userForm, setUserForm] = useState<any>({});

  // Clients management
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [clientForm, setClientForm] = useState<any>({});

  // RAB items
  const [rabItems, setRabItems] = useState<RABItem[]>([]);

  // Navigation
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<MasterItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [projectDailyData, setProjectDailyData] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState<any>({});
  const [transactionForm, setTransactionForm] = useState<any>({});
  const [itemForm, setItemForm] = useState<any>({});
  const [rabForm, setRabForm] = useState<any>({});
  const [progressForm, setProgressForm] = useState<any>({});
  const [budgetForm, setBudgetForm] = useState<any>({});
  const [companyForm, setCompanyForm] = useState<any>({});

  // Dialog states
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showRABDialog, setShowRABDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Journal states
  const [journalProject, setJournalProject] = useState<string>('all');
  const [journalStartDate, setJournalStartDate] = useState<string>('');
  const [journalEndDate, setJournalEndDate] = useState<string>('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [journalSummary, setJournalSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    transactionCount: 0
  });
  
  // Internal Journal states
  const [journalTab, setJournalTab] = useState<'project' | 'internal'>('project');
  const [internalEntries, setInternalEntries] = useState<any[]>([]);
  const [internalSummary, setInternalSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    transactionCount: 0
  });
  const [showInternalDialog, setShowInternalDialog] = useState(false);
  const [internalForm, setInternalForm] = useState<any>({});

  // Asset states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSummary, setAssetSummary] = useState({
    totalAssets: 0,
    activeCount: 0,
    totalPurchaseValue: 0,
    totalCurrentValue: 0,
    loanedCount: 0,
    availableCount: 0,
  });
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [assetForm, setAssetForm] = useState<any>({});
  
  // Asset Loan states
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLoanHistoryDialog, setShowLoanHistoryDialog] = useState(false);
  const [loanForm, setLoanForm] = useState<any>({});
  const [returnForm, setReturnForm] = useState<any>({});
  const [assetLoans, setAssetLoans] = useState<AssetLoan[]>([]);
  const [selectedAssetForLoan, setSelectedAssetForLoan] = useState<Asset | null>(null);

  // Item search state
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');

  // RAB edit state - track edited descriptions
  const [editedRabItems, setEditedRabItems] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // RAB collapse state - track which projects are collapsed
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Settings PIN states
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [hasSettingsAccess, setHasSettingsAccess] = useState(false);
  const [showChangePinDialog, setShowChangePinDialog] = useState(false);
  const [changePinForm, setChangePinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });

  // Effect to update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        loadInitialData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to load users when settings is opened
  useEffect(() => {
    if (activeMenu === 'settings' && user?.role === 'admin') {
      loadUsers();
    }
    if (activeMenu === 'accounting') {
      loadTransactions();
    }
    if (activeMenu === 'rab' && selectedProject) {
      loadRABItems(selectedProject);
    }
    if (activeMenu === 'journal') {
      loadJournalData();
      loadInternalData();
    }
    if (activeMenu === 'assets') {
      loadAssets();
    }
     
  }, [activeMenu, selectedProject, user?.role]);

  // Effect to reload dashboard when selected project changes
  useEffect(() => {
    if (user && activeMenu === 'dashboard') {
      loadDashboard(selectedProject);
      loadTransactions(selectedProject);
    }
     
  }, [selectedProject, user, activeMenu]);

  // Effect to reload journal when journal project filter changes
  useEffect(() => {
    if (user && activeMenu === 'journal') {
      if (journalTab === 'project') {
        loadJournalData();
      } else {
        loadInternalData();
      }
    }
     
  }, [journalProject, journalTab, user, activeMenu]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setLoginError(data.error || 'Login gagal');
        return;
      }
      
      setUser(data.user);
      loadInitialData();
    } catch (error) {
      setLoginError('Terjadi kesalahan server');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const loadInitialData = async () => {
    await Promise.all([
      loadDashboard(selectedProject),
      loadProjects(),
      loadClients(),
      loadItems(),
      loadCompany(),
      loadTransactions('all'),
    ]);
  };

  const loadDashboard = async (projectId?: string) => {
    try {
      const url = projectId && projectId !== 'all' 
        ? `/api/dashboard?projectId=${projectId}` 
        : '/api/dashboard';
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setDashboardStats(data.stats);
      setDailyData(data.dailyData || []);
      setTreemapData(data.treemapData || []);
      setStatusDistribution(data.statusDistribution || []);
      setProjectStats(data.projects || []);
      setActivityLogs(data.activityLogs || []);
      setProjectDailyData(data.projectDailyData || []);
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects', { credentials: 'include' });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Load projects error:', error);
    }
  };

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' });
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Load clients error:', error);
    }
  };

  const loadItems = async (search?: string, category?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      
      const url = `/api/items${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Load items error:', error);
    }
  };

  const loadCompany = async () => {
    try {
      const res = await fetch('/api/company', { credentials: 'include' });
      const data = await res.json();
      setCompany(data.company);
      setCompanyForm(data.company || {});
    } catch (error) {
      console.error('Load company error:', error);
    }
  };

  // Load company data on mount for login page display
  useEffect(() => {
    loadCompany();
  }, []);

  const loadTransactions = async (projectId?: string) => {
    try {
      const url = `/api/transactions?projectId=${projectId || selectedProject}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
    }
  };

  const seedDatabase = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      toast({ title: 'Success', description: data.message });
      loadInitialData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed database', variant: 'destructive' });
    }
  };

  // Settings PIN functions
  const verifySettingsPin = async () => {
    try {
      const res = await fetch('/api/settings/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setHasSettingsAccess(true);
        setShowPinDialog(false);
        setPinInput('');
        setPinError('');
        setActiveMenu('settings');
      } else {
        setPinError(data.error || 'PIN salah');
      }
    } catch (error) {
      setPinError('Terjadi kesalahan saat verifikasi PIN');
    }
  };

  const changeSettingsPin = async () => {
    if (changePinForm.newPin !== changePinForm.confirmPin) {
      toast({ title: 'Error', description: 'PIN baru dan konfirmasi tidak cocok', variant: 'destructive' });
      return;
    }
    
    if (changePinForm.newPin.length < 4) {
      toast({ title: 'Error', description: 'PIN minimal 4 digit', variant: 'destructive' });
      return;
    }
    
    try {
      const res = await fetch('/api/settings/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changePinForm),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success', description: 'PIN berhasil diubah' });
        setShowChangePinDialog(false);
        setChangePinForm({ currentPin: '', newPin: '', confirmPin: '' });
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal mengubah PIN', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan saat mengubah PIN', variant: 'destructive' });
    }
  };

  const handleMenuClick = (menuId: string) => {
    if (menuId === 'settings' && user?.role === 'admin' && !hasSettingsAccess) {
      setShowPinDialog(true);
    } else {
      setActiveMenu(menuId);
    }
  };

  // Asset functions
  const loadAssets = async () => {
    try {
      const res = await fetch('/api/assets', { credentials: 'include' });
      const data = await res.json();
      setAssets(data.assets || []);
      setAssetSummary(data.summary || {
        totalAssets: 0,
        activeCount: 0,
        totalPurchaseValue: 0,
        totalCurrentValue: 0,
        loanedCount: 0,
        availableCount: 0,
      });
    } catch (error) {
      console.error('Load assets error:', error);
    }
  };

  const saveAsset = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...assetForm, id: editingId } : assetForm;

      const res = await fetch('/api/assets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save asset');

      toast({ title: 'Success', description: 'Asset berhasil disimpan' });
      setShowAssetDialog(false);
      setEditingId(null);
      setAssetForm({});
      loadAssets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save asset', variant: 'destructive' });
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return;

    try {
      await fetch('/api/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      toast({ title: 'Success', description: 'Asset deleted' });
      loadAssets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' });
    }
  };

  // Asset Loan functions
  const createLoan = async () => {
    try {
      if (!loanForm.assetId || !loanForm.borrowerName || !loanForm.loanDate || !loanForm.expectedReturnDate) {
        toast({ title: 'Error', description: 'Data peminjaman tidak lengkap', variant: 'destructive' });
        return;
      }

      const res = await fetch('/api/assets/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanForm),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create loan');

      toast({ title: 'Success', description: 'Peminjaman berhasil dicatat' });
      setShowLoanDialog(false);
      setLoanForm({});
      setSelectedAssetForLoan(null);
      loadAssets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create loan', variant: 'destructive' });
    }
  };

  const returnAsset = async () => {
    try {
      if (!returnForm.loanId) {
        toast({ title: 'Error', description: 'Data pengembalian tidak valid', variant: 'destructive' });
        return;
      }

      const res = await fetch('/api/assets/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnForm),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to return asset');

      toast({ title: 'Success', description: 'Pengembalian berhasil dicatat' });
      setShowReturnDialog(false);
      setReturnForm({});
      setSelectedAssetForLoan(null);
      loadAssets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to return asset', variant: 'destructive' });
    }
  };

  const loadLoanHistory = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/loans?assetId=${assetId}`, { credentials: 'include' });
      const data = await res.json();
      setAssetLoans(data.loans || []);
    } catch (error) {
      console.error('Load loan history error:', error);
    }
  };

  // Visitor mode
  const enterVisitorMode = () => {
    setIsVisitor(true);
    loadInitialData();
  };

  // Load users
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  // Chat functions
  const loadChatMessages = async () => {
    try {
      const res = await fetch('/api/chat?limit=100', { credentials: 'include' });
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Load chat messages error:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const res = await fetch('/api/chat/online-users', { credentials: 'include' });
      const data = await res.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('Load online users error:', error);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || chatLoading) return;

    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();
      setChatMessages([...chatMessages, data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  };

  // Poll for new messages every 5 seconds when chat is open
  useEffect(() => {
    if (user && showChat) {
      loadChatMessages();
      loadOnlineUsers();
      const interval = setInterval(() => {
        loadChatMessages();
        loadOnlineUsers();
      }, 5000);
      return () => clearInterval(interval);
    }
     
  }, [user, showChat]);

  // User CRUD
  const saveUser = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...userForm, id: editingId } : userForm;

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save user');

      toast({ title: 'Success', description: 'User saved successfully' });
      setShowUserDialog(false);
      setEditingId(null);
      setUserForm({});
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      toast({ title: 'Success', description: 'User deleted' });
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  // Client CRUD
  const saveClient = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...clientForm, id: editingId } : clientForm;

      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save client');
      }

      toast({ title: 'Success', description: 'Client saved successfully' });
      setShowClientDialog(false);
      setEditingId(null);
      setClientForm({});
      loadClients();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save client', variant: 'destructive' });
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Yakin ingin menghapus client ini?')) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete client');
      }
      
      toast({ title: 'Success', description: 'Client deleted' });
      loadClients();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete client', variant: 'destructive' });
    }
  };

  // RAB CRUD
  const loadRABItems = async (projectId: string) => {
    try {
      const res = await fetch(`/api/rab?projectId=${projectId}`, { credentials: 'include' });
      const data = await res.json();
      setRabItems(data.rabItems || []);
    } catch (error) {
      console.error('Load RAB error:', error);
    }
  };

  const saveRABItem = async () => {
    try {
      let itemId = rabForm.itemId;
      
      // If custom item mode, create the item first
      if (itemId === '__custom__') {
        if (!rabForm.itemName || !rabForm.unitPrice) {
          toast({ title: 'Error', description: 'Nama item dan harga wajib diisi', variant: 'destructive' });
          return;
        }
        
        // Create new master item
        const itemRes = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `ITEM-${Date.now().toString().slice(-6)}`,
            name: rabForm.itemName,
            category: rabForm.category || 'Civil',
            unit: rabForm.itemUnit || 'Pcs',
            price: parseFloat(rabForm.unitPrice) || 0,
          }),
          credentials: 'include',
        });
        
        if (!itemRes.ok) throw new Error('Failed to create item');
        
        const itemData = await itemRes.json();
        itemId = itemData.item.id;
        
        // Refresh items list
        loadItems();
      }
      
      // Create RAB item
      const res = await fetch('/api/rab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rabForm,
          itemId,
          totalPrice: (rabForm.quantity || 0) * (rabForm.unitPrice || 0),
        }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save RAB item');

      toast({ title: 'Success', description: 'RAB item berhasil ditambahkan' });
      setShowRABDialog(false);
      setRabForm({});
      if (rabForm.projectId) {
        loadRABItems(rabForm.projectId);
        loadProjects(); // Refresh to update totals
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save RAB item', variant: 'destructive' });
    }
  };

  const deleteRABItem = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item RAB ini?')) return;

    try {
      await fetch('/api/rab', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      toast({ title: 'Success', description: 'RAB item deleted' });
      if (selectedProject && selectedProject !== 'all') {
        loadRABItems(selectedProject);
        loadProjects();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete RAB item', variant: 'destructive' });
    }
  };

  // Handle RAB item field change (inline editing)
  const handleRABItemChange = (itemId: string, field: string, value: any) => {
    setEditedRabItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Save all RAB changes and redirect to project form
  const saveAllRABChanges = async () => {
    if (Object.keys(editedRabItems).length === 0) {
      toast({ title: 'Info', description: 'Tidak ada perubahan untuk disimpan' });
      return;
    }

    try {
      const promises = Object.entries(editedRabItems).map(([itemId, changes]) => 
        fetch('/api/rab', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId, ...changes }),
          credentials: 'include',
        })
      );

      await Promise.all(promises);
      
      toast({ title: 'Success', description: 'Semua perubahan RAB berhasil disimpan' });
      setEditedRabItems({});
      setHasUnsavedChanges(false);
      
      // Refresh RAB items
      if (selectedProject && selectedProject !== 'all') {
        loadRABItems(selectedProject);
        loadProjects();
      }
      
      // Redirect to project form
      setActiveMenu('projects');
      setEditingId(selectedProject !== 'all' ? selectedProject : null);
      if (selectedProject !== 'all') {
        const project = projects.find(p => p.id === selectedProject);
        if (project) {
          setProjectForm({
            ...project,
            clientId: project.clientId,
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
          });
          setShowProjectDialog(true);
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save RAB changes', variant: 'destructive' });
    }
  };

  // Get current value for RAB item field (edited or original)
  const getRABItemValue = (item: any, field: string) => {
    if (editedRabItems[item.id] && editedRabItems[item.id][field] !== undefined) {
      return editedRabItems[item.id][field];
    }
    return item[field];
  };

  // Project CRUD
  const saveProject = async () => {
    // Check if in visitor mode
    if (isVisitor) {
      toast({ title: 'Error', description: 'Visitor tidak dapat menyimpan data. Silakan login terlebih dahulu.', variant: 'destructive' });
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast({ title: 'Error', description: 'Silakan login terlebih dahulu untuk menyimpan project.', variant: 'destructive' });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      
      // For new projects, exclude code field so it gets auto-generated
      // For existing projects, include all fields including the existing code
      let body;
      if (editingId) {
        body = { ...projectForm, id: editingId };
      } else {
        // Remove code field for new projects to trigger auto-generation
        const { code, ...newProjectData } = projectForm;
        body = newProjectData;
      }
      
      console.log('Saving project:', JSON.stringify(body, null, 2));
      
      const res = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      const responseData = await res.json();
      console.log('Response:', res.status, responseData);
      
      if (!res.ok) {
        // Show both error and details for debugging
        const errorMsg = responseData.details 
          ? `${responseData.error} (${responseData.details})`
          : responseData.error || 'Failed to save project';
        throw new Error(errorMsg);
      }
      
      toast({ title: 'Success', description: editingId ? 'Project berhasil diupdate' : `Project berhasil dibuat dengan kode: ${responseData.project?.code}` });
      setShowProjectDialog(false);
      setEditingId(null);
      setProjectForm({});
      loadProjects();
      loadDashboard();
    } catch (error: any) {
      console.error('Save project error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save project', variant: 'destructive' });
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Yakin ingin menghapus proyek ini?')) return;
    
    try {
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      toast({ title: 'Success', description: 'Project deleted' });
      loadProjects();
      loadDashboard();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  // Transaction CRUD
  const saveTransaction = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...transactionForm, id: editingId } : transactionForm;
      
      const res = await fetch('/api/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to save transaction');
      
      toast({ title: 'Success', description: 'Transaction saved successfully' });
      setShowTransactionDialog(false);
      setEditingId(null);
      setTransactionForm({});
      loadTransactions();
      loadDashboard();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save transaction', variant: 'destructive' });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    try {
      await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      toast({ title: 'Success', description: 'Transaction deleted' });
      loadTransactions();
      loadDashboard();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'destructive' });
    }
  };

  // Item CRUD
  const saveItem = async () => {
    try {
      // Validate required fields before sending
      if (!itemForm.name || !itemForm.name.trim()) {
        toast({ title: 'Error', description: 'Nama item wajib diisi', variant: 'destructive' });
        return;
      }
      if (!itemForm.category) {
        toast({ title: 'Error', description: 'Kategori wajib dipilih', variant: 'destructive' });
        return;
      }
      if (!itemForm.unit || !itemForm.unit.trim()) {
        toast({ title: 'Error', description: 'Satuan wajib diisi', variant: 'destructive' });
        return;
      }
      if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
        toast({ title: 'Error', description: 'Harga wajib diisi dengan nilai yang valid', variant: 'destructive' });
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...itemForm, id: editingId } : itemForm;
      
      const res = await fetch('/api/items', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save item');
      }
      
      toast({ title: 'Success', description: data.message || 'Item saved successfully' });
      setShowItemDialog(false);
      setEditingId(null);
      setItemForm({});
      loadItems(itemSearch, itemCategoryFilter);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save item', variant: 'destructive' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    
    try {
      const res = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      const data = await res.json();
      toast({ title: 'Success', description: data.message || 'Item deleted' });
      loadItems(itemSearch, itemCategoryFilter);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  // Progress update
  const updateProgress = async () => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressForm),
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to update progress');
      
      toast({ title: 'Success', description: 'Progress updated successfully' });
      setShowProgressDialog(false);
      setProgressForm({});
      loadProjects();
      loadDashboard();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update progress', variant: 'destructive' });
    }
  };

  // Print functions
  const printTransactions = () => {
    const printContent = document.getElementById('print-transactions');
    if (!printContent) return;
    
    // Logo size - auto adjusted
    const logoSize = 80;
    const logoSrc = company?.logo || '/logo.png';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Keuangan - ${company?.name || 'Project Dashboard'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; padding: 0; color: #000; font-size: 11px; line-height: 1.4; }
            
            /* Letterhead Design */
            .letterhead { 
              display: flex; 
              align-items: center; 
              padding: 12px 0; 
              border-bottom: 3px double #000; 
              margin-bottom: 20px; 
            }
            .letterhead-logo { 
              width: ${logoSize}px; 
              height: ${logoSize}px; 
              margin-right: 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              flex-shrink: 0;
            }
            .letterhead-logo img { 
              max-width: 100%; 
              max-height: 100%; 
              width: auto;
              height: auto;
              object-fit: contain; 
            }
            .letterhead-info { 
              flex: 1; 
              text-align: center;
            }
            .letterhead-info h1 { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 0 0 3px 0; 
              letter-spacing: 0.5px;
            }
            .letterhead-info .address { 
              font-size: 10px; 
              margin: 2px 0; 
              color: #333;
            }
            .letterhead-info .contact { 
              font-size: 10px; 
              margin: 2px 0; 
              color: #333;
              display: flex;
              justify-content: center;
              gap: 15px;
            }
            .letterhead-info .contact span {
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }
            .icon-email:before { content: "\\2709"; font-size: 12px; }
            .icon-phone:before { content: "\\260E"; font-size: 12px; }
            
            /* Document Title */
            .doc-header { 
              text-align: center; 
              margin: 20px 0 25px 0; 
            }
            .doc-header h2 { 
              font-size: 16px; 
              font-weight: bold; 
              text-decoration: underline; 
              margin: 0 0 5px 0;
            }
            .doc-header p { 
              font-size: 11px; 
              color: #555; 
            }
            
            /* Table Styling */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 10px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              text-align: center;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .income { color: green; }
            .expense { color: red; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            
            /* Footer */
            .doc-footer {
              margin-top: 30px;
              text-align: right;
              font-size: 10px;
            }
            .signature-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 50px;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-box p { margin: 0; }
            .signature-line {
              border-bottom: 1px solid #000;
              margin: 60px 0 5px 0;
            }
            
            @media print { 
              body { margin: 0; padding: 0; } 
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-logo">
              <img src="${logoSrc}" alt="Logo" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" />
            </div>
            <div class="letterhead-info">
              <h1>${company?.name || 'PT. Konstruksi Nusantara'}</h1>
              <p class="address">${company?.address || 'Alamat Perusahaan'}</p>
              <p class="contact">
                ${company?.email ? `<span><span class="icon-email"></span> ${company.email}</span>` : ''}
                ${company?.phone ? `<span><span class="icon-phone"></span> ${company.phone}</span>` : ''}
              </p>
            </div>
          </div>
          
          <div class="doc-header">
            <h2>LAPORAN TRANSAKSI KEUANGAN</h2>
            <p>Periode: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          ${printContent.innerHTML}
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Mengetahui,</p>
              <div class="signature-line"></div>
              <p><strong>Manager Keuangan</strong></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printRAB = (project: Project) => {
    // Get RAB items from project or fetch from rabItems state
    const projectRabItems = project.rabItems || rabItems.filter(item => item.projectId === project.id);
    
    if (!projectRabItems || projectRabItems.length === 0) {
      toast({ 
        title: 'Error', 
        description: 'Tidak ada item RAB untuk dicetak. Pastikan project memiliki item RAB.', 
        variant: 'destructive' 
      });
      return;
    }
    
    const total = projectRabItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Logo size - auto adjusted
    const logoSize = 80;
    const logoSrc = company?.logo || '/logo.png';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: 'Error', 
        description: 'Popup blocker mencegah membuka jendela cetak. Silakan izinkan popup untuk situs ini.', 
        variant: 'destructive' 
      });
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>RAB - ${project.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; padding: 0; color: #000; font-size: 11px; line-height: 1.4; }
            
            /* Letterhead Design */
            .letterhead { 
              display: flex; 
              align-items: center; 
              padding: 12px 0; 
              border-bottom: 3px double #000; 
              margin-bottom: 20px; 
            }
            .letterhead-logo { 
              width: ${logoSize}px; 
              height: ${logoSize}px; 
              margin-right: 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              flex-shrink: 0;
            }
            .letterhead-logo img { 
              max-width: 100%; 
              max-height: 100%; 
              width: auto;
              height: auto;
              object-fit: contain; 
            }
            .letterhead-info { 
              flex: 1; 
              text-align: center;
            }
            .letterhead-info h1 { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 0 0 3px 0; 
              letter-spacing: 0.5px;
            }
            .letterhead-info .address { 
              font-size: 10px; 
              margin: 2px 0; 
              color: #333;
            }
            .letterhead-info .contact { 
              font-size: 10px; 
              margin: 2px 0; 
              color: #333;
              display: flex;
              justify-content: center;
              gap: 15px;
            }
            .letterhead-info .contact span {
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }
            .icon-email:before { content: "\\2709"; font-size: 12px; }
            .icon-phone:before { content: "\\260E"; font-size: 12px; }
            
            /* Document Title */
            .doc-header { 
              text-align: center; 
              margin: 20px 0 25px 0; 
            }
            .doc-header h2 { 
              font-size: 16px; 
              font-weight: bold; 
              text-decoration: underline; 
              margin: 0 0 5px 0;
            }
            .doc-header p { 
              font-size: 11px; 
              color: #555; 
            }
            
            /* Project Info */
            .project-info { 
              margin: 15px 0 20px 0; 
              padding: 12px; 
              border: 1px solid #ccc; 
              border-radius: 5px;
              background-color: #fafafa;
            }
            .project-info-row {
              display: flex;
              margin: 3px 0;
            }
            .project-info-label {
              width: 120px;
              font-weight: bold;
              font-size: 10px;
            }
            .project-info-value {
              flex: 1;
              font-size: 10px;
            }
            
            /* Table Styling */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 10px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              text-align: center;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background-color: #e8e8e8; }
            
            /* Category grouping */
            .category-header {
              background-color: #e0e0e0 !important;
              font-weight: bold;
            }
            
            /* Footer */
            .doc-footer {
              margin-top: 30px;
              text-align: right;
              font-size: 10px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .signature-box {
              text-align: center;
              width: 180px;
            }
            .signature-box p { margin: 0; font-size: 10px; }
            .signature-line {
              border-bottom: 1px solid #000;
              margin: 50px 0 5px 0;
            }
            
            /* Notes */
            .notes-section {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 5px;
              font-size: 10px;
            }
            .notes-section h4 {
              font-size: 11px;
              margin-bottom: 5px;
            }
            
            @media print { 
              body { margin: 0; padding: 0; } 
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-logo">
              <img src="${logoSrc}" alt="Logo" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" />
            </div>
            <div class="letterhead-info">
              <h1>${company?.name || 'PT. Konstruksi Nusantara'}</h1>
              <p class="address">${company?.address || 'Alamat Perusahaan'}</p>
              <p class="contact">
                ${company?.email ? `<span><span class="icon-email"></span> ${company.email}</span>` : ''}
                ${company?.phone ? `<span><span class="icon-phone"></span> ${company.phone}</span>` : ''}
              </p>
            </div>
          </div>
          
          <div class="doc-header">
            <h2>RENCANA ANGGARAN BIAYA (RAB)</h2>
            <p>Dokumen Perencanaan Anggaran Proyek</p>
          </div>
          
          <div class="project-info">
            <div class="project-info-row">
              <span class="project-info-label">Nama Proyek</span>
              <span class="project-info-value">: ${project.name}</span>
            </div>
            <div class="project-info-row">
              <span class="project-info-label">Kode Proyek</span>
              <span class="project-info-value">: ${project.code}</span>
            </div>
            <div class="project-info-row">
              <span class="project-info-label">Klien</span>
              <span class="project-info-value">: ${project.client?.name || '-'}</span>
            </div>
            <div class="project-info-row">
              <span class="project-info-label">Nilai Kontrak</span>
              <span class="project-info-value">: ${formatCurrency(project.contractValue)}</span>
            </div>
            <div class="project-info-row">
              <span class="project-info-label">Tanggal</span>
              <span class="project-info-value">: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th style="width: 80px;">Kategori</th>
                <th>Nama Item Pekerjaan</th>
                <th style="width: 120px;">Deskripsi</th>
                <th style="width: 40px;">Qty</th>
                <th style="width: 45px;">Satuan</th>
                <th style="width: 90px;">Harga Satuan</th>
                <th style="width: 100px;">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              ${projectRabItems.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>${item.category}</td>
                  <td>${item.item?.name || '-'}</td>
                  <td>${item.description || '-'}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.item?.unit || '-'}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.totalPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="7" class="text-right" style="padding-right: 10px;"><strong>TOTAL ANGGARAN</strong></td>
                <td class="text-right"><strong>${formatCurrency(total)}</strong></td>
              </tr>
            </tfoot>
          </table>
          
          <div class="notes-section">
            <h4>Catatan:</h4>
            <p>• Harga belum termasuk PPN sesuai ketentuan yang berlaku</p>
            <p>• RAB ini merupakan estimasi dan dapat berubah sesuai kondisi lapangan</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Dibuat oleh,</p>
              <div class="signature-line"></div>
              <p><strong>Estimator</strong></p>
            </div>
            <div class="signature-box">
              <p>Mengetahui,</p>
              <div class="signature-line"></div>
              <p><strong>Project Manager</strong></p>
            </div>
            <div class="signature-box">
              <p>Menyetujui,</p>
              <div class="signature-line"></div>
              <p><strong>${project.client?.name || 'Klien'}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Journal functions
  const loadJournalData = async () => {
    try {
      let url = '/api/transactions?source=Project&';
      if (journalProject && journalProject !== 'all') {
        url += `projectId=${journalProject}&`;
      }
      if (journalStartDate) {
        url += `startDate=${journalStartDate}&`;
      }
      if (journalEndDate) {
        url += `endDate=${journalEndDate}&`;
      }
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      
      // Sort transactions by date
      const sortedTransactions = (data.transactions || []).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = sortedTransactions.map((tx: any) => {
        if (tx.type === 'Income') {
          runningBalance += tx.amount;
        } else {
          runningBalance -= tx.amount;
        }
        return { ...tx, runningBalance };
      });
      
      setJournalEntries(entriesWithBalance);
      
      // Calculate summary
      const totalDebit = sortedTransactions
        .filter((tx: any) => tx.type === 'Income')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const totalCredit = sortedTransactions
        .filter((tx: any) => tx.type === 'Expense')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      
      setJournalSummary({
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        transactionCount: sortedTransactions.length
      });
    } catch (error) {
      console.error('Load journal error:', error);
    }
  };

  // Internal Journal functions
  const loadInternalData = async () => {
    try {
      let url = '/api/transactions?source=Internal&';
      if (journalStartDate) {
        url += `startDate=${journalStartDate}&`;
      }
      if (journalEndDate) {
        url += `endDate=${journalEndDate}&`;
      }
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      
      // Sort transactions by date
      const sortedTransactions = (data.transactions || []).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = sortedTransactions.map((tx: any) => {
        if (tx.type === 'Income') {
          runningBalance += tx.amount;
        } else {
          runningBalance -= tx.amount;
        }
        return { ...tx, runningBalance };
      });
      
      setInternalEntries(entriesWithBalance);
      
      // Calculate summary
      const totalDebit = sortedTransactions
        .filter((tx: any) => tx.type === 'Income')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const totalCredit = sortedTransactions
        .filter((tx: any) => tx.type === 'Expense')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      
      setInternalSummary({
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        transactionCount: sortedTransactions.length
      });
    } catch (error) {
      console.error('Load internal journal error:', error);
    }
  };

  const saveInternalTransaction = async () => {
    try {
      if (!internalForm.type || !internalForm.description || !internalForm.amount || !internalForm.date) {
        toast({ title: 'Error', description: 'Data tidak lengkap', variant: 'destructive' });
        return;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...internalForm,
          source: 'Internal',
          projectId: null,
        }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: 'Success', description: 'Transaksi internal berhasil disimpan' });
      setShowInternalDialog(false);
      setInternalForm({});
      loadInternalData();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan transaksi', variant: 'destructive' });
    }
  };

  const getProjectSummary = () => {
    const summaryMap = new Map<string, {
      projectId: string;
      projectName: string;
      totalDebit: number;
      totalCredit: number;
      balance: number;
      transactionCount: number;
    }>();
    
    journalEntries.forEach((entry) => {
      const projectId = entry.projectId;
      const projectName = entry.project?.name || 'Unknown';
      
      if (!summaryMap.has(projectId)) {
        summaryMap.set(projectId, {
          projectId,
          projectName,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          transactionCount: 0
        });
      }
      
      const summary = summaryMap.get(projectId)!;
      if (entry.type === 'Income') {
        summary.totalDebit += entry.amount;
      } else {
        summary.totalCredit += entry.amount;
      }
      summary.balance = summary.totalDebit - summary.totalCredit;
      summary.transactionCount++;
    });
    
    return Array.from(summaryMap.values());
  };

  const printJournal = () => {
    const printContent = document.getElementById('print-journal');
    if (!printContent) return;
    
    // Logo size - auto adjusted
    const logoSize = 80;
    const logoSrc = company?.logo || '/logo.png';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Jurnal / Buku Besar - ${company?.name || 'Project Dashboard'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; padding: 0; color: #000; font-size: 10px; line-height: 1.3; }
            
            .letterhead { 
              display: flex; 
              align-items: center; 
              padding: 10px 0; 
              border-bottom: 3px double #000; 
              margin-bottom: 15px; 
            }
            .letterhead-logo { 
              width: ${logoSize}px; 
              height: ${logoSize}px; 
              margin-right: 15px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              flex-shrink: 0; 
            }
            .letterhead-logo img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
            .letterhead-info { 
              flex: 1; 
              text-align: center;
            }
            .letterhead-info h1 { font-size: 16px; font-weight: bold; margin: 0 0 2px 0; }
            .letterhead-info .address { font-size: 9px; margin: 1px 0; color: #333; }
            .letterhead-info .contact { 
              font-size: 9px; 
              margin: 2px 0; 
              color: #333;
              display: flex;
              justify-content: center;
              gap: 15px;
            }
            .letterhead-info .contact span {
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }
            .icon-email:before { content: "\\2709"; font-size: 11px; }
            .icon-phone:before { content: "\\260E"; font-size: 11px; }
            
            .doc-header { text-align: center; margin: 15px 0 20px 0; }
            .doc-header h2 { font-size: 14px; font-weight: bold; text-decoration: underline; margin: 0 0 3px 0; }
            .doc-header p { font-size: 10px; color: #555; }
            
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th, td { border: 1px solid #000; padding: 5px 4px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background-color: #e8e8e8; }
            
            .summary-box { margin-top: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
            .summary-row { display: flex; justify-content: space-between; margin: 3px 0; }
            
            .signature-section { display: flex; justify-content: flex-end; margin-top: 40px; }
            .signature-box { text-align: center; width: 180px; }
            .signature-box p { margin: 0; font-size: 10px; }
            .signature-line { border-bottom: 1px solid #000; margin: 40px 0 5px 0; }
            
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-logo">
              <img src="${logoSrc}" alt="Logo" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" />
            </div>
            <div class="letterhead-info">
              <h1>${company?.name || 'PT. Konstruksi Nusantara'}</h1>
              <p class="address">${company?.address || 'Alamat Perusahaan'}</p>
              <p class="contact">
                ${company?.email ? `<span><span class="icon-email"></span> ${company.email}</span>` : ''}
                ${company?.phone ? `<span><span class="icon-phone"></span> ${company.phone}</span>` : ''}
              </p>
            </div>
          </div>
          
          <div class="doc-header">
            <h2>JURNAL / BUKU BESAR</h2>
            <p>
              ${journalProject === 'all' ? 'Semua Project' : projects.find(p => p.id === journalProject)?.name || 'Pilih Project'}
              ${journalStartDate && journalEndDate ? ` | Periode: ${new Date(journalStartDate).toLocaleDateString('id-ID')} - ${new Date(journalEndDate).toLocaleDateString('id-ID')}` : ''}
            </p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th style="width: 70px;">Tanggal</th>
                <th style="width: 80px;">Kode</th>
                <th>Keterangan</th>
                <th style="width: 100px;">Project</th>
                <th style="width: 70px;">Kategori</th>
                <th style="width: 90px;">Debit</th>
                <th style="width: 90px;">Kredit</th>
                <th style="width: 90px;">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${journalEntries.map((entry, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>${new Date(entry.date).toLocaleDateString('id-ID')}</td>
                  <td>${entry.code || `TRX-${entry.id.slice(-6).toUpperCase()}`}</td>
                  <td>${entry.description}</td>
                  <td>${entry.project?.name || '-'}</td>
                  <td>${entry.category}</td>
                  <td class="text-right">${entry.type === 'Income' ? formatCurrency(entry.amount) : '-'}</td>
                  <td class="text-right">${entry.type === 'Expense' ? formatCurrency(entry.amount) : '-'}</td>
                  <td class="text-right" style="color: ${entry.runningBalance >= 0 ? 'green' : 'red'}">${formatCurrency(entry.runningBalance)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6" class="text-right" style="padding-right: 8px;"><strong>TOTAL</strong></td>
                <td class="text-right"><strong>${formatCurrency(journalSummary.totalDebit)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(journalSummary.totalCredit)}</strong></td>
                <td class="text-right" style="color: ${journalSummary.balance >= 0 ? 'green' : 'red'}"><strong>${formatCurrency(journalSummary.balance)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Mengetahui,</p>
              <div class="signature-line"></div>
              <p><strong>Manager Keuangan</strong></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading Project Dashboard...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user && !isVisitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Welcome Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 flex items-center justify-center shadow-2xl shadow-cyan-500/10">
                <img 
                  src={company?.logo || '/logo.png'} 
                  alt="Logo" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Selamat Datang Di
            </h1>
            <h2 className="text-4xl font-bold neon-text-cyan mb-3">
              Project Dashboard
            </h2>
            <p className="text-slate-400 text-sm">{company?.name || 'PT. Konstruksi Nusantara'}</p>
          </div>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Login</CardTitle>
              <CardDescription>Masuk ke sistem ERP</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={login} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    className="input-neon"
                    placeholder="email@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    className="input-neon"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                
                {loginError && (
                  <Alert className="bg-red-500/20 border-red-500/50 text-red-400">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full btn-neon">
                  Masuk
                </Button>
              </form>
              
              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                  © 2026 Dashboard Project Development By.Edho
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Top Navigation Bar with Icons - Sticky Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-4 z-50">
        {/* Left: Logo & Company */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden p-1">
              <img 
                src={company?.logo || '/logo.png'} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Project Dashboard</h1>
              <p className="text-xs text-slate-500">{company?.name || 'PT. Konstruksi Nusantara'}</p>
            </div>
          </div>
        </div>
        
        {/* Center: Menu Icons */}
        <nav className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'cyan' },
            { id: 'clients', icon: Users, label: 'Clients', color: 'blue' },
            { id: 'projects', icon: FolderKanban, label: 'Projects', color: 'purple' },
            { id: 'rab', icon: FileText, label: 'RAB', color: 'amber' },
            { id: 'accounting', icon: Calculator, label: 'Accounting', color: 'green' },
            { id: 'journal', icon: ArrowRightLeft, label: 'Jurnal', color: 'emerald' },
            { id: 'items', icon: Package, label: 'Items', color: 'pink' },
            { id: 'assets', icon: Building2, label: 'Data Aset', color: 'blue' },
            { id: 'settings', icon: Settings, label: 'Settings', color: 'slate', adminOnly: true },
          ].filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`relative p-3 rounded-lg transition-all duration-200 group ${
                activeMenu === item.id 
                  ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                  : 'hover:bg-slate-700/50'
              }`}
              title={item.label}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                activeMenu === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
              }`} />
              {/* Tooltip */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        
        {/* Right: User Profile with Time/Date */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setRefreshing(true);
              await loadInitialData();
              if (selectedProject && selectedProject !== 'all') {
                await loadRABItems(selectedProject);
              }
              if (activeMenu === 'assets') {
                await loadAssets();
              }
              if (activeMenu === 'journal') {
                await loadJournalData();
              }
              setTimeout(() => setRefreshing(false), 500);
              toast({ title: 'Success', description: 'Data berhasil di-refresh' });
            }}
            className={`text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
            disabled={refreshing}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          
          {/* Chat Button */}
          {!isVisitor && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className={`relative text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 ${showChat ? 'bg-cyan-500/20 text-cyan-400' : ''}`}
              title="Chat"
            >
              <MessageCircle className="w-5 h-5" />
              {chatMessages.filter(m => !m.isRead && m.userId !== user?.id).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {chatMessages.filter(m => !m.isRead && m.userId !== user?.id).length}
                </span>
              )}
            </Button>
          )}
          
          {isVisitor && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
              <Users className="w-3 h-3 mr-1" />
              VISITOR
            </Badge>
          )}
          
          {/* User Profile with Avatar and Time/Date */}
          <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {isVisitor ? 'V' : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{isVisitor ? 'Visitor' : user?.name}</span>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setIsVisitor(false); logout(); }} 
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 📊 LIVE Report Marquee */}
      <div className="fixed top-16 left-0 right-0 h-8 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-40">
        <div className="flex items-center h-full px-4">
          {/* Label */}
          <div className="flex items-center gap-2 px-3 bg-gradient-to-r from-cyan-600/30 to-green-600/30 h-6 rounded border border-cyan-500/30 shrink-0">
            <span className="text-sm">📊</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-bold text-green-400">LIVE Report Project</span>
          </div>
          
          {/* Marquee Content */}
          <div className="flex-1 overflow-hidden ml-4">
            {projectStats && projectStats.length > 0 ? (
              <div className="animate-marquee whitespace-nowrap flex items-center">
                {[...projectStats, ...projectStats].map((project, idx) => {
                  const profit = project.income - project.expense;
                  const isProfit = profit >= 0;
                  const profitPercent = project.budget > 0 ? ((profit / project.budget) * 100) : 0;
                  
                  return (
                    <span key={`${project.id}-${idx}`} className="inline-flex items-center gap-2 mx-4 text-xs">
                      <span className="font-medium text-slate-200">{project.name}</span>
                      <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(profit)}
                      </span>
                      <span className={`${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(1)}%
                      </span>
                      <span className="text-slate-600">|</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Belum ada data project</span>
            )}
          </div>
        </div>
      </div>

      {/* Project Selector - Below Marquee */}
      <div className="fixed top-24 left-0 right-0 h-12 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center px-6 gap-4 z-30">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-72 bg-slate-800 border-slate-700">
            <SelectValue placeholder="Pilih Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Project</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>•</span>
          <span>{projects.length} Projects</span>
          <span>•</span>
          <span>{projects.filter(p => p.status === 'InProgress').length} Active</span>
        </div>
        
        {/* Time and Date Display - Right Side */}
        <div className="ml-auto flex items-center gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-cyan-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Settings PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Akses Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Masukkan PIN untuk mengakses menu Settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">PIN Akses</Label>
              <Input
                type="password"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-neon text-center text-2xl tracking-widest"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && verifySettingsPin()}
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {pinError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowPinDialog(false); setPinInput(''); setPinError(''); }} className="flex-1">
                Batal
              </Button>
              <Button onClick={verifySettingsPin} className="flex-1 btn-neon">
                Masuk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={showChangePinDialog} onOpenChange={setShowChangePinDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Ubah PIN Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Masukkan PIN lama dan PIN baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">PIN Lama</Label>
              <Input
                type="password"
                placeholder="••••"
                value={changePinForm.currentPin}
                onChange={(e) => setChangePinForm({ ...changePinForm, currentPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="input-neon text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">PIN Baru</Label>
              <Input
                type="password"
                placeholder="••••"
                value={changePinForm.newPin}
                onChange={(e) => setChangePinForm({ ...changePinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="input-neon text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Konfirmasi PIN Baru</Label>
              <Input
                type="password"
                placeholder="••••"
                value={changePinForm.confirmPin}
                onChange={(e) => setChangePinForm({ ...changePinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="input-neon text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowChangePinDialog(false); setChangePinForm({ currentPin: '', newPin: '', confirmPin: '' }); }} className="flex-1">
                Batal
              </Button>
              <Button onClick={changeSettingsPin} className="flex-1 btn-neon">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Panel */}
      {showChat && !isVisitor && (
        <div className="fixed right-4 bottom-4 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Team Chat</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {onlineUsers.length} online
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Online Users */}
          <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/30">
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-full text-xs">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-300">{u.name}</span>
                  {u.id === user?.id && <span className="text-cyan-400">(you)</span>}
                </div>
              ))}
            </div>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Belum ada pesan</p>
                  <p className="text-xs">Mulai percakapan dengan tim</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.userId === user?.id ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.userId !== user?.id && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {msg.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`text-xs ${msg.userId === user?.id ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {msg.userId === user?.id ? 'You' : msg.user.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-3 py-2 rounded-lg ${
                        msg.userId === user?.id 
                          ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                          : 'bg-slate-700 text-white'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* Message Input */}
          <form onSubmit={sendChatMessage} className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                className="input-neon flex-1"
                placeholder="Ketik pesan..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={chatLoading}
              />
              <Button type="submit" className="btn-neon px-3" disabled={chatLoading || !newMessage.trim()}>
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area - with top margin for fixed header + marquee + project selector */}
      <main className="flex-1 flex flex-col overflow-hidden mt-36">
        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {/* Dashboard */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              {/* Project Filter Indicator */}
              {selectedProject && selectedProject !== 'all' && (
                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
                  <FolderKanban className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">Menampilkan data untuk project:</span>
                  <span className="font-medium text-cyan-400">
                    {projects.find(p => p.id === selectedProject)?.name || 'Unknown Project'}
                  </span>
                </div>
              )}
              
              {/* Top KPI Cards with Actual vs Plan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <Card className="glass-card">
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-slate-400">Total Revenue</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-white">{formatCurrency(dashboardStats?.totalContractValue || 0)}</p>
                        </div>
                        <p className="text-xs text-slate-500">Plan: {formatCurrency((dashboardStats?.totalContractValue || 0) * 1.3)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Actual vs Plan</span>
                        <span className="text-cyan-400 font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2 bg-slate-700 [&>div]:bg-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Cost Card */}
                <Card className="glass-card">
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-slate-400">Total Cost</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-white">{formatCurrency(dashboardStats?.totalExpense || 0)}</p>
                        </div>
                        <p className="text-xs text-slate-500">Plan: {formatCurrency(dashboardStats?.totalBudget || (dashboardStats?.totalExpense || 0) * 1.2)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Actual vs Plan</span>
                        <span className="text-amber-400 font-medium">81%</span>
                      </div>
                      <Progress value={81} className="h-2 bg-slate-700 [&>div]:bg-amber-400" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Margin Card */}
                <Card className="glass-card">
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-slate-400">Total Margin</p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-2xl font-bold ${(dashboardStats?.netProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(dashboardStats?.netProfit || 0)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">Plan: {formatCurrency(Math.abs(dashboardStats?.netProfit || 0) * 2)}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(dashboardStats?.netProfit || 0) >= 0 ? 'bg-pink-500/20' : 'bg-red-500/20'}`}>
                        {(dashboardStats?.netProfit || 0) >= 0 ? 
                          <TrendingUp className="w-5 h-5 text-pink-400" /> :
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        }
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Actual vs Plan</span>
                        <span className="text-pink-400 font-medium">43%</span>
                      </div>
                      <Progress value={43} className="h-2 bg-slate-700 [&>div]:bg-pink-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Profit/Loss Chart - Semua Project */}
              <Card className="glass-card overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
                  <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <div>
                          <h3 className="text-white font-bold text-lg">Project Profit/Loss Chart</h3>
                          <p className="text-xs text-slate-400">Semua Project - Real Time Financial Performance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">REAL-TIME</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-green-500"></span>
                        <span className="text-slate-400">Profit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-red-500"></span>
                        <span className="text-slate-400">Loss</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-0">
                  {(() => {
                    // Show ALL projects (not filtered)
                    const allProjects = projectStats;
                    
                    // Filter projects with finance data
                    const projectsWithFinance = allProjects.filter(p => 
                      p.income > 0 || p.expense > 0 || p.budget > 0
                    );
                    
                    // Calculate totals
                    const totalProfit = projectsWithFinance.filter(p => p.profit >= 0).reduce((sum, p) => sum + p.profit, 0);
                    const totalLoss = Math.abs(projectsWithFinance.filter(p => p.profit < 0).reduce((sum, p) => sum + p.profit, 0));
                    const netPL = totalProfit - totalLoss;
                    const maxAbsValue = Math.max(Math.abs(totalProfit), Math.abs(totalLoss), 1);
                    
                    return (
                      <>
                        {/* Summary Stats Bar */}
                        <div className="flex items-center gap-4 px-6 py-3 bg-slate-800/50 border-b border-slate-700/50 overflow-x-auto">
                          {/* Net P/L */}
                          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border shrink-0 ${
                            netPL >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                          }`}>
                            <span className="text-xs text-slate-400">Net P/L</span>
                            <span className={`text-lg font-bold font-mono ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {netPL >= 0 ? '+' : ''}{formatCurrency(netPL)}
                            </span>
                          </div>
                          
                          {/* Profit */}
                          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-green-500/30 bg-green-500/5 shrink-0">
                            <span className="text-xs text-slate-400">Profit</span>
                            <span className="text-lg font-bold text-green-400 font-mono">{formatCurrency(totalProfit)}</span>
                            <span className="text-xs text-green-400">▲ {projectsWithFinance.filter(p => p.profit >= 0).length}</span>
                          </div>
                          
                          {/* Loss */}
                          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 shrink-0">
                            <span className="text-xs text-slate-400">Loss</span>
                            <span className="text-lg font-bold text-red-400 font-mono">{formatCurrency(totalLoss)}</span>
                            <span className="text-xs text-red-400">▼ {projectsWithFinance.filter(p => p.profit < 0).length}</span>
                          </div>
                          
                          {/* Total Projects */}
                          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 shrink-0">
                            <span className="text-xs text-slate-400">Total Projects</span>
                            <span className="text-lg font-bold text-cyan-400 font-mono">{allProjects.length}</span>
                            <span className="text-xs text-cyan-400">
                              {projectsWithFinance.length > 0 ? ((projectsWithFinance.filter(p => p.profit >= 0).length / Math.max(1, projectsWithFinance.length)) * 100).toFixed(0) : 0}% Profit
                            </span>
                          </div>
                        </div>
                        
                        {/* Chart Pattern - All Projects */}
                        {allProjects.length > 0 ? (
                          <div className="p-6">
                            {/* Bar Chart Pattern */}
                            <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-slate-400">Profit Margin % - Semua Project</span>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    <span className="text-slate-400">Profit</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    <span className="text-slate-400">Loss</span>
                                  </span>
                                </div>
                              </div>
                              
                              {/* Chart Bars */}
                              <div className="space-y-3">
                                {allProjects.map((project, index) => {
                                  const isProfit = project.profit >= 0;
                                  const profitMarginPercent = project.budget > 0 
                                    ? ((project.profit / project.budget) * 100) 
                                    : project.income > 0 
                                      ? ((project.profit / project.income) * 100) 
                                      : 0;
                                  const barWidth = Math.min(100, Math.abs(profitMarginPercent));
                                  
                                  // Dynamic color based on margin
                                  const getBarColor = () => {
                                    if (profitMarginPercent >= 20) return 'from-green-500 to-emerald-400';
                                    if (profitMarginPercent >= 10) return 'from-green-600 to-green-400';
                                    if (profitMarginPercent >= 0) return 'from-green-700 to-green-500';
                                    if (profitMarginPercent >= -10) return 'from-red-700 to-red-500';
                                    if (profitMarginPercent >= -20) return 'from-red-600 to-red-400';
                                    return 'from-red-500 to-rose-400';
                                  };
                                  
                                  return (
                                    <div key={project.id} className="group hover:bg-slate-800/30 rounded-lg p-2 transition-all">
                                      <div className="flex items-center gap-3">
                                        {/* Project Name */}
                                        <div className="w-40 shrink-0">
                                          <span className="text-sm font-medium text-slate-200 truncate block" title={project.name}>
                                            {project.name}
                                          </span>
                                          <p className="text-[10px] text-slate-500 truncate">{project.code}</p>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="flex-1 relative">
                                          <div className="h-6 bg-slate-800 rounded-full overflow-hidden relative">
                                            {/* Background grid */}
                                            <div className="absolute inset-0 flex">
                                              {[0, 25, 50, 75].map(i => (
                                                <div key={i} className="flex-1 border-r border-slate-700/50"></div>
                                              ))}
                                            </div>
                                            {/* Bar */}
                                            <div 
                                              className={`absolute top-0 h-full bg-gradient-to-r ${getBarColor()} transition-all duration-500 rounded-full`}
                                              style={{ width: `${barWidth}%` }}
                                            >
                                              <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                                            </div>
                                            {/* Center line */}
                                            <div className="absolute left-1/2 top-0 w-px h-full bg-slate-600"></div>
                                          </div>
                                        </div>
                                        
                                        {/* Percentage & Value */}
                                        <div className="w-32 text-right shrink-0">
                                          <span className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                            {isProfit ? '+' : ''}{profitMarginPercent.toFixed(1)}%
                                          </span>
                                          <p className={`text-xs font-mono ${isProfit ? 'text-green-400/70' : 'text-red-400/70'}`}>
                                            {isProfit ? '+' : ''}{formatCurrency(project.profit)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Project Cards Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {allProjects.map((project) => {
                                const isProfit = project.profit >= 0;
                                const profitMarginPercent = project.budget > 0 
                                  ? ((project.profit / project.budget) * 100) 
                                  : project.income > 0 
                                    ? ((project.profit / project.income) * 100) 
                                    : 0;
                                
                                return (
                                  <div 
                                    key={project.id} 
                                    className={`relative overflow-hidden rounded-xl border transition-all hover:scale-[1.02] ${
                                      isProfit 
                                        ? 'bg-gradient-to-br from-green-500/5 to-emerald-500/10 border-green-500/30' 
                                        : 'bg-gradient-to-br from-red-500/5 to-rose-500/10 border-red-500/30'
                                    }`}
                                  >
                                    <div className="p-3">
                                      {/* Header */}
                                      <span className="text-xs font-bold text-white truncate block mb-2" title={project.name}>
                                        {project.name}
                                      </span>
                                      
                                      {/* Value */}
                                      <p className={`text-lg font-bold font-mono ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                        {isProfit ? '+' : ''}{formatCurrency(project.profit)}
                                      </p>
                                      
                                      {/* Profit Margin */}
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                                        <span className="text-[10px] text-slate-400">Profit Margin</span>
                                        <span className={`text-xs font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                          {isProfit ? '▲' : '▼'} {Math.abs(profitMarginPercent).toFixed(1)}%
                                        </span>
                                      </div>
                                      
                                      {/* Volume */}
                                      <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                        <span>In: {formatCurrency(project.income)}</span>
                                        <span>Out: {formatCurrency(project.expense)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-slate-500">
                            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <TrendingUp className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-lg font-medium mb-1">Belum ada data project</p>
                            <p className="text-sm">Chart akan ditampilkan ketika ada project tersedia</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Project Schedule Timeline - Lightweight */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        Project Schedule Timeline
                      </CardTitle>
                      <CardDescription className="text-slate-400">Monitor project progress vs schedule timeline</CardDescription>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-500"></span>
                        <span className="text-slate-400">On Track</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-amber-500"></span>
                        <span className="text-slate-400">Behind</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-500"></span>
                        <span className="text-slate-400">Overdue</span>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get all projects, sort by status priority
                    const allProjects = projectStats.sort((a, b) => {
                      const statusOrder: Record<string, number> = { InProgress: 1, Deal: 2, Completed: 3, Cancelled: 4 };
                      return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
                    });
                    
                    const today = new Date();
                    
                    return allProjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allProjects.map((project) => {
                          const startDate = project.startDate ? new Date(project.startDate) : null;
                          const endDate = project.endDate ? new Date(project.endDate) : null;
                          
                          // Calculate time progress
                          let timeProgress = 0;
                          let daysElapsed = 0;
                          let daysRemaining = 0;
                          let isOverdue = false;
                          let isBehind = false;
                          let isAhead = false;
                          
                          if (startDate && endDate) {
                            const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                            daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                            daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                            
                            if (today > endDate) {
                              timeProgress = 100;
                              isOverdue = project.progress < 100;
                            } else if (today < startDate) {
                              timeProgress = 0;
                            } else {
                              timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);
                            }
                          }
                          
                          const workProgress = project.progress || 0;
                          const progressDiff = workProgress - timeProgress;
                          isBehind = progressDiff < -10 && !isOverdue;
                          isAhead = progressDiff > 10 && !isOverdue;
                          
                          // Determine status color
                          const statusColor = isOverdue 
                            ? 'border-red-500/50 bg-red-500/5' 
                            : isBehind 
                              ? 'border-amber-500/50 bg-amber-500/5' 
                              : isAhead
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-slate-700 bg-slate-800/30';
                          
                          return (
                            <div key={project.id} className={`rounded-lg border p-4 transition-all hover:scale-[1.02] ${statusColor}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-white text-sm truncate" title={project.name}>
                                    {project.name}
                                  </h4>
                                  <p className="text-xs text-slate-500">{project.code}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOverdue && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                  {isAhead && !isOverdue && <TrendingUp className="w-4 h-4 text-green-400" />}
                                  {isBehind && !isOverdue && <Clock className="w-4 h-4 text-amber-400" />}
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-400">Progress</span>
                                  <span className="text-white font-medium">{workProgress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      isOverdue ? 'bg-red-500' : isBehind ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${workProgress}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Date Info */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-800/50 rounded px-2 py-1">
                                  <p className="text-slate-500">Start</p>
                                  <p className="text-cyan-400 font-medium">
                                    {startDate ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                  </p>
                                </div>
                                <div className="bg-slate-800/50 rounded px-2 py-1">
                                  <p className="text-slate-500">Finish</p>
                                  <p className={`${isOverdue ? 'text-red-400' : 'text-pink-400'} font-medium`}>
                                    {endDate ? endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Days Info */}
                              {(startDate && endDate) && (
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50 text-xs">
                                  <span className="text-slate-400">
                                    Elapsed: <span className="text-white font-medium">{daysElapsed}</span> days
                                  </span>
                                  <span className={isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}>
                                    {isOverdue ? 'Overdue!' : `Remaining: ${daysRemaining} days`}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-lg font-medium">Belum ada project</p>
                        <p className="text-sm">Tambah project untuk melihat timeline</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Project Progress Report Chart - Lightweight */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-purple-400" />
                        Project Progress Report
                      </CardTitle>
                      <CardDescription className="text-slate-400">Budget vs Progress Over Time</CardDescription>
                    </div>
                    <div className="flex gap-4">
                      {/* Budget KPI */}
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2">
                        <p className="text-xs text-slate-400">Budget</p>
                        <p className="text-xl font-bold text-red-400">{formatCurrency(dashboardStats?.totalBudget || dashboardStats?.totalContractValue || 0)}</p>
                      </div>
                      {/* Progress KPI */}
                      <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2">
                        <p className="text-xs text-slate-400">Progress</p>
                        <p className="text-xl font-bold text-white">{(dashboardStats?.totalProjects || 0) > 0 ? Math.round(projectStats.reduce((a, p) => a + p.progress, 0) / (dashboardStats?.totalProjects || 1)) : 0}%</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { progress: 15, budget: (dashboardStats?.totalBudget || 100) * 0.15, progressVal: 15 },
                        { progress: 30, budget: (dashboardStats?.totalBudget || 100) * 0.30, progressVal: 28 },
                        { progress: 45, budget: (dashboardStats?.totalBudget || 100) * 0.45, progressVal: 42 },
                        { progress: 60, budget: (dashboardStats?.totalBudget || 100) * 0.60, progressVal: 55 },
                        { progress: 75, budget: (dashboardStats?.totalBudget || 100) * 0.75, progressVal: 70 },
                        { progress: 100, budget: dashboardStats?.totalBudget || dashboardStats?.totalContractValue || 0, progressVal: (dashboardStats?.totalProjects || 0) > 0 ? Math.round(projectStats.reduce((a, p) => a + p.progress, 0) / (dashboardStats?.totalProjects || 1)) : 91 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="progress" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          formatter={(value: number, name: string) => [name === 'budget' ? formatCurrency(value) : `${value}%`, name === 'budget' ? 'Budget' : 'Progress']}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="budget" name="Budget" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="progressVal" name="Progress (%)" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Termin Pembayaran */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Progress Termin Pembayaran
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Persentase pembayaran diterima vs nilai RAB
                        {selectedProject !== 'all' && projects.find(p => p.id === selectedProject) && (
                          <span className="text-cyan-400 ml-1">
                            - {projects.find(p => p.id === selectedProject)?.name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Cards */}
                  {(() => {
                    // Filter projects based on selectedProject
                    const filteredProjects = selectedProject === 'all' 
                      ? projects 
                      : projects.filter(p => p.id === selectedProject);
                    
                    // Get projects with RAB data
                    const projectsWithRAB = filteredProjects.filter(p => {
                      const rabTotal = p.rabItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
                      return rabTotal > 0;
                    });
                    
                    // Calculate total RAB from filtered projects
                    const totalRAB = filteredProjects.reduce((sum, p) => 
                      sum + (p.rabItems?.reduce((s, item) => s + item.totalPrice, 0) || 0), 0);
                    
                    // Get all transactions from projects (for calculating progress payment)
                    const allProjectTransactions = filteredProjects.flatMap(p => 
                      (p.transactions || []).map(t => ({ ...t, projectId: p.id }))
                    );
                    
                    // Also include transactions from state (if loaded separately)
                    const stateTransactions = selectedProject === 'all' 
                      ? transactions 
                      : transactions.filter(t => t.projectId === selectedProject);
                    
                    // Combine and deduplicate transactions
                    const combinedTransactions = [...allProjectTransactions, ...stateTransactions];
                    const uniqueTransactions = combinedTransactions.filter((t, i, arr) => 
                      arr.findIndex(x => x.id === t.id) === i
                    );
                    
                    // Calculate total progress payment
                    const totalProgressPayment = uniqueTransactions
                      .filter(t => t.type === 'Income' && t.category === 'Progress Payment')
                      .reduce((sum, t) => sum + t.amount, 0);
                    
                    const overallPercentage = totalRAB > 0 ? (totalProgressPayment / totalRAB) * 100 : 0;
                    
                    // Determine color based on percentage
                    const getProgressColor = (pct: number) => {
                      if (pct >= 80) return 'from-green-500 to-emerald-400';
                      if (pct >= 50) return 'from-cyan-500 to-blue-400';
                      if (pct >= 25) return 'from-amber-500 to-yellow-400';
                      return 'from-red-500 to-orange-400';
                    };
                    
                    return (
                      <>
                        {/* Overall Summary */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Total Nilai RAB</p>
                            <p className="text-xl font-bold text-cyan-400">{formatCurrency(totalRAB)}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Total Pembayaran Diterima</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(totalProgressPayment)}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Sisa Tagihan</p>
                            <p className="text-xl font-bold text-amber-400">{formatCurrency(totalRAB - totalProgressPayment)}</p>
                          </div>
                        </div>
                        
                        {/* Overall Progress Bar */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-400">
                              {selectedProject === 'all' ? 'Progress Pembayaran Keseluruhan' : 'Progress Pembayaran Project'}
                            </span>
                            <span className="text-lg font-bold text-green-400">{overallPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${getProgressColor(overallPercentage)} transition-all duration-500 rounded-full`}
                              style={{ width: `${Math.min(100, overallPercentage)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Per Project Breakdown - only show when "all" is selected */}
                        {selectedProject === 'all' && (
                          <>
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Progress per Project</h4>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                              {projectsWithRAB.length > 0 ? projectsWithRAB.map((project) => {
                                const rabTotal = project.rabItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
                                
                                // Get progress payment from project's transactions
                                const progressPayment = (project.transactions || [])
                                  .filter(t => t.type === 'Income' && t.category === 'Progress Payment')
                                  .reduce((sum, t) => sum + t.amount, 0);
                                
                                const percentage = rabTotal > 0 ? (progressPayment / rabTotal) * 100 : 0;
                                const remaining = rabTotal - progressPayment;
                                
                                return (
                                  <div key={project.id} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm truncate">{project.name}</p>
                                        <p className="text-xs text-slate-500">{project.code}</p>
                                      </div>
                                      <div className="text-right ml-2">
                                        <p className={`text-sm font-bold ${percentage >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                                          {percentage.toFixed(1)}%
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                      <div 
                                        className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} transition-all duration-500 rounded-full`}
                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                      />
                                    </div>
                                    
                                    <div className="flex justify-between text-xs text-slate-400">
                                      <span>RAB: {formatCurrency(rabTotal)}</span>
                                      <span className="text-green-400">Terima: {formatCurrency(progressPayment)}</span>
                                      <span className="text-amber-400">Sisa: {formatCurrency(remaining)}</span>
                                    </div>
                                  </div>
                                );
                              }) : (
                                <div className="text-center py-8 text-slate-500">
                                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                  <p>Belum ada data RAB</p>
                                  <p className="text-xs">Tambahkan item RAB ke project untuk melihat progress pembayaran</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* Single project detail view */}
                        {selectedProject !== 'all' && projectsWithRAB.length === 1 && (
                          <div className="space-y-4">
                            {(() => {
                              const project = projectsWithRAB[0];
                              const rabTotal = project.rabItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
                              const progressPayment = (project.transactions || [])
                                .filter(t => t.type === 'Income' && t.category === 'Progress Payment')
                                .reduce((sum, t) => sum + t.amount, 0);
                              
                              // Get list of progress payments
                              const progressPayments = (project.transactions || [])
                                .filter(t => t.type === 'Income' && t.category === 'Progress Payment')
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                              
                              return (
                                <>
                                  {/* RAB Items Summary */}
                                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                    <h5 className="text-sm font-medium text-white mb-2">Detail RAB</h5>
                                    <div className="text-xs text-slate-400 space-y-1">
                                      <p>Total Item RAB: {project.rabItems?.length || 0} item</p>
                                      <p>Total Termin Diterima: {progressPayments.length} termin</p>
                                    </div>
                                  </div>
                                  
                                  {/* Payment History */}
                                  {progressPayments.length > 0 && (
                                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                      <h5 className="text-sm font-medium text-white mb-2">Riwayat Termin</h5>
                                      <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {progressPayments.map((t, idx) => (
                                          <div key={t.id} className="flex justify-between items-center text-xs border-b border-slate-700/50 pb-2">
                                            <div>
                                              <p className="text-white">Termin {progressPayments.length - idx}</p>
                                              <p className="text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-green-400 font-medium">{formatCurrency(t.amount)}</p>
                                              <p className="text-slate-500 truncate max-w-[150px]">{t.description}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* No RAB data for selected project */}
                        {selectedProject !== 'all' && projectsWithRAB.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Project ini belum memiliki RAB</p>
                            <p className="text-xs">Tambahkan item RAB ke project untuk melihat progress pembayaran</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Main Charts Row - Project Progress & Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Progress Horizontal Bar Chart */}
                <Card className="glass-card lg:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white text-lg">Total Planned vs Actual by Project</CardTitle>
                        <CardDescription className="text-slate-400">Hours comparison per project</CardDescription>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-cyan-400"></span>
                          <span className="text-slate-400">Actual</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-slate-500"></span>
                          <span className="text-slate-400">Planned</span>
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectStats.slice(0, 6).map((project) => {
                        const actualHours = Math.round((project.progress / 100) * 120);
                        const plannedHours = 120;
                        const billablePct = Math.round(80 + Math.random() * 15);
                        
                        return (
                          <div key={project.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-white w-36 truncate">{project.name}</span>
                              <div className="flex items-center gap-6 text-xs">
                                <span className="text-slate-400">{actualHours}h / {plannedHours}h</span>
                                <span className="text-cyan-400 font-medium">{billablePct}% billable</span>
                              </div>
                            </div>
                            <div className="flex gap-1 h-5">
                              {/* Actual Bar */}
                              <div 
                                className="bg-gradient-to-r from-cyan-500 to-cyan-400 rounded"
                                style={{ width: `${(actualHours / plannedHours) * 100}%` }}
                              />
                              {/* Planned remaining */}
                              <div 
                                className="bg-slate-600 rounded"
                                style={{ width: `${((plannedHours - actualHours) / plannedHours) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      
                      {projectStats.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No projects available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Tasks Next Up Table */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Main Tasks Next Up</CardTitle>
                  <CardDescription className="text-slate-400">Upcoming tasks and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">Project</TableHead>
                        <TableHead className="text-slate-400">Task ID</TableHead>
                        <TableHead className="text-slate-400">Risk</TableHead>
                        <TableHead className="text-slate-400">Planned Start</TableHead>
                        <TableHead className="text-slate-400">Planned End</TableHead>
                        <TableHead className="text-slate-400">Sisa Waktu</TableHead>
                        <TableHead className="text-slate-400">Responsible</TableHead>
                        <TableHead className="text-slate-400">Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectStats.slice(0, 5).map((project: any, idx: number) => {
                        // Calculate risk based on progress and time
                        const now = new Date();
                        const endDate = project.endDate ? new Date(project.endDate) : null;
                        const startDate = project.startDate ? new Date(project.startDate) : null;
                        
                        let risk = 'Planned';
                        let daysRemaining = 0;
                        
                        if (endDate) {
                          const diffTime = endDate.getTime() - now.getTime();
                          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (project.status === 'Completed') {
                            risk = 'Completed';
                          } else if (daysRemaining < 0) {
                            risk = 'Delayed';
                          } else if (daysRemaining <= 7 && project.progress < 80) {
                            risk = 'At Risk';
                          } else if (project.progress >= 80 || (daysRemaining > 7 && project.progress >= 50)) {
                            risk = 'On Track';
                          }
                        }
                        
                        const riskColors: Record<string, string> = {
                          'At Risk': 'bg-pink-500/20 text-pink-400',
                          'On Track': 'bg-blue-500/20 text-blue-400',
                          'Delayed': 'bg-amber-500/20 text-amber-400',
                          'Planned': 'bg-slate-500/20 text-slate-400',
                          'Completed': 'bg-green-500/20 text-green-400',
                        };
                        
                        // Format remaining time
                        const formatRemainingTime = (days: number) => {
                          if (days < 0) {
                            return `${Math.abs(days)} hari terlambat`;
                          } else if (days === 0) {
                            return 'Hari ini';
                          } else if (days < 7) {
                            return `${days} hari`;
                          } else if (days < 30) {
                            return `${Math.floor(days / 7)} minggu ${days % 7} hari`;
                          } else {
                            return `${Math.floor(days / 30)} bulan`;
                          }
                        };
                        
                        return (
                          <TableRow key={project.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="text-white font-medium">{project.name}</TableCell>
                            <TableCell className="text-cyan-400 font-mono text-sm">{project.code}</TableCell>
                            <TableCell>
                              <Badge className={riskColors[risk]}>{risk}</Badge>
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {startDate ? startDate.toLocaleDateString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {endDate ? endDate.toLocaleDateString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className={`text-sm ${daysRemaining < 0 ? 'text-red-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                              {endDate ? formatRemainingTime(daysRemaining) : '-'}
                            </TableCell>
                            <TableCell className="text-white">
                              {project.responsible ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold">
                                    {project.responsible.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{project.responsible}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={project.progress} className="h-2 w-16 bg-slate-700" />
                                <span className="text-xs text-slate-400">{project.progress}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Daily Chart & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Overview */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Daily Report - Last 30 Days</CardTitle>
                    <CardDescription className="text-slate-400">Income vs Expense harian</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} interval="preserveStartEnd" />
                          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}%`} domain={[80, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="expense" name="Expense" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="left" dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="left" type="monotone" dataKey="cumulativeProfit" name="Cumulative P/L" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-slate-400">Aktivitas terbaru admin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-56">
                      <div className="space-y-2">
                        {activityLogs.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Belum ada aktivitas</p>
                          </div>
                        ) : (
                          activityLogs.map((log, idx) => {
                            // Get action icon and color
                            const getActionStyle = (action: string, module: string) => {
                              // Auth actions (Login/Logout)
                              if (action.toLowerCase() === 'login') {
                                return { icon: LogIn, color: 'text-green-400', bg: 'bg-green-500/20' };
                              }
                              if (action.toLowerCase() === 'logout') {
                                return { icon: LogOut, color: 'text-amber-400', bg: 'bg-amber-500/20' };
                              }
                              // Backup & Restore actions
                              if (action.toLowerCase().includes('backup')) {
                                return { icon: Download, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
                              }
                              if (action.toLowerCase().includes('restore')) {
                                return { icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/20' };
                              }
                              if (action.toLowerCase().includes('hapus semua') || action.toLowerCase().includes('delete all')) {
                                return { icon: HardDrive, color: 'text-red-400', bg: 'bg-red-500/20' };
                              }
                              // CRUD actions
                              if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('hapus')) {
                                return { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/20' };
                              }
                              if (action.toLowerCase().includes('create') || action.toLowerCase().includes('tambah') || action.toLowerCase().includes('input')) {
                                return { icon: Plus, color: 'text-green-400', bg: 'bg-green-500/20' };
                              }
                              if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
                                return { icon: Edit, color: 'text-amber-400', bg: 'bg-amber-500/20' };
                              }
                              return { icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
                            };
                            
                            const style = getActionStyle(log.action, log.module);
                            const ActionIcon = style.icon;
                            
                            return (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                                <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                                  <ActionIcon className={`w-4 h-4 ${style.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {log.user?.name || 'System'}
                                    </span>
                                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                      {log.module}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-300">{log.details || log.action}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span>
                                      {new Date(log.createdAt).toLocaleDateString('id-ID', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        second: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Projects */}
          {activeMenu === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Projects</h2>
                <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
                  <DialogTrigger asChild>
                    <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setProjectForm({}); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingId ? 'Edit Project' : 'New Project'}</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {editingId ? 'Ubah data project yang sudah ada' : 'Tambahkan project baru ke sistem'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project Name</Label>
                          <Input className="input-neon" value={projectForm.name || ''} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Project Code</Label>
                          {editingId ? (
                            <Input className="input-neon bg-slate-800/50" value={projectForm.code || ''} readOnly disabled />
                          ) : (
                            <div className="space-y-1">
                              <Input 
                                className="input-neon bg-slate-800/50 text-slate-400" 
                                value="Auto-generated (PRJ-XXX)" 
                                readOnly 
                                disabled 
                              />
                              <p className="text-xs text-cyan-400">Kode akan di-generate otomatis saat menyimpan</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client</Label>
                          <Select value={projectForm.clientId || ''} onValueChange={(v) => setProjectForm({ ...projectForm, clientId: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue placeholder="Pilih Client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.filter(c => c.isActive).map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Penanggung Jawab / Responsible</Label>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              className="input-neon pl-10" 
                              placeholder="Nama penanggung jawab..." 
                              value={projectForm.responsible || ''} 
                              onChange={(e) => setProjectForm({ ...projectForm, responsible: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={projectForm.status || 'Negotiation'} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Negotiation">Negotiation</SelectItem>
                              <SelectItem value="Deal">Deal</SelectItem>
                              <SelectItem value="InProgress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Financial Fields - Only for Deal, InProgress, Completed */}
                      {['Deal', 'InProgress', 'Completed'].includes(projectForm.status) && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Contract Value</Label>
                              <Input type="number" className="input-neon" value={projectForm.contractValue || ''} onChange={(e) => setProjectForm({ ...projectForm, contractValue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Modal Kerja</Label>
                              <Input type="number" className="input-neon" value={projectForm.modalKerja || ''} onChange={(e) => setProjectForm({ ...projectForm, modalKerja: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-cyan-400" />
                                Start Date
                              </Label>
                              <Input 
                                type="date" 
                                className="input-neon" 
                                value={projectForm.startDate ? new Date(projectForm.startDate).toISOString().split('T')[0] : ''} 
                                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-pink-400" />
                                Finish Date
                              </Label>
                              <Input 
                                type="date" 
                                className="input-neon" 
                                value={projectForm.endDate ? new Date(projectForm.endDate).toISOString().split('T')[0] : ''} 
                                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                              />
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Progress - Only for InProgress */}
                      {projectForm.status === 'InProgress' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Progress (%)</Label>
                            <Input type="number" min="0" max="100" className="input-neon" value={projectForm.progress || 0} onChange={(e) => setProjectForm({ ...projectForm, progress: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowProjectDialog(false)}>Cancel</Button>
                      <Button className="btn-neon" onClick={saveProject}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">Project</TableHead>
                        <TableHead className="text-slate-400">Client</TableHead>
                        <TableHead className="text-slate-400">Responsible</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Schedule</TableHead>
                        <TableHead className="text-slate-400">Progress</TableHead>
                        <TableHead className="text-slate-400">Contract Value</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => {
                        const budget = project.rabItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
                        const expense = project.transactions?.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0) || 0;
                        const income = project.transactions?.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) || 0;
                        const profit = income - expense;
                        
                        // Calculate schedule status
                        const startDate = project.startDate ? new Date(project.startDate) : null;
                        const endDate = project.endDate ? new Date(project.endDate) : null;
                        const today = new Date();
                        let daysRemaining = 0;
                        let isOverdue = false;
                        
                        if (endDate) {
                          daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (daysRemaining < 0 && project.status !== 'Completed') {
                            isOverdue = true;
                          }
                        }
                        
                        return (
                          <TableRow key={project.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{project.name}</p>
                                <p className="text-xs text-slate-500">{project.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white">{project.client?.name || '-'}</p>
                                <p className="text-xs text-slate-500">{project.client?.contactPerson || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.responsible ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {project.responsible.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-white text-sm">{project.responsible}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <p className="text-slate-300">
                                  <span className="text-cyan-400">{startDate?.toLocaleDateString('id-ID') || '-'}</span>
                                  <span className="text-slate-500 mx-1">→</span>
                                  <span className={isOverdue ? 'text-red-400' : 'text-pink-400'}>{endDate?.toLocaleDateString('id-ID') || '-'}</span>
                                </p>
                                {endDate && project.status !== 'Completed' && (
                                  <p className={`mt-0.5 ${isOverdue ? 'text-red-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <Progress value={project.progress} className="h-2" />
                                <p className="text-xs text-slate-500 mt-1">{project.progress}%</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-white">{formatCurrency(project.contractValue)}</p>
                              <p className={`text-xs ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                P/L: {formatCurrency(profit)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(project.id); setProjectForm(project as any); setShowProjectDialog(true); }}>
                                  <Edit className="w-4 h-4 text-amber-400" />
                                </Button>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setProgressForm({ projectId: project.id, progress: project.progress }); setShowProgressDialog(true); }}>
                                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                                </Button>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => printRAB(project)}>
                                  <Printer className="w-4 h-4 text-slate-400" />
                                </Button>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteProject(project.id)}>
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clients */}
          {activeMenu === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Clients</h2>
                <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                  <DialogTrigger asChild>
                    <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setClientForm({ isActive: true }); }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      New Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingId ? 'Edit Client' : 'New Client'}</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {editingId ? 'Ubah data client yang sudah ada' : 'Tambahkan client baru ke sistem'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client Name *</Label>
                          <Input className="input-neon" value={clientForm.name || ''} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="Nama Perusahaan" />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Person *</Label>
                          <Input className="input-neon" value={clientForm.contactPerson || ''} onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })} placeholder="Nama Contact Person" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input className="input-neon" value={clientForm.phone || ''} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="Nomor Telepon" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" className="input-neon" value={clientForm.email || ''} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="Email" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input className="input-neon" value={clientForm.address || ''} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} placeholder="Alamat Lengkap" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea className="input-neon" value={clientForm.notes || ''} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} placeholder="Catatan tambahan..." rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowClientDialog(false)}>Cancel</Button>
                      <Button className="btn-neon" onClick={saveClient}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">Client</TableHead>
                        <TableHead className="text-slate-400">Contact</TableHead>
                        <TableHead className="text-slate-400">Phone</TableHead>
                        <TableHead className="text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-400">Projects</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{client.name}</p>
                              <p className="text-xs text-slate-500">{client.code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-white">{client.contactPerson}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-cyan-400">{client.phone}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-slate-300">{client.email || '-'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                              {client._count?.projects || 0} projects
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={client.isActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}>
                              {client.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(client.id); setClientForm(client as any); setShowClientDialog(true); }}>
                                <Edit className="w-4 h-4 text-amber-400" />
                              </Button>
                              <Button size="sm" variant="ghost" disabled={isVisitor || (client._count?.projects || 0) > 0} onClick={() => deleteClient(client.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RAB & Budget */}
          {activeMenu === 'rab' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">RAB & Budget Planning</h2>
                <div className="flex gap-2">
                  {/* Print RAB Button - only show when a single project is selected */}
                  {selectedProject && selectedProject !== 'all' && rabItems.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="border-slate-600"
                      disabled={isVisitor}
                      onClick={() => {
                        const project = projects.find(p => p.id === selectedProject);
                        if (project) printRAB(project);
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print RAB
                    </Button>
                  )}
                  <Dialog open={showRABDialog} onOpenChange={setShowRABDialog}>
                    <DialogTrigger asChild>
                      <Button className="btn-neon" disabled={isVisitor || !selectedProject || selectedProject === 'all'} onClick={() => { setEditingId(null); setRabForm({ projectId: selectedProject, quantity: 1, itemCategory: 'all' }); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add RAB Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-white">{editingId ? 'Edit' : 'Add'} RAB Item</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          {editingId ? 'Ubah item RAB yang sudah ada' : 'Tambahkan item RAB baru ke project'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project</Label>
                            <Select value={rabForm.projectId || ''} onValueChange={(v) => setRabForm({ ...rabForm, projectId: v })}>
                              <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Select Project" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Category Filter</Label>
                            <Select 
                              value={rabForm.itemCategory || 'all'} 
                              onValueChange={(v) => setRabForm({ ...rabForm, itemCategory: v, itemId: '', category: v === 'all' ? 'Civil' : v })}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Filter by Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">📋 Semua Kategori</SelectItem>
                                <SelectItem value="Civil">🏗️ Civil (CVL)</SelectItem>
                                <SelectItem value="MEP">⚡ MEP</SelectItem>
                                <SelectItem value="Interior">🎨 Interior (INT)</SelectItem>
                                <SelectItem value="General">📦 General (GEN)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Pilih Item</Label>
                          <Select 
                            value={rabForm.itemId || ''} 
                            onValueChange={(v) => {
                              if (v === '__custom__') {
                                setRabForm({ 
                                  ...rabForm, 
                                  itemId: '__custom__', 
                                  itemName: '', 
                                  unitPrice: 0, 
                                  category: rabForm.itemCategory !== 'all' ? rabForm.itemCategory : 'Civil' 
                                });
                              } else {
                                const selectedItem = items.find(i => i.id === v);
                                setRabForm({ 
                                  ...rabForm, 
                                  itemId: v, 
                                  itemName: selectedItem?.name, 
                                  unitPrice: selectedItem?.price || 0, 
                                  category: selectedItem?.category || 'Civil' 
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue placeholder={rabForm.itemCategory && rabForm.itemCategory !== 'all' 
                                ? `Pilih item ${rabForm.itemCategory}...` 
                                : "Pilih item atau input manual..."} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__custom__">✏️ Input Manual (Ketik Sendiri)</SelectItem>
                              {items
                                .filter(i => rabForm.itemCategory === 'all' || i.category === rabForm.itemCategory)
                                .map((i) => (
                                  <SelectItem key={i.id} value={i.id}>
                                    <span className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                        {i.code}
                                      </Badge>
                                      {i.name} 
                                      <span className="text-cyan-400 text-xs">{formatCurrency(i.price)}/{i.unit}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Item count info */}
                          <p className="text-xs text-slate-500">
                            {rabForm.itemCategory === 'all' 
                              ? `Menampilkan ${items.length} item dari semua kategori`
                              : `Menampilkan ${items.filter(i => i.category === rabForm.itemCategory).length} item kategori ${rabForm.itemCategory}`
                            }
                          </p>
                        </div>
                        
                        {/* Show manual input fields when custom mode is selected */}
                        {rabForm.itemId === '__custom__' && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                              <Edit className="w-4 h-4" />
                              Input Manual Item Baru
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Nama Item *</Label>
                                <Input className="input-neon h-9" placeholder="Nama item..." value={rabForm.itemName || ''} onChange={(e) => setRabForm({ ...rabForm, itemName: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Kategori</Label>
                                <Select value={rabForm.category || 'Civil'} onValueChange={(v) => setRabForm({ ...rabForm, category: v })}>
                                  <SelectTrigger className="bg-slate-800 border-slate-700 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Civil">Civil</SelectItem>
                                    <SelectItem value="MEP">MEP</SelectItem>
                                    <SelectItem value="Interior">Interior</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Satuan</Label>
                                <Select value={rabForm.itemUnit || 'Pcs'} onValueChange={(v) => setRabForm({ ...rabForm, itemUnit: v })}>
                                  <SelectTrigger className="bg-slate-800 border-slate-700 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pcs">Pcs</SelectItem>
                                    <SelectItem value="M2">M2</SelectItem>
                                    <SelectItem value="M3">M3</SelectItem>
                                    <SelectItem value="Kg">Kg</SelectItem>
                                    <SelectItem value="Ls">Ls (Lumpsum)</SelectItem>
                                    <SelectItem value="Batang">Batang</SelectItem>
                                    <SelectItem value="Meter">Meter</SelectItem>
                                    <SelectItem value="Set">Set</SelectItem>
                                    <SelectItem value="Unit">Unit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="text-xs text-amber-400">💡 Item baru akan otomatis tersimpan ke Master Items dengan kode sesuai kategori</div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Description / Keterangan</Label>
                          <Input 
                            className="input-neon" 
                            placeholder="Deskripsi atau keterangan item..." 
                            value={rabForm.description || ''} 
                            onChange={(e) => setRabForm({ ...rabForm, description: e.target.value })} 
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input type="number" className="input-neon" value={rabForm.quantity || ''} onChange={(e) => setRabForm({ ...rabForm, quantity: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price (Rp) *</Label>
                            <Input type="number" className="input-neon" value={rabForm.unitPrice || ''} onChange={(e) => setRabForm({ ...rabForm, unitPrice: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Total (Rp)</Label>
                            <Input 
                              type="text" 
                              className="input-neon bg-slate-700 font-medium text-cyan-400" 
                              value={formatCurrency((rabForm.quantity || 0) * (rabForm.unitPrice || 0))} 
                              disabled 
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRABDialog(false)}>Batal</Button>
                        <Button className="btn-neon" onClick={saveRABItem}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Simpan Item
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProject && selectedProject !== 'all' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-400">Total RAB</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(rabItems.reduce((s, i) => {
                          const qty = editedRabItems[i.id]?.quantity ?? i.quantity;
                          const price = editedRabItems[i.id]?.unitPrice ?? i.unitPrice;
                          return s + (qty * price);
                        }, 0))}
                      </p>
                      {hasUnsavedChanges && (
                        <p className="text-xs text-amber-400 mt-1">* Belum disimpan</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-400">Modal Kerja</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {formatCurrency(projects.find(p => p.id === selectedProject)?.modalKerja || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-400">Selisih (Profit/Loss)</p>
                      {(() => {
                        const project = projects.find(p => p.id === selectedProject);
                        const rab = rabItems.reduce((s, i) => {
                          const qty = editedRabItems[i.id]?.quantity ?? i.quantity;
                          const price = editedRabItems[i.id]?.unitPrice ?? i.unitPrice;
                          return s + (qty * price);
                        }, 0);
                        const modal = project?.modalKerja || 0;
                        const diff = rab - modal; // RAB - Modal Kerja = Profit
                        const profitPercent = rab > 0 ? ((diff / rab) * 100).toFixed(1) : 0;
                        return (
                          <div>
                            <p className={`text-2xl font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(diff)}
                              {diff >= 0 
                                ? <span className="text-xs ml-2 text-green-400">✓ PROFIT ({profitPercent}%)</span>
                                : <span className="text-xs ml-2">⚠️ DEFICIT</span>
                              }
                            </p>
                            {hasUnsavedChanges && (
                              <p className="text-xs text-amber-400 mt-1">* Berdasarkan nilai yang diedit</p>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">RAB Items</CardTitle>
                    {hasUnsavedChanges && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse">
                        Ada perubahan belum disimpan
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {rabItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada item RAB</p>
                      <p className="text-sm">Klik "Add RAB Item" untuk menambahkan item</p>
                    </div>
                  ) : selectedProject === 'all' ? (
                    /* Show all RAB items grouped by project when "all" is selected */
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-400">Total Projects</p>
                          <p className="text-2xl font-bold text-cyan-400">
                            {[...new Set(rabItems.map(i => i.projectId))].length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Total Items</p>
                          <p className="text-2xl font-bold text-white">{rabItems.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Total Budget</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatCurrency(rabItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Avg per Project</p>
                          <p className="text-2xl font-bold text-amber-400">
                            {formatCurrency(rabItems.reduce((sum, item) => sum + item.totalPrice, 0) / Math.max(1, [...new Set(rabItems.map(i => i.projectId))].length))}
                          </p>
                        </div>
                      </div>

                      {/* Group by Project */}
                      {(() => {
                        const projectGroups = rabItems.reduce((acc, item) => {
                          const pid = item.projectId;
                          if (!acc[pid]) {
                            acc[pid] = {
                              projectId: pid,
                              projectName: (item as any).project?.name || 'Unknown',
                              projectCode: (item as any).project?.code || '',
                              clientName: (item as any).project?.client?.name || '',
                              items: [],
                              totalBudget: 0
                            };
                          }
                          acc[pid].items.push(item);
                          acc[pid].totalBudget += item.totalPrice;
                          return acc;
                        }, {} as Record<string, any>);

                        // Toggle collapse function
                        const toggleCollapse = (projectId: string) => {
                          setCollapsedProjects(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(projectId)) {
                              newSet.delete(projectId);
                            } else {
                              newSet.add(projectId);
                            }
                            return newSet;
                          });
                        };

                        return Object.values(projectGroups).map((group: any) => {
                          const isCollapsed = collapsedProjects.has(group.projectId);
                          
                          return (
                          <div key={group.projectId} className="border border-slate-700 rounded-lg overflow-hidden">
                            {/* Project Header - Clickable */}
                            <div 
                              className="bg-slate-800/50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                              onClick={() => toggleCollapse(group.projectId)}
                            >
                              <div className="flex items-center gap-3">
                                {/* Collapse/Expand Arrow Icon */}
                                <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-5 h-5 text-cyan-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-cyan-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-white">{group.projectName}</h4>
                                  <p className="text-xs text-slate-400">{group.projectCode} {group.clientName && `• ${group.clientName}`}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-400">{group.items.length} items</p>
                                <p className="text-lg font-bold text-cyan-400">{formatCurrency(group.totalBudget)}</p>
                              </div>
                            </div>
                            
                            {/* Items Table - Collapsible */}
                            {!isCollapsed && (
                            <Table>
                              <TableHeader>
                                <TableRow className="border-slate-700 bg-slate-900/50">
                                  <TableHead className="text-slate-400 text-xs">Category</TableHead>
                                  <TableHead className="text-slate-400 text-xs">Item</TableHead>
                                  <TableHead className="text-slate-400 text-xs">Description</TableHead>
                                  <TableHead className="text-slate-400 text-xs w-16">Qty</TableHead>
                                  <TableHead className="text-slate-400 text-xs">Unit</TableHead>
                                  <TableHead className="text-slate-400 text-xs">Price</TableHead>
                                  <TableHead className="text-slate-400 text-xs">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.items.map((item: any) => (
                                  <TableRow key={item.id} className="border-slate-800">
                                    <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                                    <TableCell className="text-white text-sm">{item.item?.name}</TableCell>
                                    <TableCell className="text-slate-400 text-sm">{item.description || '-'}</TableCell>
                                    <TableCell className="text-white text-sm text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-slate-400 text-sm">{item.item?.unit}</TableCell>
                                    <TableCell className="text-slate-400 text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-cyan-400 text-sm font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            )}
                          </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    /* Show single project RAB items with editable fields */
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">Category</TableHead>
                          <TableHead className="text-slate-400">Item</TableHead>
                          <TableHead className="text-slate-400 min-w-[200px]">Description</TableHead>
                          <TableHead className="text-slate-400 w-20">Qty</TableHead>
                          <TableHead className="text-slate-400">Unit</TableHead>
                          <TableHead className="text-slate-400 w-32">Price</TableHead>
                          <TableHead className="text-slate-400">Total</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rabItems.map((item) => {
                          const description = getRABItemValue(item, 'description');
                          const quantity = getRABItemValue(item, 'quantity');
                          const unitPrice = getRABItemValue(item, 'unitPrice');
                          const isEdited = editedRabItems[item.id] !== undefined;
                          
                          return (
                            <TableRow key={item.id} className={`border-slate-800 ${isEdited ? 'bg-amber-500/5' : ''}`}>
                              <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                              <TableCell className="text-white font-medium">{item.item?.name}</TableCell>
                              <TableCell>
                                <Input
                                  className="input-neon h-8 text-sm bg-slate-800/50"
                                  value={description || ''}
                                  placeholder="Tambah deskripsi..."
                                  onChange={(e) => handleRABItemChange(item.id, 'description', e.target.value)}
                                  disabled={isVisitor}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="input-neon h-8 text-sm w-16 bg-slate-800/50 text-center"
                                  value={quantity}
                                  onChange={(e) => handleRABItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  disabled={isVisitor}
                                />
                              </TableCell>
                              <TableCell className="text-slate-400">{item.item?.unit}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="input-neon h-8 text-sm w-28 bg-slate-800/50"
                                  value={unitPrice}
                                  onChange={(e) => handleRABItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  disabled={isVisitor}
                                />
                              </TableCell>
                              <TableCell className="text-cyan-400 font-medium">
                                {formatCurrency(quantity * unitPrice)}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteRABItem(item.id)}>
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  
                  {/* Save Button */}
                  {rabItems.length > 0 && hasUnsavedChanges && (
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        className="border-slate-600"
                        onClick={() => {
                          setEditedRabItems({});
                          setHasUnsavedChanges(false);
                        }}
                      >
                        Batal
                      </Button>
                      <Button 
                        className="btn-neon"
                        disabled={isVisitor}
                        onClick={saveAllRABChanges}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Simpan & Lihat Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Accounting */}
          {activeMenu === 'accounting' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Accounting</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-slate-600" disabled={isVisitor} onClick={printTransactions}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                  <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
                    <DialogTrigger asChild>
                      <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setTransactionForm({ projectId: selectedProject !== 'all' ? selectedProject : '', type: 'Expense', date: new Date().toISOString().split('T')[0] }); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">{editingId ? 'Edit' : 'Add'} Transaction</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          {editingId ? 'Ubah transaksi yang sudah ada' : 'Tambahkan transaksi baru'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project</Label>
                            <Select value={transactionForm.projectId || ''} onValueChange={(v) => setTransactionForm({ ...transactionForm, projectId: v })}>
                              <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Select Project" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={transactionForm.type || 'Expense'} onValueChange={(v) => setTransactionForm({ ...transactionForm, type: v })}>
                              <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Income">Income</SelectItem>
                                <SelectItem value="Expense">Expense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={transactionForm.category || 'Other'} onValueChange={(v) => setTransactionForm({ ...transactionForm, category: v })}>
                              <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Progress Payment">Progress Payment / Termin</SelectItem>
                                <SelectItem value="Material">Material</SelectItem>
                                <SelectItem value="Labor">Labor</SelectItem>
                                <SelectItem value="Equipment">Equipment</SelectItem>
                                <SelectItem value="Overhead">Overhead</SelectItem>
                                <SelectItem value="Subcon">Subcon</SelectItem>
                                <SelectItem value="Payment">Payment</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input type="number" className="input-neon" value={transactionForm.amount || ''} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input className="input-neon" value={transactionForm.description || ''} onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" className="input-neon" value={transactionForm.date || ''} onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
                        <Button className="btn-neon" onClick={saveTransaction}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Financial Summary Cards */}
              {(() => {
                // Calculate financial data based on selected project
                const getProjectFinance = (projectId: string) => {
                  const project = projects.find(p => p.id === projectId);
                  const projectTransactions = transactions.filter(t => t.projectId === projectId);
                  const projectRab = projectStats.find(p => p.id === projectId);
                  
                  const rabValue = projectRab?.budget || project?.contractValue || 0;
                  const modalKerja = project?.modalKerja || 0;
                  const income = projectTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
                  const expense = projectTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
                  const sisaTagihan = rabValue - income;
                  const profit = income - expense;
                  
                  return { rabValue, modalKerja, income, expense, sisaTagihan, profit, project };
                };

                if (selectedProject === 'all') {
                  // Show all projects summary
                  const projectFinances = projects.map(p => getProjectFinance(p.id));
                  const totalRab = projectFinances.reduce((sum, pf) => sum + pf.rabValue, 0);
                  const totalModalKerja = projectFinances.reduce((sum, pf) => sum + pf.modalKerja, 0);
                  const totalIncome = projectFinances.reduce((sum, pf) => sum + pf.income, 0);
                  const totalExpense = projectFinances.reduce((sum, pf) => sum + pf.expense, 0);
                  const totalSisaTagihan = projectFinances.reduce((sum, pf) => sum + pf.sisaTagihan, 0);
                  const totalProfit = projectFinances.reduce((sum, pf) => sum + pf.profit, 0);

                  return (
                    <>
                      {/* Total Summary */}
                      <div className="grid grid-cols-6 gap-3">
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total RAB</p>
                            <p className="text-xl font-bold text-cyan-400">{formatCurrency(totalRab)}</p>
                          </CardContent>
                        </Card>
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Modal Kerja</p>
                            <p className="text-xl font-bold text-purple-400">{formatCurrency(totalModalKerja)}</p>
                          </CardContent>
                        </Card>
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Uang Masuk</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
                          </CardContent>
                        </Card>
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Uang Keluar</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
                          </CardContent>
                        </Card>
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Sisa Tagihan</p>
                            <p className="text-xl font-bold text-amber-400">{formatCurrency(totalSisaTagihan)}</p>
                          </CardContent>
                        </Card>
                        <Card className="glass-card">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Profit/Loss</p>
                            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(totalProfit)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Per Project Financial Reports */}
                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle className="text-white">Laporan Keuangan Per Project</CardTitle>
                          <CardDescription className="text-slate-400">Ringkasan keuangan semua project</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-700">
                                <TableHead className="text-slate-400">Project</TableHead>
                                <TableHead className="text-slate-400 text-right">Nilai RAB</TableHead>
                                <TableHead className="text-slate-400 text-right">Modal Kerja</TableHead>
                                <TableHead className="text-slate-400 text-right">Uang Masuk</TableHead>
                                <TableHead className="text-slate-400 text-right">Uang Keluar</TableHead>
                                <TableHead className="text-slate-400 text-right">Sisa Tagihan</TableHead>
                                <TableHead className="text-slate-400 text-right">Profit/Loss</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {projectFinances.map((pf, idx) => (
                                <TableRow key={idx} className="border-slate-800">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-white">{pf.project?.name || 'Unknown'}</p>
                                      <p className="text-xs text-slate-500">{pf.project?.code}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-cyan-400 text-right">{formatCurrency(pf.rabValue)}</TableCell>
                                  <TableCell className="text-purple-400 text-right">{formatCurrency(pf.modalKerja)}</TableCell>
                                  <TableCell className="text-green-400 text-right">{formatCurrency(pf.income)}</TableCell>
                                  <TableCell className="text-red-400 text-right">{formatCurrency(pf.expense)}</TableCell>
                                  <TableCell className="text-amber-400 text-right">{formatCurrency(pf.sisaTagihan)}</TableCell>
                                  <TableCell className={`text-right font-bold ${pf.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {pf.profit >= 0 ? '+' : ''}{formatCurrency(pf.profit)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </>
                  );
                } else {
                  // Single project summary
                  const pf = getProjectFinance(selectedProject);
                  
                  return (
                    <div className="grid grid-cols-6 gap-3">
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Nilai RAB</p>
                          <p className="text-xl font-bold text-cyan-400">{formatCurrency(pf.rabValue)}</p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Modal Kerja</p>
                          <p className="text-xl font-bold text-purple-400">{formatCurrency(pf.modalKerja)}</p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Uang Masuk</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(pf.income)}</p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Uang Keluar</p>
                          <p className="text-xl font-bold text-red-400">{formatCurrency(pf.expense)}</p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Sisa Tagihan</p>
                          <p className="text-xl font-bold text-amber-400">{formatCurrency(pf.sisaTagihan)}</p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-400">Profit/Loss</p>
                          <p className={`text-xl font-bold ${pf.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pf.profit >= 0 ? '+' : ''}{formatCurrency(pf.profit)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }
              })()}

              <div id="print-transactions">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-white">Detail Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">Date</TableHead>
                          <TableHead className="text-slate-400">Project</TableHead>
                          <TableHead className="text-slate-400">Type</TableHead>
                          <TableHead className="text-slate-400">Category</TableHead>
                          <TableHead className="text-slate-400">Description</TableHead>
                          <TableHead className="text-slate-400 text-right">Amount</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 20).map((tx) => (
                          <TableRow key={tx.id} className="border-slate-800">
                            <TableCell className="text-slate-400">{new Date(tx.date).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="text-white">{tx.project?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={tx.type === 'Income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">{tx.category}</TableCell>
                            <TableCell className="text-white">{tx.description}</TableCell>
                            <TableCell className={`text-right font-medium ${tx.type === 'Income' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(tx.id); setTransactionForm(tx as any); setShowTransactionDialog(true); }}>
                                <Edit className="w-4 h-4 text-amber-400" />
                              </Button>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteTransaction(tx.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Journal / Buku Besar */}
          {activeMenu === 'journal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Jurnal / Buku Besar</h2>
                <div className="flex gap-2">
                  {journalTab === 'internal' && (
                    <Button className="btn-neon" disabled={isVisitor} onClick={() => { setInternalForm({ type: 'Expense', date: new Date().toISOString().split('T')[0] }); setShowInternalDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Transaksi Internal
                    </Button>
                  )}
                  <Button variant="outline" className="border-slate-600" onClick={printJournal}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Jurnal
                  </Button>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2">
                <Button 
                  className={journalTab === 'project' ? 'btn-neon' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}
                  onClick={() => setJournalTab('project')}
                >
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Jurnal Project
                </Button>
                <Button 
                  className={journalTab === 'internal' ? 'btn-neon' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}
                  onClick={() => setJournalTab('internal')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Jurnal Internal Perusahaan
                </Button>
              </div>

              {/* Filters */}
              <Card className="glass-card">
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    {journalTab === 'project' && (
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-sm">Project</Label>
                        <Select value={journalProject} onValueChange={setJournalProject}>
                          <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Select Project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Project</SelectItem>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Dari Tanggal</Label>
                      <Input 
                        type="date" 
                        className="bg-slate-800 border-slate-700 w-44"
                        value={journalStartDate}
                        onChange={(e) => setJournalStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Sampai Tanggal</Label>
                      <Input 
                        type="date" 
                        className="bg-slate-800 border-slate-700 w-44"
                        value={journalEndDate}
                        onChange={(e) => setJournalEndDate(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="btn-neon"
                      onClick={() => journalTab === 'project' ? loadJournalData() : loadInternalData()}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-slate-600"
                      onClick={() => {
                        setJournalProject('all');
                        setJournalStartDate('');
                        setJournalEndDate('');
                        if (journalTab === 'project') {
                          loadJournalData();
                        } else {
                          loadInternalData();
                        }
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PROJECT JOURNAL TAB */}
              {journalTab === 'project' && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Debit (Masuk)</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(journalSummary.totalDebit)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Kredit (Keluar)</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(journalSummary.totalCredit)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Saldo Berjalan</p>
                            <p className={`text-xl font-bold ${journalSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(journalSummary.balance)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <ArrowRightLeft className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Transaksi</p>
                            <p className="text-xl font-bold text-white">{journalSummary.transactionCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Journal Table */}
                  <div id="print-journal">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">
                          📁 Jurnal Project - {journalProject === 'all' ? 'Semua Project' : projects.find(p => p.id === journalProject)?.name || 'Pilih Project'}
                          {journalStartDate && journalEndDate && (
                            <span className="text-sm font-normal text-slate-400 ml-2">
                              ({new Date(journalStartDate).toLocaleDateString('id-ID')} - {new Date(journalEndDate).toLocaleDateString('id-ID')})
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-400 w-12">No</TableHead>
                              <TableHead className="text-slate-400 w-28">Tanggal</TableHead>
                              <TableHead className="text-slate-400 w-32">Kode</TableHead>
                              <TableHead className="text-slate-400">Keterangan</TableHead>
                              <TableHead className="text-slate-400 w-36">Project</TableHead>
                              <TableHead className="text-slate-400 w-32">Kategori</TableHead>
                              <TableHead className="text-slate-400 text-right w-36">Debit (Masuk)</TableHead>
                              <TableHead className="text-slate-400 text-right w-36">Kredit (Keluar)</TableHead>
                              <TableHead className="text-slate-400 text-right w-36">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {journalEntries.length === 0 ? (
                              <TableRow className="border-slate-800">
                                <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                                  Tidak ada data transaksi project
                                </TableCell>
                              </TableRow>
                            ) : (
                              journalEntries.map((entry, idx) => (
                                <TableRow key={entry.id} className="border-slate-800 hover:bg-slate-800/50">
                                  <TableCell className="text-slate-400 text-center">{idx + 1}</TableCell>
                                  <TableCell className="text-slate-300">
                                    {new Date(entry.date).toLocaleDateString('id-ID')}
                                  </TableCell>
                                  <TableCell className="text-cyan-400 font-mono text-xs">
                                    {entry.code || `TRX-${entry.id.slice(-6).toUpperCase()}`}
                                  </TableCell>
                                  <TableCell className="text-white">{entry.description}</TableCell>
                                  <TableCell className="text-slate-300 text-sm">
                                    {entry.project?.name || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      entry.category === 'Payment' ? 'border-green-500 text-green-400' :
                                      entry.category === 'Material' ? 'border-amber-500 text-amber-400' :
                                      entry.category === 'Labor' ? 'border-cyan-500 text-cyan-400' :
                                      'border-slate-500 text-slate-400'
                                    }>
                                      {entry.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-green-400">
                                    {entry.type === 'Income' ? formatCurrency(entry.amount) : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-red-400">
                                    {entry.type === 'Expense' ? formatCurrency(entry.amount) : '-'}
                                  </TableCell>
                                  <TableCell className={`text-right font-bold ${entry.runningBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(entry.runningBalance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            {/* Summary Row */}
                            {journalEntries.length > 0 && (
                              <TableRow className="border-slate-700 bg-slate-800/50 font-bold">
                                <TableCell colSpan={6} className="text-right text-white pr-4">
                                  TOTAL
                                </TableCell>
                                <TableCell className="text-right text-green-400">
                                  {formatCurrency(journalSummary.totalDebit)}
                                </TableCell>
                                <TableCell className="text-right text-red-400">
                                  {formatCurrency(journalSummary.totalCredit)}
                                </TableCell>
                                <TableCell className={`text-right ${journalSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(journalSummary.balance)}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Project Summary */}
                  {journalProject === 'all' && (
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Ringkasan per Project</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-400">Project</TableHead>
                              <TableHead className="text-slate-400 text-right">Total Debit</TableHead>
                              <TableHead className="text-slate-400 text-right">Total Kredit</TableHead>
                              <TableHead className="text-slate-400 text-right">Saldo</TableHead>
                              <TableHead className="text-slate-400 text-right">Jumlah Transaksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getProjectSummary().map((summary) => (
                              <TableRow key={summary.projectId} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                                onClick={() => setJournalProject(summary.projectId)}
                              >
                                <TableCell className="text-white">{summary.projectName}</TableCell>
                                <TableCell className="text-right text-green-400">{formatCurrency(summary.totalDebit)}</TableCell>
                                <TableCell className="text-right text-red-400">{formatCurrency(summary.totalCredit)}</TableCell>
                                <TableCell className={`text-right font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(summary.balance)}
                                </TableCell>
                                <TableCell className="text-right text-slate-400">{summary.transactionCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* INTERNAL JOURNAL TAB */}
              {journalTab === 'internal' && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Debit (Masuk)</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(internalSummary.totalDebit)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Kredit (Keluar)</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(internalSummary.totalCredit)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Saldo Berjalan</p>
                            <p className={`text-xl font-bold ${internalSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(internalSummary.balance)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <ArrowRightLeft className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Transaksi</p>
                            <p className="text-xl font-bold text-white">{internalSummary.transactionCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Internal Journal Table */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        🏢 Jurnal Internal Perusahaan (ATK, Gaji, Operasional, dll)
                        {journalStartDate && journalEndDate && (
                          <span className="text-sm font-normal text-slate-400 ml-2">
                            ({new Date(journalStartDate).toLocaleDateString('id-ID')} - {new Date(journalEndDate).toLocaleDateString('id-ID')})
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-400 w-12">No</TableHead>
                            <TableHead className="text-slate-400 w-28">Tanggal</TableHead>
                            <TableHead className="text-slate-400 w-32">Kode</TableHead>
                            <TableHead className="text-slate-400">Keterangan</TableHead>
                            <TableHead className="text-slate-400 w-32">Kategori</TableHead>
                            <TableHead className="text-slate-400 text-right w-36">Debit (Masuk)</TableHead>
                            <TableHead className="text-slate-400 text-right w-36">Kredit (Keluar)</TableHead>
                            <TableHead className="text-slate-400 text-right w-36">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {internalEntries.length === 0 ? (
                            <TableRow className="border-slate-800">
                              <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                                Tidak ada data transaksi internal. Klik "Tambah Transaksi Internal" untuk menambahkan.
                              </TableCell>
                            </TableRow>
                          ) : (
                            internalEntries.map((entry, idx) => (
                              <TableRow key={entry.id} className="border-slate-800 hover:bg-slate-800/50">
                                <TableCell className="text-slate-400 text-center">{idx + 1}</TableCell>
                                <TableCell className="text-slate-300">
                                  {new Date(entry.date).toLocaleDateString('id-ID')}
                                </TableCell>
                                <TableCell className="text-cyan-400 font-mono text-xs">
                                  {entry.code || `INT-${entry.id.slice(-6).toUpperCase()}`}
                                </TableCell>
                                <TableCell className="text-white">{entry.description}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    entry.category === 'ATK' ? 'border-pink-500 text-pink-400' :
                                    entry.category === 'Gaji' ? 'border-blue-500 text-blue-400' :
                                    entry.category === 'Listrik' ? 'border-yellow-500 text-yellow-400' :
                                    entry.category === 'Sewa' ? 'border-purple-500 text-purple-400' :
                                    entry.category === 'Transport' ? 'border-cyan-500 text-cyan-400' :
                                    entry.category === 'Administrasi' ? 'border-emerald-500 text-emerald-400' :
                                    'border-slate-500 text-slate-400'
                                  }>
                                    {entry.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-400">
                                  {entry.type === 'Income' ? formatCurrency(entry.amount) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-400">
                                  {entry.type === 'Expense' ? formatCurrency(entry.amount) : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${entry.runningBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(entry.runningBalance)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                          {/* Summary Row */}
                          {internalEntries.length > 0 && (
                            <TableRow className="border-slate-700 bg-slate-800/50 font-bold">
                              <TableCell colSpan={5} className="text-right text-white pr-4">
                                TOTAL
                              </TableCell>
                              <TableCell className="text-right text-green-400">
                                {formatCurrency(internalSummary.totalDebit)}
                              </TableCell>
                              <TableCell className="text-right text-red-400">
                                {formatCurrency(internalSummary.totalCredit)}
                              </TableCell>
                              <TableCell className={`text-right ${internalSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(internalSummary.balance)}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Combined Summary */}
                  <Card className="glass-card border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">📊 Ringkasan Gabungan (Project + Internal)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400 mb-1">Total Debit Keseluruhan</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatCurrency(journalSummary.totalDebit + internalSummary.totalDebit)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400 mb-1">Total Kredit Keseluruhan</p>
                          <p className="text-2xl font-bold text-red-400">
                            {formatCurrency(journalSummary.totalCredit + internalSummary.totalCredit)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400 mb-1">Saldo Keseluruhan</p>
                          <p className={`text-2xl font-bold ${(journalSummary.balance + internalSummary.balance) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(journalSummary.balance + internalSummary.balance)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Internal Transaction Dialog */}
              <Dialog open={showInternalDialog} onOpenChange={setShowInternalDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Tambah Transaksi Internal</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Catat transaksi internal perusahaan seperti ATK, gaji, listrik, dll.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipe *</Label>
                        <Select value={internalForm.type || 'Expense'} onValueChange={(v) => setInternalForm({ ...internalForm, type: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Income">Pemasukan</SelectItem>
                            <SelectItem value="Expense">Pengeluaran</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori *</Label>
                        <Select value={internalForm.category || 'ATK'} onValueChange={(v) => setInternalForm({ ...internalForm, category: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATK">ATK (Alat Tulis)</SelectItem>
                            <SelectItem value="Gaji">Gaji Karyawan</SelectItem>
                            <SelectItem value="Listrik">Listrik & Air</SelectItem>
                            <SelectItem value="Sewa">Sewa Tempat</SelectItem>
                            <SelectItem value="Transport">Transport</SelectItem>
                            <SelectItem value="Administrasi">Administrasi</SelectItem>
                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Keterangan *</Label>
                      <Input className="input-neon" value={internalForm.description || ''} onChange={(e) => setInternalForm({ ...internalForm, description: e.target.value })} placeholder="Contoh: Pembelian kertas HVS A4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jumlah (Rp) *</Label>
                        <Input type="number" className="input-neon" value={internalForm.amount || ''} onChange={(e) => setInternalForm({ ...internalForm, amount: e.target.value })} placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal *</Label>
                        <Input type="date" className="input-neon" value={internalForm.date || ''} onChange={(e) => setInternalForm({ ...internalForm, date: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea className="input-neon" value={internalForm.notes || ''} onChange={(e) => setInternalForm({ ...internalForm, notes: e.target.value })} placeholder="Catatan tambahan (opsional)" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowInternalDialog(false); setInternalForm({}); }}>Batal</Button>
                    <Button className="btn-neon" onClick={saveInternalTransaction}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Master Items */}
          {activeMenu === 'items' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Master Items</h2>
                <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                  <DialogTrigger asChild>
                    <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setItemForm({ category: 'Civil', unit: 'Pcs' }); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingId ? 'Edit' : 'Add'} Item</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {editingId ? 'Ubah item master yang sudah ada' : 'Tambahkan item master baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Code</Label>
                          {editingId ? (
                            <Input className="input-neon bg-slate-800/50" value={itemForm.code || ''} readOnly disabled />
                          ) : (
                            <div className="space-y-1">
                              <Input 
                                className="input-neon bg-slate-800/50 text-slate-400" 
                                value="Auto-generated" 
                                readOnly 
                                disabled 
                              />
                              <p className="text-xs text-cyan-400">Kode akan di-generate otomatis berdasarkan kategori</p>
                              <p className="text-xs text-slate-500">Interior: INT-xxxx | Civil: CVL-xxxx | MEP: MEP-xxxx | General: GEN-xxxx</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input className="input-neon" value={itemForm.name || ''} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Nama item" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select value={itemForm.category || 'Civil'} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Interior">Interior (INT)</SelectItem>
                              <SelectItem value="Civil">Civil (CVL)</SelectItem>
                              <SelectItem value="MEP">MEP</SelectItem>
                              <SelectItem value="General">General (GEN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Unit *</Label>
                          <Select value={itemForm.unit || 'Pcs'} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pcs">Pcs</SelectItem>
                              <SelectItem value="Set">Set</SelectItem>
                              <SelectItem value="m2">m²</SelectItem>
                              <SelectItem value="m3">m³</SelectItem>
                              <SelectItem value="m">m (Meter)</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Ls">Ls (Lumpsum)</SelectItem>
                              <SelectItem value="Unit">Unit</SelectItem>
                              <SelectItem value="Hari">Hari</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price (Rp) *</Label>
                          <Input type="number" className="input-neon" value={itemForm.price || ''} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} placeholder="0" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input className="input-neon" value={itemForm.description || ''} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Deskripsi item (opsional)" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
                      <Button className="btn-neon" onClick={saveItem}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search and Filter */}
              <Card className="glass-card">
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Label className="text-slate-400 text-sm">Cari Item</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          className="bg-slate-800 border-slate-700 pl-10"
                          placeholder="Cari berdasarkan kode atau nama..."
                          value={itemSearch}
                          onChange={(e) => {
                            setItemSearch(e.target.value);
                            // Debounce search
                            setTimeout(() => {
                              loadItems(e.target.value, itemCategoryFilter);
                            }, 300);
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Kategori</Label>
                      <Select value={itemCategoryFilter} onValueChange={(v) => {
                        setItemCategoryFilter(v);
                        loadItems(itemSearch, v);
                      }}>
                        <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          <SelectItem value="Interior">Interior</SelectItem>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="MEP">MEP</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-slate-600"
                      onClick={() => {
                        setItemSearch('');
                        setItemCategoryFilter('all');
                        loadItems('', 'all');
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card className="glass-card">
                <CardContent className="p-0">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada item ditemukan</p>
                      <p className="text-sm">Coba ubah filter pencarian atau tambahkan item baru</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">Code</TableHead>
                          <TableHead className="text-slate-400">Name</TableHead>
                          <TableHead className="text-slate-400">Category</TableHead>
                          <TableHead className="text-slate-400">Unit</TableHead>
                          <TableHead className="text-slate-400 text-right">Price</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="text-cyan-400 font-mono font-medium">{item.code}</TableCell>
                            <TableCell className="text-white">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                item.category === 'Civil' ? 'border-slate-500 text-slate-400' :
                                item.category === 'MEP' ? 'border-cyan-500 text-cyan-400' :
                                item.category === 'Interior' ? 'border-purple-500 text-purple-400' :
                                'border-amber-500 text-amber-400'
                              }>
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">{item.unit}</TableCell>
                            <TableCell className="text-right text-white font-medium">{formatCurrency(item.price)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(item.id); setItemForm(item as any); setShowItemDialog(true); }}>
                                <Edit className="w-4 h-4 text-amber-400" />
                              </Button>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteItem(item.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Aset */}
          {activeMenu === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Data Aset</h2>
                <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
                  <DialogTrigger asChild>
                    <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setAssetForm({ condition: 'Baik', category: 'Alat Kerja' }); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Aset
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingId ? 'Edit' : 'Tambah'} Aset</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {editingId ? 'Ubah data aset yang sudah ada' : 'Tambahkan aset baru ke sistem'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nama Aset *</Label>
                          <Input className="input-neon" value={assetForm.name || ''} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="Nama aset" />
                        </div>
                        <div className="space-y-2">
                          <Label>Kategori *</Label>
                          <Select value={assetForm.category || 'Alat Kerja'} onValueChange={(v) => setAssetForm({ ...assetForm, category: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Alat Kerja">Alat Kerja</SelectItem>
                              <SelectItem value="Komputer">Komputer / IT</SelectItem>
                              <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                              <SelectItem value="Perabot">Perabot Kantor</SelectItem>
                              <SelectItem value="Tanah">Tanah / Bangunan</SelectItem>
                              <SelectItem value="Lainnya">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Merk</Label>
                          <Input className="input-neon" value={assetForm.brand || ''} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} placeholder="Merk" />
                        </div>
                        <div className="space-y-2">
                          <Label>Model</Label>
                          <Input className="input-neon" value={assetForm.model || ''} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} placeholder="Model" />
                        </div>
                        <div className="space-y-2">
                          <Label>No. Seri</Label>
                          <Input className="input-neon" value={assetForm.serialNumber || ''} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} placeholder="Serial Number" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tanggal Pembelian</Label>
                          <Input type="date" className="input-neon" value={assetForm.purchaseDate || ''} onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Kondisi</Label>
                          <Select value={assetForm.condition || 'Baik'} onValueChange={(v) => setAssetForm({ ...assetForm, condition: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baik">Baik</SelectItem>
                              <SelectItem value="Cukup">Cukup</SelectItem>
                              <SelectItem value="Rusak">Rusak</SelectItem>
                              <SelectItem value="Tidak Terpakai">Tidak Terpakai</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Harga Pembelian (Rp)</Label>
                          <Input type="number" className="input-neon" value={assetForm.purchasePrice || ''} onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value, currentValue: e.target.value })} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nilai Saat Ini (Rp)</Label>
                          <Input type="number" className="input-neon" value={assetForm.currentValue || assetForm.purchasePrice || ''} onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })} placeholder="0" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Lokasi</Label>
                          <Input className="input-neon" value={assetForm.location || ''} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} placeholder="Lokasi aset" />
                        </div>
                        <div className="space-y-2">
                          <Label>Pengguna / PIC</Label>
                          <Input className="input-neon" value={assetForm.assignedTo || ''} onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })} placeholder="Nama pengguna" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Textarea className="input-neon" value={assetForm.notes || ''} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} placeholder="Catatan tambahan" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setShowAssetDialog(false); setAssetForm({}); setEditingId(null); }}>Batal</Button>
                      <Button className="btn-neon" onClick={saveAsset}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Total Aset</p>
                        <p className="text-xl font-bold text-white">{assetSummary.totalAssets}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tersedia</p>
                        <p className="text-xl font-bold text-green-400">{assetSummary.availableCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <HandCoins className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Dipinjam</p>
                        <p className="text-xl font-bold text-orange-400">{assetSummary.loanedCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Aktif</p>
                        <p className="text-xl font-bold text-blue-400">{assetSummary.activeCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Nilai Beli</p>
                        <p className="text-sm font-bold text-amber-400">{formatCurrency(assetSummary.totalPurchaseValue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Nilai Saat Ini</p>
                        <p className="text-sm font-bold text-purple-400">{formatCurrency(assetSummary.totalCurrentValue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assets Table */}
              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Kode</TableHead>
                        <TableHead className="text-slate-400">Nama Aset</TableHead>
                        <TableHead className="text-slate-400">Kategori</TableHead>
                        <TableHead className="text-slate-400">Kondisi</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Peminjam</TableHead>
                        <TableHead className="text-slate-400 text-right">Nilai</TableHead>
                        <TableHead className="text-slate-400">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.length === 0 ? (
                        <TableRow className="border-slate-800">
                          <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                            Belum ada data aset. Klik "Tambah Aset" untuk menambahkan.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assets.map((asset) => (
                          <TableRow key={asset.id} className="border-slate-800">
                            <TableCell className="text-cyan-400 font-mono text-sm">{asset.code}</TableCell>
                            <TableCell className="text-white">
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                <p className="text-xs text-slate-500">{asset.location || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                asset.category === 'Alat Kerja' ? 'border-amber-500 text-amber-400' :
                                asset.category === 'Komputer' ? 'border-cyan-500 text-cyan-400' :
                                asset.category === 'Kendaraan' ? 'border-blue-500 text-blue-400' :
                                asset.category === 'Perabot' ? 'border-purple-500 text-purple-400' :
                                'border-slate-500 text-slate-400'
                              }>
                                {asset.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                asset.condition === 'Baik' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                asset.condition === 'Cukup' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                                asset.condition === 'Rusak' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                'bg-slate-500/20 text-slate-400 border-slate-500/50'
                              }>
                                {asset.condition}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                asset.loanStatus === 'Dipinjam' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                'bg-green-500/20 text-green-400 border-green-500/50'
                              }>
                                {asset.loanStatus || 'Tersedia'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm">
                              {asset.borrowerName ? (
                                <div>
                                  <p className="font-medium">{asset.borrowerName}</p>
                                  {asset.expectedReturnDate && (
                                    <p className="text-xs text-slate-500">
                                      Kembali: {new Date(asset.expectedReturnDate).toLocaleDateString('id-ID')}
                                    </p>
                                  )}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-white font-medium text-sm">{formatCurrency(asset.currentValue)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {asset.loanStatus === 'Tersedia' ? (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    disabled={isVisitor} 
                                    title="Pinjamkan"
                                    onClick={() => {
                                      setSelectedAssetForLoan(asset);
                                      setLoanForm({
                                        assetId: asset.id,
                                        loanDate: new Date().toISOString().split('T')[0],
                                      });
                                      setShowLoanDialog(true);
                                    }}
                                  >
                                    <HandCoins className="w-4 h-4 text-orange-400" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    disabled={isVisitor} 
                                    title="Kembalikan"
                                    onClick={() => {
                                      setSelectedAssetForLoan(asset);
                                      setReturnForm({
                                        assetId: asset.id,
                                        returnedCondition: asset.condition,
                                      });
                                      setShowReturnDialog(true);
                                    }}
                                  >
                                    <Undo2 className="w-4 h-4 text-green-400" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  title="Riwayat Peminjaman"
                                  onClick={() => {
                                    setSelectedAssetForLoan(asset);
                                    loadLoanHistory(asset.id);
                                    setShowLoanHistoryDialog(true);
                                  }}
                                >
                                  <History className="w-4 h-4 text-cyan-400" />
                                </Button>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(asset.id); setAssetForm(asset as any); setShowAssetDialog(true); }}>
                                  <Edit className="w-4 h-4 text-amber-400" />
                                </Button>
                                <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteAsset(asset.id)}>
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Loan Dialog */}
              <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Form Peminjaman Aset</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Catat peminjaman aset oleh pihak eksternal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {selectedAssetForLoan && (
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-sm text-slate-400">Aset:</p>
                        <p className="text-white font-medium">{selectedAssetForLoan.code} - {selectedAssetForLoan.name}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Nama Peminjam *</Label>
                      <Input className="input-neon" value={loanForm.borrowerName || ''} onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })} placeholder="Nama peminjam" />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP Peminjam</Label>
                      <Input className="input-neon" value={loanForm.borrowerPhone || ''} onChange={(e) => setLoanForm({ ...loanForm, borrowerPhone: e.target.value })} placeholder="Nomor HP" />
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Peminjam</Label>
                      <Textarea className="input-neon" value={loanForm.borrowerAddress || ''} onChange={(e) => setLoanForm({ ...loanForm, borrowerAddress: e.target.value })} placeholder="Alamat peminjam" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tgl. Pinjam *</Label>
                        <Input type="date" className="input-neon" value={loanForm.loanDate || ''} onChange={(e) => setLoanForm({ ...loanForm, loanDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rencana Kembali *</Label>
                        <Input type="date" className="input-neon" value={loanForm.expectedReturnDate || ''} onChange={(e) => setLoanForm({ ...loanForm, expectedReturnDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea className="input-neon" value={loanForm.notes || ''} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} placeholder="Catatan peminjaman" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowLoanDialog(false); setLoanForm({}); setSelectedAssetForLoan(null); }}>Batal</Button>
                    <Button className="btn-neon" onClick={createLoan}>Simpan Peminjaman</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Return Dialog */}
              <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Form Pengembalian Aset</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Catat pengembalian aset yang dipinjam
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {selectedAssetForLoan && (
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-sm text-slate-400">Aset:</p>
                        <p className="text-white font-medium">{selectedAssetForLoan.code} - {selectedAssetForLoan.name}</p>
                        <p className="text-sm text-slate-400 mt-2">Dipinjam oleh:</p>
                        <p className="text-white">{selectedAssetForLoan.borrowerName}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Kondisi Saat Dikembalikan</Label>
                      <Select value={returnForm.returnedCondition || 'Baik'} onValueChange={(v) => setReturnForm({ ...returnForm, returnedCondition: v })}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baik">Baik</SelectItem>
                          <SelectItem value="Cukup">Cukup</SelectItem>
                          <SelectItem value="Rusak">Rusak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan Pengembalian</Label>
                      <Textarea className="input-neon" value={returnForm.returnNotes || ''} onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })} placeholder="Catatan pengembalian" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowReturnDialog(false); setReturnForm({}); setSelectedAssetForLoan(null); }}>Batal</Button>
                    <Button className="btn-neon bg-green-500 hover:bg-green-600" onClick={returnAsset}>Konfirmasi Pengembalian</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Loan History Dialog */}
              <Dialog open={showLoanHistoryDialog} onOpenChange={setShowLoanHistoryDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Riwayat Peminjaman</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Lihat riwayat peminjaman aset
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {selectedAssetForLoan && (
                      <div className="bg-slate-800 p-3 rounded-lg mb-4">
                        <p className="text-white font-medium">{selectedAssetForLoan.code} - {selectedAssetForLoan.name}</p>
                      </div>
                    )}
                    {assetLoans.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">Belum ada riwayat peminjaman</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-400">Peminjam</TableHead>
                            <TableHead className="text-slate-400">Tgl. Pinjam</TableHead>
                            <TableHead className="text-slate-400">Rencana Kembali</TableHead>
                            <TableHead className="text-slate-400">Tgl. Kembali</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetLoans.map((loan) => (
                            <TableRow key={loan.id} className="border-slate-800">
                              <TableCell className="text-white">
                                <p className="font-medium">{loan.borrowerName}</p>
                                {loan.borrowerPhone && <p className="text-xs text-slate-500">{loan.borrowerPhone}</p>}
                              </TableCell>
                              <TableCell className="text-slate-300 text-sm">{new Date(loan.loanDate).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-slate-300 text-sm">{new Date(loan.expectedReturnDate).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-slate-300 text-sm">
                                {loan.actualReturnDate ? new Date(loan.actualReturnDate).toLocaleDateString('id-ID') : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  loan.status === 'Dipinjam' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                  'bg-green-500/20 text-green-400 border-green-500/50'
                                }>
                                  {loan.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowLoanHistoryDialog(false); setAssetLoans([]); setSelectedAssetForLoan(null); }}>Tutup</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Settings - Admin Only */}
          {activeMenu === 'settings' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Company Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo Upload Section */}
                  <div className="space-y-2">
                    <Label>Logo Perusahaan</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg border border-slate-600 bg-slate-800 flex items-center justify-center overflow-hidden">
                        {(logoPreview || companyForm.logo) ? (
                          <img 
                            src={logoPreview || companyForm.logo} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-500" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          id="logo-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Check file size (max 2MB)
                              if (file.size > 2 * 1024 * 1024) {
                                toast({ title: 'Error', description: 'Logo terlalu besar (maks 2MB)', variant: 'destructive' });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                setLogoPreview(base64);
                                setCompanyForm({ ...companyForm, logo: base64 });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        {(logoPreview || companyForm.logo) && (
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              setLogoPreview(null);
                              setCompanyForm({ ...companyForm, logo: '' });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input className="input-neon" value={companyForm.name || ''} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input className="input-neon" value={companyForm.phone || ''} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea className="input-neon" value={companyForm.address || ''} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input className="input-neon" value={companyForm.bankName || ''} onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Account</Label>
                      <Input className="input-neon" value={companyForm.bankAccount || ''} onChange={(e) => setCompanyForm({ ...companyForm, bankAccount: e.target.value })} />
                    </div>
                  </div>
                  <Button className="btn-neon" disabled={isVisitor} onClick={async () => {
                    await fetch('/api/company', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(companyForm),
                      credentials: 'include',
                    });
                    toast({ title: 'Success', description: 'Company data saved' });
                    loadCompany();
                  }}>
                    Save Company Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">{isVisitor ? 'Visitor' : user?.name}</p>
                      <p className="text-sm text-slate-400">{isVisitor ? 'View Only Mode' : user?.email}</p>
                      {!isVisitor && <Badge className="mt-1">{user?.role}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Management - Admin Only */}
              {user?.role === 'admin' && (
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">User Management</CardTitle>
                      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                        <DialogTrigger asChild>
                          <Button className="btn-neon" disabled={isVisitor} onClick={() => { setEditingId(null); setUserForm({ role: 'staff' }); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">{editingId ? 'Edit' : 'Add'} User</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              {editingId ? 'Ubah data pengguna yang sudah ada' : 'Tambahkan pengguna baru ke sistem'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input className="input-neon" value={userForm.name || ''} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input type="email" className="input-neon" value={userForm.email || ''} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Password {editingId && '(leave blank to keep current)'}</Label>
                              <Input type="password" className="input-neon" value={userForm.password || ''} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select value={userForm.role || 'staff'} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
                            <Button className="btn-neon" onClick={saveUser}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">Name</TableHead>
                          <TableHead className="text-slate-400">Email</TableHead>
                          <TableHead className="text-slate-400">Role</TableHead>
                          <TableHead className="text-slate-400">Created</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} className="border-slate-800">
                            <TableCell className="text-white">{u.name}</TableCell>
                            <TableCell className="text-slate-400">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : u.role === 'staff' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">{new Date(u.createdAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => { setEditingId(u.id); setUserForm(u); setShowUserDialog(true); }}>
                                <Edit className="w-4 h-4 text-amber-400" />
                              </Button>
                              <Button size="sm" variant="ghost" disabled={isVisitor} onClick={() => deleteUser(u.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Backup & Restore - Admin Only */}
              {user?.role === 'admin' && (
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Database className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Backup & Restore Data</CardTitle>
                        <CardDescription className="text-slate-400">Simpan dan kembalikan data sistem</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Info Alert */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-400 font-medium">Penting!</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Backup akan menyimpan semua data (Projects, RAB, Transactions, Items, Clients, Assets, Journals, Company).
                          Gunakan fitur Restore untuk mengembalikan data dari file backup.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Backup Section */}
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Download className="w-5 h-5 text-cyan-400" />
                          <h4 className="text-white font-medium">Backup Data</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                          Download semua data sistem dalam format JSON untuk penyimpanan lokal.
                        </p>
                        <Button
                          className="w-full btn-neon"
                          onClick={async () => {
                            try {
                              toast({ title: 'Memproses...', description: 'Mengumpulkan data untuk backup' });

                              const res = await fetch('/api/backup', { credentials: 'include' });
                              if (!res.ok) throw new Error('Failed to create backup');

                              const backupData = await res.json();

                              // Create and download file
                              const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `backup-neon-erp-${new Date().toISOString().split('T')[0]}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              toast({ title: 'Success', description: 'Backup berhasil didownload' });
                            } catch (error: any) {
                              toast({ title: 'Error', description: error.message || 'Gagal membuat backup', variant: 'destructive' });
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Backup
                        </Button>
                      </div>

                      {/* Restore Section */}
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-5 h-5 text-purple-400" />
                          <h4 className="text-white font-medium">Restore Data</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                          Upload file backup JSON untuk mengembalikan data sistem.
                        </p>
                        <div className="space-y-3">
                          <Input
                            type="file"
                            accept=".json"
                            id="restore-file"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              // Create restore function with chunked approach
                              const restoreWithChunks = async (backupData: any) => {
                                const phases = ['clear', 'core', 'projects', 'transactions', 'assets', 'other'];
                                const results: any = {};
                                
                                for (const phase of phases) {
                                  try {
                                    toast({ title: `Restore: ${phase}...`, description: `Memproses fase ${phase}...` });
                                    
                                    const res = await fetch(`/api/backup?phase=${phase}`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(backupData),
                                      credentials: 'include',
                                    });

                                    if (!res.ok) {
                                      const err = await res.json();
                                      throw new Error(err.error || `Failed at phase ${phase}`);
                                    }
                                    
                                    const result = await res.json();
                                    Object.assign(results, result.results);
                                    console.log(`Phase ${phase} completed:`, result.results);
                                  } catch (err: any) {
                                    console.error(`Phase ${phase} error:`, err);
                                    throw err;
                                  }
                                }
                                
                                return results;
                              };

                              try {
                                // Validate file
                                if (!file.name.endsWith('.json')) {
                                  throw new Error('File harus berformat .json');
                                }

                                const text = await file.text();
                                
                                // Validate JSON
                                let backupData;
                                try {
                                  backupData = JSON.parse(text);
                                } catch (jsonError) {
                                  throw new Error('File JSON tidak valid - pastikan file backup tidak corrupted');
                                }

                                if (!backupData.data) {
                                  throw new Error('Format file backup tidak valid - missing "data" property');
                                }

                                // Show backup info
                                const infoMsg = `Backup Info:
Version: ${backupData.version || 'Unknown'}
Date: ${backupData.backupDate ? new Date(backupData.backupDate).toLocaleString('id-ID') : 'Unknown'}
Created by: ${backupData.createdBy || 'Unknown'}

Projects: ${backupData.summary?.projects || 0}
Clients: ${backupData.summary?.clients || 0}
Items: ${backupData.summary?.items || 0}
Transactions: ${backupData.summary?.transactions || 0}
Assets: ${backupData.summary?.assets || 0}

⚠️ Proses restore akan dilakukan bertahap.
Lanjutkan restore?`;

                                // Confirm restore
                                if (!confirm(infoMsg)) {
                                  return;
                                }

                                // Run chunked restore
                                const finalResults = await restoreWithChunks(backupData);

                                toast({ 
                                  title: '✅ Restore Berhasil!', 
                                  description: `Data berhasil di-restore:
• ${finalResults.projects || 0} projects
• ${finalResults.items || 0} items  
• ${finalResults.clients || 0} clients
• ${finalResults.transactions || 0} transactions
• ${finalResults.assets || 0} assets
• ${finalResults.rabItems || 0} RAB items` 
                                });

                                // Reload data
                                setTimeout(() => {
                                  loadInitialData();
                                }, 1000);

                              } catch (error: any) {
                                console.error('Restore error:', error);
                                toast({ 
                                  title: '❌ Gagal Restore', 
                                  description: error.message || 'Gagal restore data', 
                                  variant: 'destructive' 
                                });
                              }

                              // Reset file input
                              e.target.value = '';
                            }}
                          />
                          <Button
                            variant="outline"
                            className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                            onClick={() => document.getElementById('restore-file')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload & Restore
                          </Button>
                        </div>
                        <p className="text-xs text-red-400 mt-3">
                          ⚠️ Data yang ada akan diganti dengan data dari backup!
                        </p>
                      </div>
                    </div>

                    {/* Backup Info */}
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-medium text-white">Informasi Backup</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-slate-700/30 rounded p-2">
                          <p className="text-lg font-bold text-cyan-400">{projects.length}</p>
                          <p className="text-xs text-slate-400">Projects</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-2">
                          <p className="text-lg font-bold text-purple-400">{items.length}</p>
                          <p className="text-xs text-slate-400">Items</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-2">
                          <p className="text-lg font-bold text-green-400">{clients.length}</p>
                          <p className="text-xs text-slate-400">Clients</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-2">
                          <p className="text-lg font-bold text-amber-400">{assets.length}</p>
                          <p className="text-xs text-slate-400">Assets</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clear All Data - Admin Only */}
              {user?.role === 'admin' && (
                <Card className="glass-card border-red-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Hapus Semua Data</CardTitle>
                        <CardDescription className="text-slate-400">Hapus semua data sistem (tidak dapat dibatalkan)</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Warning Alert */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-400 font-medium">Peringatan!</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Tindakan ini akan menghapus SEMUA data secara permanen dan tidak dapat dibatalkan. 
                            Pastikan Anda sudah melakukan backup data sebelum melanjutkan.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data yang akan dihapus */}
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-medium text-white mb-3">Data yang akan dihapus:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">Projects ({projects.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-300">Master Items ({items.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">Clients ({clients.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-300">Assets ({assets.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-pink-400" />
                          <span className="text-slate-300">Transactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300">RAB Items</span>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Ketik "HAPUS SEMUA DATA" untuk konfirmasi:</Label>
                      <Input
                        id="confirm-delete-input"
                        className="input-neon bg-red-500/5 border-red-500/30"
                        placeholder="HAPUS SEMUA DATA"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600"
                        onClick={() => {
                          const input = document.getElementById('confirm-delete-input') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          const input = document.getElementById('confirm-delete-input') as HTMLInputElement;
                          const confirmValue = (input?.value || '').trim().toUpperCase();
                          
                          if (confirmValue !== 'HAPUS SEMUA DATA') {
                            toast({ 
                              title: 'Konfirmasi Gagal', 
                              description: 'Ketik "HAPUS SEMUA DATA" dengan benar untuk melanjutkan', 
                              variant: 'destructive' 
                            });
                            return;
                          }

                          if (!confirm('PERINGATAN: Semua data akan dihapus secara permanen. Lanjutkan?')) {
                            return;
                          }

                          try {
                            toast({ title: 'Memproses...', description: 'Menghapus semua data...' });

                            const res = await fetch('/api/clear-all-data', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ confirmDelete: 'HAPUS SEMUA DATA' }),
                              credentials: 'include',
                            });

                            if (!res.ok) {
                              const data = await res.json();
                              throw new Error(data.error || 'Failed to clear data');
                            }

                            const result = await res.json();
                            toast({ 
                              title: 'Success', 
                              description: `Data berhasil dihapus: ${result.results?.projects || 0} projects, ${result.results?.items || 0} items, ${result.results?.clients || 0} clients` 
                            });

                            // Clear input
                            if (input) input.value = '';

                            // Reload data
                            loadInitialData();
                          } catch (error: any) {
                            toast({ title: 'Error', description: error.message || 'Gagal menghapus data', variant: 'destructive' });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Semua Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Settings PIN - Admin Only */}
              {user?.role === 'admin' && (
                <Card className="glass-card border-cyan-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">PIN Akses Settings</CardTitle>
                        <CardDescription className="text-slate-400">Ubah PIN untuk mengakses menu Settings</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">PIN diperlukan untuk mengakses menu Settings</p>
                        <p className="text-xs text-slate-500 mt-1">PIN saat ini: ••••••</p>
                      </div>
                      <Button 
                        onClick={() => setShowChangePinDialog(true)}
                        className="btn-neon"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Ubah PIN
                      </Button>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-cyan-400 font-medium">Info</p>
                          <p className="text-xs text-slate-400 mt-1">
                            PIN default adalah <span className="text-cyan-400 font-mono">123456</span>. 
                            Disarankan untuk mengubah PIN setelah login pertama kali untuk keamanan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Settings Access Denied for non-admin */}
          {activeMenu === 'settings' && user?.role !== 'admin' && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Settings className="w-16 h-16 text-slate-600 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400 mb-4">You don't have permission to access Settings.</p>
              <p className="text-sm text-slate-500">Only administrators can access this section.</p>
              <Button className="btn-neon mt-4" onClick={() => setActiveMenu('dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update Progress</DialogTitle>
            <DialogDescription className="text-slate-400">
              Perbarui progress pengerjaan project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Progress (%)</Label>
              <Input type="number" min="0" max="100" className="input-neon" value={progressForm.progress || 0} onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea className="input-neon" value={progressForm.note || ''} onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>Cancel</Button>
            <Button className="btn-neon" disabled={isVisitor} onClick={updateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
