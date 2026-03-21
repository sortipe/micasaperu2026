
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string, role: string, password?: string, isRegistration?: boolean) => Promise<void>;
  onBack: () => void;
}

type RegistrationProfile = 'CLIENT' | 'AGENCY' | 'CONSTRUCTORA';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [selectedProfile, setSelectedProfile] = useState<RegistrationProfile>('CLIENT');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Validación especial para Jorge como Admin (hardcoded para demo/admin inicial)
      if (email.toLowerCase() === 'jorgejoelifzyape@gmail.com') {
        if (password !== '140601') {
          throw new Error('Contraseña de administrador incorrecta.');
        }
      }

      await onLogin(email, isLogin ? '' : selectedProfile, password, !isLogin);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al intentar acceder.');
    } finally {
      setIsLoading(false);
    }
  };

  const ProfileCard = ({ title, subtitle, icon, onClick }: { title: string, subtitle: string, icon: React.ReactNode, onClick: () => void }) => (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col items-center text-center p-8 w-full md:w-72 relative"
    >
      <div className="w-full h-1.5 bg-red-600 absolute top-0 left-0"></div>
      <div className="mb-6 text-gray-800 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{title}</h3>
      <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
    </div>
  );

  if (!isLogin && regStep === 'SELECT') {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-white animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 text-center tracking-tighter uppercase">¿Cómo quieres publicar?</h1>
        <p className="text-gray-500 text-lg mb-16 text-center font-medium">Selecciona tu perfil para brindarte la mejor experiencia.</p>
        
        <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl">
          <ProfileCard 
            title="Particular"
            subtitle="Soy dueño directo"
            onClick={() => { setSelectedProfile('CLIENT'); setRegStep('FORM'); }}
            icon={
              <svg className="w-16 h-16 text-blue-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 12l2 2 4-4" />
              </svg>
            }
          />
          <ProfileCard 
            title="Inmobiliaria"
            subtitle="Agente o Corredor"
            onClick={() => { setSelectedProfile('AGENCY'); setRegStep('FORM'); }}
            icon={
              <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </svg>
            }
          />
          <ProfileCard 
            title="Constructora"
            subtitle="Proyectos y preventas"
            onClick={() => { setSelectedProfile('CONSTRUCTORA'); setRegStep('FORM'); }}
            icon={
              <svg className="w-16 h-16 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="10" x2="6" y2="14" />
                <line x1="18" y1="10" x2="18" y2="14" />
              </svg>
            }
          />
        </div>

        <button 
          onClick={() => setIsLogin(true)}
          className="mt-12 text-sm font-black text-gray-400 hover:text-red-600 transition-colors uppercase tracking-widest"
        >
          ¿Ya tienes cuenta? Inicia sesión aquí
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-12 border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-50">
            {isLoading ? (
               <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            {isLogin ? '¡Bienvenido!' : 'Crea tu Cuenta'}
          </h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-widest">
            {isLogin ? 'Ingresa tus credenciales para continuar.' : `Registrándote como ${selectedProfile}`}
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-600 p-5 rounded-2xl animate-bounce-in flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-red-900 text-xs font-black uppercase tracking-tight leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              disabled={isLoading}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-gray-300 disabled:opacity-50"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
            <div className="relative group">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                disabled={isLoading}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all pr-14 placeholder:text-gray-300 disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-white shadow-sm"
              >
                {showPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-100 hover:bg-blue-900 transition-all uppercase text-xs tracking-[0.2em] disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verificando...</span>
              </>
            ) : (
              <span>{isLogin ? 'Entrar a Mi Cuenta' : 'Completar Registro'}</span>
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <button 
            onClick={() => {
                if (!isLogin) {
                  setRegStep('SELECT');
                } else {
                  setIsLogin(false);
                  setRegStep('SELECT');
                }
                setError('');
                setShowPassword(false);
            }}
            className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '← Volver a elegir perfil'}
          </button>
          <div className="pt-2">
            <button 
              onClick={onBack}
              className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
