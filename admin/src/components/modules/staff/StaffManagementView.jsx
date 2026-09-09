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
  CheckCircle
} from 'lucide-react';

export default function StaffManagementView() {
  const { staff, addStaffMember, updateStaffMember } = useCafe();
  
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Cashier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
    setShift('Morning (07:00 AM - 03:00 PM)');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setName(s.name);
    setRole(s.role);
    setEmail(s.email);
    setPhone(s.phone);
    setShift(s.shift || 'Morning (07:00 AM - 03:00 PM)');
    setAvatar(s.avatar);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    if (editingStaff) {
      updateStaffMember(editingStaff.id, { name, role, email, phone, shift, avatar });
    } else {
      addStaffMember({ name, role, email, phone, shift, avatar });
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

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <span className="text-gray-400 text-[11px]">Joined: {emp.joiningDate}</span>
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="text-[#DD5903] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
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
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStaff}>
                {editingStaff ? 'Save Changes' : 'Create Staff Account'}
              </Button>
            </>
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
