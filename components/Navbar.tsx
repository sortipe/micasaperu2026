import React, { useState } from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (view: 'HOME' | 'ADMIN' | 'DETAILS' | 'SEARCH' | 'DASHBOARD' | 'PRICING' | 'AUTH' | 'COMPLAINTS_BOOK' | 'CART') => void;
  currentView: string;
  logo?: string | null;
  cartCount?: number;
  isSupabaseConnected?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, onNavigate, currentView, logo, cartCount = 0, isSupabaseConnected = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'ADMINISTRADOR';

  const navLinks = [
    { id: 'HOME', label: 'Inicio' },
    { id: 'SEARCH', label: 'Buscador' }
  ];

  const handleLinkClick = (id: any) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const handlePublishClick = () => {
    if (!user) {
      onNavigate('AUTH');
    } else {
      onNavigate('DASHBOARD');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-[#091F4F] border-b border-white/10 sticky top-0 z-[5000] shadow-xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center gap-4">
            <div 
              className="cursor-pointer flex items-center hover:scale-105 transition-transform h-full"
              onClick={() => onNavigate('HOME')}
            >
              {logo ? (
                <div className="h-10 md:h-12 flex items-center animate-fade-in">
                  <img 
                    src={logo} 
                    alt="App Logo" 
                    className="h-full w-auto object-contain max-w-[180px]" 
                  />
                </div>
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12" />
              )}
            </div>
            {isSupabaseConnected && user?.role === 'ADMINISTRADOR' && (
              <div className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full animate-fade-in">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Supabase OK</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)} 
                  className={`${currentView === link.id ? 'text-white border-b-2 border-red-500' : 'text-blue-100 hover:text-white'} font-black uppercase text-[11px] tracking-widest transition-all py-1`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-2"></div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePublishClick}
                className="bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-[#091F4F] transition-all"
              >
                + Publicar
              </button>

              {user ? (
                <div className="flex items-center space-x-4 pl-2 border-l border-white/10">
                  <div className="text-right cursor-pointer group" onClick={() => onNavigate('DASHBOARD')}>
                    <p className="text-[11px] font-black text-white leading-none mb-1 group-hover:text-red-400 transition-colors">{user.name}</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] flex items-center justify-end text-red-400">
                      {isAdmin ? 'ADMINISTRADOR' : 'PANEL CONTROL'}
                    </p>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => onNavigate('DASHBOARD')}>
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="relative w-11 h-11 rounded-2xl border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform object-cover" alt="User" />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('AUTH')}
                  className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-900/20"
                >
                  Ingresar
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[6000] lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-[#091F4F]/80 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl p-8 flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-8">
               {logo ? (
                 <img src={logo} alt="App Logo" className="h-8 w-auto object-contain max-w-[140px] animate-fade-in" />
               ) : (
                 <div className="w-10 h-10" />
               )}
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-xl">
                 <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>

            {/* User Profile in Mobile Menu */}
            <div className="mb-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              {user ? (
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleLinkClick('DASHBOARD')}>
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-14 h-14 rounded-2xl border-2 border-white shadow-md object-cover" alt="User" />
                  <div>
                    <p className="text-sm font-black text-[#091F4F] leading-none mb-1">{user.name}</p>
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Ver mi panel</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">¿Ya tienes cuenta?</p>
                  <button 
                    onClick={() => handleLinkClick('AUTH')}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-all ${currentView === link.id ? 'bg-[#091F4F] text-white shadow-xl' : 'bg-gray-50 text-slate-600 hover:bg-gray-100'}`}
                >
                  <span className="font-black uppercase text-[11px] tracking-widest">{link.label}</span>
                </button>
              ))}
              
              <button 
                onClick={handlePublishClick}
                className="flex items-center justify-center gap-4 p-5 rounded-[1.5rem] bg-red-50 text-red-600 border border-red-100 mt-4 transition-all"
              >
                <span className="font-black uppercase text-[11px] tracking-widest">+ Publicar Inmueble</span>
              </button>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100 text-center">
               <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">MICASAPERU © 2025</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;