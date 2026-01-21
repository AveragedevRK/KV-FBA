import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, X, User as UserIcon, Mail, Shield } from 'lucide-react';
import { createPortal } from 'react-dom';

interface UsersPageProps {
  onNavigate?: (view: string) => void;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Huss', email: 'hus@xprofulfill.com', role: 'Admin' },
  { id: '2', name: 'Jay', email: 'jagjit@xprofulfill.com', role: 'Admin' },
  { id: '3', name: 'staff', email: 'staff@xprofulfill.com', role: 'Staff' },
  { id: '4', name: 'KV Pakistan', email: 'pakTeam@kv.com', role: 'Admin' },
];

const UsersPage: React.FC<UsersPageProps> = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!newUserName.trim()) newErrors.name = 'Name is required';
    if (!newUserEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = () => {
    if (validate()) {
      const newUser: User = {
        id: crypto.randomUUID(),
        name: newUserName,
        email: newUserEmail,
        role: 'Staff', // Default role for now
      };
      setUsers([...users, newUser]);
      setIsModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setErrors({});
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setErrors({});
  };

  const inputStyle = (hasError: boolean) => `
    w-full h-[40px] bg-[var(--bg-2)] border-b px-4 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
    transition-all duration-200 outline-none
    ${hasError
      ? 'border-b-2 border-[#fa4d56] outline-[#fa4d56]'
      : 'border-[var(--border-2)] focus:outline focus:outline-2 focus:outline-offset-[-2px] focus:outline-white'}
  `;
  const labelStyle = "text-[12px] leading-[1.3] text-[var(--text-secondary)] mb-2 block";
  const errorTextStyle = "text-[12px] text-[#fa4d56] mt-1 font-normal";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-0)] relative animate-fade-in-fast">
      
      {/* Header */}
      <div className="px-4 md:px-6 pt-6 pb-4 shrink-0 flex flex-wrap gap-4 justify-between items-center">
        <div>
           <h1 className="text-[24px] font-semibold text-[var(--text-primary)] leading-tight">Users</h1>
           <p className="text-[13px] text-[var(--text-tertiary)] mt-1">Manage access and roles for your organization.</p>
        </div>
        
        <button 
            onClick={() => setIsModalOpen(true)}
            className="h-[40px] px-4 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[14px] font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 shadow-lg shadow-[#0f62fe]/10 hover:shadow-[#0f62fe]/20 rounded-md"
        >
            <Plus size={18} />
            Add User
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 px-4 md:px-6 pb-4 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-[var(--border-1)] shadow-sm bg-[var(--bg-1)]">
            <div className="overflow-x-auto h-full">
                <div className="min-w-[600px]">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border-1)] bg-[var(--bg-2)] text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider sticky top-0 z-10">
                        <div className="col-span-4 flex items-center gap-2">
                           Name
                        </div>
                        <div className="col-span-5 flex items-center gap-2">
                           Email
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                           Role
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-[var(--border-1)]">
                        {users.map((user, index) => (
                            <div 
                                key={user.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[var(--bg-2)] transition-colors duration-150 group animate-slide-up-fade"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="col-span-4 flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-[var(--bg-2)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-2)]">
                                       <UserIcon size={14} />
                                   </div>
                                   <span className="font-medium text-[var(--text-primary)] text-[14px]">{user.name}</span>
                                </div>
                                <div className="col-span-5 flex items-center gap-2 text-[var(--text-secondary)] text-[14px]">
                                   <Mail size={14} className="text-[var(--text-tertiary)]" />
                                   {user.email}
                                </div>
                                <div className="col-span-3 flex items-center">
                                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${user.role === 'Admin' ? 'bg-[#0f62fe]/10 text-[#0f62fe] border-[#0f62fe]/30 blue-text-readable' : 'bg-[var(--bg-2)] text-[var(--text-secondary)] border-[var(--border-2)]'}`}>
                                      <Shield size={12} />
                                      {user.role}
                                   </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-[var(--overlay)] backdrop-blur-[2px] animate-fade-in-fast">
          <div className="bg-[var(--bg-1)] w-full max-w-[480px] shadow-2xl relative z-[var(--z-modal)] animate-modal-enter flex flex-col rounded-lg overflow-hidden border border-[var(--border-1)]">
             
             {/* Modal Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-1)] bg-[var(--bg-1)]">
                <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Add User</h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 hover:bg-[var(--bg-2)] rounded"
                >
                  <X size={20} />
                </button>
             </div>

             {/* Modal Body */}
             <div className="p-6 space-y-6">
                <div>
                    <label className={labelStyle}>Name <span className="text-[#fa4d56]">*</span></label>
                    <input 
                        type="text" 
                        value={newUserName}
                        onChange={(e) => { setNewUserName(e.target.value); if(errors.name) setErrors({...errors, name: undefined}); }}
                        placeholder="e.g. John Doe"
                        className={inputStyle(!!errors.name)}
                    />
                    {errors.name && <p className={errorTextStyle}>{errors.name}</p>}
                </div>
                <div>
                    <label className={labelStyle}>Email <span className="text-[#fa4d56]">*</span></label>
                    <input 
                        type="email" 
                        value={newUserEmail}
                        onChange={(e) => { setNewUserEmail(e.target.value); if(errors.email) setErrors({...errors, email: undefined}); }}
                        placeholder="e.g. john@example.com"
                        className={inputStyle(!!errors.email)}
                    />
                    {errors.email && <p className={errorTextStyle}>{errors.email}</p>}
                </div>
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 border-t border-[var(--border-1)] bg-[var(--bg-1)] flex justify-end gap-3">
                <button 
                    onClick={handleCloseModal}
                    className="h-[40px] px-6 bg-[var(--bg-2)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded font-medium text-[14px] transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleAddUser}
                    className="h-[40px] px-6 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded font-medium text-[14px] transition-colors shadow-lg shadow-[#0f62fe]/20"
                >
                    Save
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default UsersPage;