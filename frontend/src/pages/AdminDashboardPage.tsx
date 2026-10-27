import React, { useState, useEffect } from 'react';
import {
  Shield, Building2, Users, Calendar, DollarSign,
  Activity, Plus, Copy, CheckCircle2, AlertCircle, Ban,
  Key, RefreshCw, ChevronRight, Search, FileText, Check
} from 'lucide-react';
import { User, Turf, Booking, AdminStats, AuditLogItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  type Section = 'Dashboard' | 'Turf Owners' | 'Manage Turfs' | 'Customers' | 'All Bookings' | 'Payments' | 'Reports' | 'Settings';
  const [activeSection, setActiveSection] = useState<Section>('Dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Owner Modal
  const [createOwnerModalOpen, setCreateOwnerModalOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [assignedTurfIds, setAssignedTurfIds] = useState<number[]>([]);
  const [ownerStatus, setOwnerStatus] = useState('ACTIVE');
  const [creatingOwner, setCreatingOwner] = useState(false);
  const [createSuccessData, setCreateSuccessData] = useState<{ owner: User; temporary_password?: string; instructions?: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create Turf Modal
  const [createTurfModalOpen, setCreateTurfModalOpen] = useState(false);
  const [newTurfName, setNewTurfName] = useState('');
  const [newTurfLocation, setNewTurfLocation] = useState('');
  const [newTurfCity, setNewTurfCity] = useState('Bangalore');
  const [newTurfBasePrice, setNewTurfBasePrice] = useState('1200');
  const [newTurfImage, setNewTurfImage] = useState('/images/turf-greenfield.jpg');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, ow, tr, cu, bk, py, lg] = await Promise.all([
        api.getAdminStats(),
        api.getAdminOwners(),
        api.getAdminTurfs(),
        api.getAdminCustomers(),
        api.getAdminAllBookings(),
        api.getAdminPayments(),
        api.getAdminAuditLogs(),
      ]);
      setStats(st);
      setOwners(ow);
      setTurfs(tr);
      setCustomers(cu);
      setBookings(bk);
      setPayments(py);
      setAuditLogs(lg);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOwner(true);
    setErrorMessage('');
    try {
      const res = await api.createTurfOwner({
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        assigned_turf_ids: assignedTurfIds,
        status: ownerStatus,
      });
      setCreateSuccessData(res);
      // Reload owners list
      const updatedOwners = await api.getAdminOwners();
      setOwners(updatedOwners);
      // Also update stats
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create turf owner.');
    } finally {
      setCreatingOwner(false);
    }
  };

  const handleCreateTurf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = newTurfName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      await api.createAdminTurf({
        name: newTurfName,
        slug,
        location: newTurfLocation,
        city: newTurfCity,
        hourly_base_price: Number(newTurfBasePrice),
        main_image: newTurfImage,
        sports: ['Football', 'Box Cricket'],
        amenities: ['Floodlights', 'Changing Rooms', 'Parking'],
        is_active: true,
      });
      setCreateTurfModalOpen(false);
      setNewTurfName('');
      setNewTurfLocation('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create turf');
    }
  };

  const handleOwnerStatusToggle = async (ownerId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateOwnerStatus(ownerId, { status: nextStatus });
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update owner status');
    }
  };

  const handleResetOwnerPassword = async (ownerId: number) => {
    try {
      const res = await api.updateOwnerStatus(ownerId, { reset_password: true });
      alert(`Temporary password reset for ${res.owner.name}:\n\nNew Temporary Password: ${res.temporary_password}\n\nOwner will be forced to change this on next login.`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-card border border-gray-200">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-xs text-gray-500 mb-6">
            Only platform administrators are authorized to access the Super Admin control panel.
          </p>
          <a href="/login" className="w-full py-3 bg-[#166534] text-white font-bold text-xs rounded-xl block">
            Login as Admin
          </a>
        </div>
      </div>
    );
  }

  const sidebarItems: Section[] = [
    'Dashboard',
    'Turf Owners',
    'Manage Turfs',
    'Customers',
    'All Bookings',
    'Payments',
    'Reports',
    'Settings',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase tracking-wider">
                Platform Administrator
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">TurfHub Central Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Admin Control Center
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setCreateSuccessData(null);
                setOwnerName('');
                setOwnerEmail('');
                setOwnerPhone('');
                setAssignedTurfIds(turfs.length > 0 ? [turfs[0].id] : []);
                setCreateOwnerModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Turf Owner</span>
            </button>

            <button
              onClick={() => setCreateTurfModalOpen(true)}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Add New Turf</span>
            </button>
          </div>
        </div>

        {/* Layout with Sidebar Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="space-y-1 bg-white p-3 rounded-3xl border border-gray-200 shadow-soft h-fit">
            {sidebarItems.map(item => {
              const isActive = activeSection === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveSection(item)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-[#166534] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{item}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. DASHBOARD & STATS (Requirement #3) */}
            {activeSection === 'Dashboard' && (
              <div className="space-y-6">
                
                {/* 6 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Turf Owners</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{stats?.total_turf_owners || 0}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Admin created</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Customers</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{stats?.total_customers || 0}</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Registered users</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Turfs</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{stats?.total_turfs || 0}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Active venues</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bookings</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{stats?.total_bookings || 0}</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Processed slots</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Bookings</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats?.active_bookings || 0}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Upcoming matches</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
                    <span className="text-2xl font-black text-[#166534] mt-1 block">
                      ₹{stats?.total_revenue ? stats.total_revenue.toLocaleString() : 0}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium block mt-1">Across all facilities</span>
                  </div>
                </div>

                {/* Audit Logs Quick View */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Recent Platform Audit Logs</h3>
                    <button
                      onClick={() => setActiveSection('Reports')}
                      className="text-xs font-bold text-[#166534] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 text-xs">
                    {auditLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                            {log.action}
                          </span>
                          <span className="text-gray-800 font-medium">
                            {log.entity_type} #{log.entity_id}
                          </span>
                        </div>
                        <span className="text-gray-400 text-[11px]">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. TURF OWNERS MANAGEMENT (Requirement #3 Create Turf Owner & Management) */}
            {activeSection === 'Turf Owners' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Turf Owner Accounts</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Admins create turf owners, generate initial credentials, and assign facilities. Turf owners cannot register publicly.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCreateSuccessData(null);
                      setOwnerName('');
                      setOwnerEmail('');
                      setOwnerPhone('');
                      setAssignedTurfIds(turfs.length > 0 ? [turfs[0].id] : []);
                      setCreateOwnerModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Turf Owner</span>
                  </button>
                </div>

                {/* Table of Turf Owners */}
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">Owner Name</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Assigned Turfs</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Password State</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {owners.map((owner) => {
                        const isSuspended = owner.status === 'SUSPENDED';
                        return (
                          <tr key={owner.id} className="hover:bg-gray-50/70">
                            <td className="p-3 font-bold text-gray-900">{owner.name}</td>
                            <td className="p-3 text-gray-600">
                              <div>{owner.email}</div>
                              <div className="text-[10px] text-gray-400">{owner.phone || 'No phone'}</div>
                            </td>
                            <td className="p-3">
                              {owner.assigned_turfs && owner.assigned_turfs.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {owner.assigned_turfs.map(at => (
                                    <span key={at.id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {at.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  owner.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {owner.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {owner.must_change_password ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  First Login Pending
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                  Configured
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOwnerStatusToggle(owner.id, owner.status)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                    isSuspended
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                >
                                  {isSuspended ? 'Activate' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleResetOwnerPassword(owner.id)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  title="Reset to new temporary password"
                                >
                                  Reset Pass
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* 3. MANAGE TURFS */}
            {activeSection === 'Manage Turfs' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Platform Turf Facilities</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Active grounds open for customer bookings.</p>
                  </div>
                  <button
                    onClick={() => setCreateTurfModalOpen(true)}
                    className="px-4 py-2 bg-[#166534] text-white text-xs font-bold rounded-xl shadow"
                  >
                    + Add Turf
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turfs.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl border border-gray-200 flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={t.main_image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=300&q=80";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{t.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{t.location}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <span className="font-extrabold text-[#166534]">₹{t.hourly_base_price}/hr</span>
                          <span className="text-gray-400">★ {t.rating} ({t.review_count})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CUSTOMERS */}
            {activeSection === 'Customers' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Registered Customers</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Bookings Placed</th>
                        <th className="p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customers.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/70">
                          <td className="p-3 font-bold text-gray-900">{c.name}</td>
                          <td className="p-3 text-gray-600">{c.email}</td>
                          <td className="p-3 text-gray-600">{c.phone || 'N/A'}</td>
                          <td className="p-3 font-bold text-[#166534]">{c.booking_count}</td>
                          <td className="p-3 text-gray-400">{c.joined_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. ALL BOOKINGS */}
            {activeSection === 'All Bookings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">All Platform Bookings</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Turf</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Match Date</th>
                        <th className="p-3">Slot Time</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/70">
                          <td className="p-3 font-mono font-bold text-gray-800">{b.booking_id}</td>
                          <td className="p-3 font-semibold text-gray-900">{b.turf_name}</td>
                          <td className="p-3 text-gray-700">{b.customer_name}</td>
                          <td className="p-3 text-gray-700">{b.booking_date}</td>
                          <td className="p-3 text-gray-700">{b.start_time} - {b.end_time}</td>
                          <td className="p-3 font-bold text-gray-900">₹{b.total_amount}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#166534]">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. PAYMENTS */}
            {activeSection === 'Payments' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Payments & Gateway Transactions</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">Payment ID</th>
                        <th className="p-3">Turf</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Verified At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/70">
                          <td className="p-3 font-mono text-gray-700">{p.payment_id}</td>
                          <td className="p-3 font-semibold text-gray-900">{p.turf_name}</td>
                          <td className="p-3 text-gray-700">{p.customer_name}</td>
                          <td className="p-3 font-bold text-gray-900">₹{p.amount}</td>
                          <td className="p-3 text-gray-600">{p.payment_method}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">{p.verified_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. REPORTS & AUDIT LOGS */}
            {activeSection === 'Reports' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Security & Compliance Audit Trail</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Entity</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/70">
                          <td className="p-3 text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-3 font-bold text-gray-900">{log.action}</td>
                          <td className="p-3 text-gray-700">{log.user_name} ({log.user_email})</td>
                          <td className="p-3 text-gray-600">{log.entity_type} #{log.entity_id}</td>
                          <td className="p-3 font-mono text-[10px] text-gray-500 max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. SETTINGS */}
            {activeSection === 'Settings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Administrator System Settings</h2>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-2">
                  <p><strong>Admin:</strong> {user?.name} ({user?.email})</p>
                  <p><strong>RBAC Role:</strong> ADMIN (Superuser)</p>
                  <p><strong>Database:</strong> Relational with ACID Transaction locks</p>
                  <p><strong>Auth:</strong> JWT Bearer token authentication</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* CREATE TURF OWNER MODAL (Requirement #3) */}
      {/* ========================================================= */}
      {createOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Turf Owner Account</h3>
                <p className="text-xs text-gray-500 mt-0.5">Admin-only generation of owner login credentials.</p>
              </div>
              <button
                onClick={() => setCreateOwnerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* If credentials generated, display activation instructions (Requirement #3) */}
            {createSuccessData ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Account Created Successfully!
                  </div>
                  <p>
                    {createSuccessData.instructions || 'Share these temporary credentials with the turf owner. They will be forced to change their password on first login.'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Owner Name</span>
                    <strong className="text-gray-900">{createSuccessData.owner.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Email (Username)</span>
                    <strong className="text-gray-900">{createSuccessData.owner.email}</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Temporary Password</span>
                      <strong className="text-purple-700 font-mono text-sm">{createSuccessData.temporary_password}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createSuccessData.temporary_password || '')}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setCreateOwnerModalOpen(false)}
                  className="w-full py-3 bg-[#166534] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateOwner} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.patel@turfarena.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98450 11223"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assign Facilities (Turfs) *</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {turfs.map(t => {
                      const isChecked = assignedTurfIds.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer p-1 rounded hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setAssignedTurfIds(prev =>
                                isChecked ? prev.filter(id => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className="rounded text-[#166534] focus:ring-[#166534]"
                          />
                          <span>{t.name} ({t.location})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={ownerStatus}
                    onChange={(e) => setOwnerStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateOwnerModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingOwner}
                    className="flex-1 py-3 bg-[#166534] hover:bg-[#064E3B] text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {creatingOwner ? 'Generating Account...' : 'Create & Generate Credentials'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* CREATE TURF MODAL */}
      {createTurfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Turf Facility</h3>
            <form onSubmit={handleCreateTurf} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Turf Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velocity Arena"
                  value={newTurfName}
                  onChange={(e) => setNewTurfName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Area / Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bellandur, Bangalore"
                  value={newTurfLocation}
                  onChange={(e) => setNewTurfLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hourly Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newTurfBasePrice}
                  onChange={(e) => setNewTurfBasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Turf Image</label>
                <select
                  value={newTurfImage}
                  onChange={(e) => setNewTurfImage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                >
                  <option value="/images/turf-greenfield.jpg">GreenField Astro Turf (Night Lights)</option>
                  <option value="/images/turf-arena.jpg">Rooftop Multi-Sport Arena</option>
                  <option value="/images/hero-turf.jpg">Stadium Night Floodlit Pitch</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateTurfModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#166534] text-white font-bold rounded-xl shadow-md"
                >
                  Save Turf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
