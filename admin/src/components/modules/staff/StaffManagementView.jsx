import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import { ROLE_PERMISSIONS } from '../../../context/AuthContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit2,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export default function StaffManagementView() {
  const { staff, addStaffMember, updateStaffMember, deleteStaffMember } = useCafe();
  
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Cashier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('admin123');
  const [pin, setPin] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [shift, setShift] = useState('Morning (07:00 AM - 03:00 PM)');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const filteredStaff = staff.filter((s) =>
    roleFilter === 'all' ? true : s.role.toLowerCase() === roleFilter.toLowerCase()
  );

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setRole('Cashier');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setPin('1234');
    setShowPassword(false);
    setShift('Morning (07:00 AM - 03:00 PM)');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setName(s.name);
    setRole(s.role);
    setEmail(s.email);
    setPhone(s.phone || '');
    setPassword(s.password || (s.role === 'Admin' ? 'admin123' : '123456'));
    setPin(s.pin || (s.role === 'Admin' ? '1234' : '0000'));
    setShowPassword(false);
    setShift(s.shift || 'Morning (07:00 AM - 03:00 PM)');
    setAvatar(s.avatar);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const payload = {
      name,
      role,
      email,
      phone,
      shift,
      avatar,
      password: password.trim() || (role === 'Admin' ? 'admin123' : '123456'),
      pin: pin.trim() || '1234'
    };

    if (editingStaff) {
      updateStaffMember(editingStaff.id, payload);
    } else {
      addStaffMember(payload);
    }
    setIsModalOpen(false);
  };

  const toggleStaffStatus = (staffId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    updateStaffMember(staffId, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Staff & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage employees, define security roles (Admin, Manager, Cashier, Kitchen, Waiter), and shifts.
          </p>
        </div>

        <Button onClick={handleOpenAdd} size="sm" icon={Plus}>
          Add Employee
        </Button>
      </div>

      {/* Role Filter Tabs */}
      <Card className="p-3.5 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {['all', 'admin', 'manager', 'cashier', 'kitchen staff', 'waiter'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
              roleFilter === r
                ? 'bg-[#DD5903] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {r === 'all' ? `All Employees (${staff.length})` : r}
          </button>
        ))}
      </Card>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((emp) => {
          const permissions = ROLE_PERMISSIONS[emp.role] || [];

          return (
            <Card key={emp.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{emp.name}</h4>
                      <span className="text-xs font-bold text-[#DD5903] block uppercase tracking-wider">
                        {emp.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStaffStatus(emp.id, emp.status)}
                    className="cursor-pointer"
                  >
                    <Badge variant={emp.status === 'Active' ? 'success' : 'default'} dot>
                      {emp.status}
                    </Badge>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{emp.shift || 'General Shift'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>PIN: {emp.pin || (emp.role === 'Admin' ? '1234' : '0000')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                      <Lock className="w-3 h-3" />
                      <span>Pass: ••••••••</span>
                    </div>
                  </div>
                </div>

                {/* Module Permissions Access */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                    Authorized Module Access ({permissions.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {permissions.slice(0, 5).map((perm, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-700 dark:text-gray-300 capitalize">
                        {perm}
                      </span>
                    ))}
                    {permissions.length > 5 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[10px] text-[#DD5903] font-bold">
                        +{permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-between items-center gap-2 text-xs">
                <span className="text-gray-400 text-[11px]">Joined: {emp.joiningDate || '2024-01-01'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(emp)}
                    className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#DD5903]" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStaffMember(emp.id)}
                    className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title={`Remove ${emp.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ================= ADD / EDIT EMPLOYEE MODAL ================= */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingStaff ? `Edit Employee: ${editingStaff.name}` : 'Register New Staff Member'}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              {editingStaff ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  type="button"
                  onClick={() => {
                    deleteStaffMember(editingStaff.id);
                    setIsModalOpen(false);
                  }}
                >
                  Delete Staff
                </Button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveStaff}>
                  {editingStaff ? 'Save Changes' : 'Create Staff Account'}
                </Button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Kim"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  System Role (RBAC) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Manager">Manager (Operations & Reports)</option>
                  <option value="Cashier">Cashier (POS & Billing)</option>
                  <option value="Kitchen Staff">Kitchen Staff (KDS Display)</option>
                  <option value="Waiter">Waiter (Tables & Orders)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="david@dinenos.com"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99000 88776"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Login Password & PIN Security Box */}
            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <Lock className="w-4 h-4 text-[#DD5903]" />
                <span>Login Credentials & Terminal PIN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Login Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. admin123"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 text-gray-900 dark:text-white outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Used for Email + Password login</span>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    4-Digit Quick PIN *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="e.g. 1234"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 text-gray-900 dark:text-white outline-none text-xs font-mono font-bold tracking-widest"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Used for 1-click Quick PIN terminal login</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Assigned Shift Schedule
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              >
                <option value="Morning (07:00 AM - 03:00 PM)">Morning (07:00 AM - 03:00 PM)</option>
                <option value="Evening (03:00 PM - 11:00 PM)">Evening (03:00 PM - 11:00 PM)</option>
                <option value="Full Day (08:00 AM - 08:00 PM)">Full Day (08:00 AM - 08:00 PM)</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
