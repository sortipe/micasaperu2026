import React from 'react';
import { CartItem, Package } from '../types';

interface CartPageProps {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ cart, onRemove, onUpdateQuantity, onCheckout, onContinueShopping }) => {
  const total = cart.reduce((acc, item) => acc + (item.package.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-[#091F4F] mb-2 uppercase tracking-tight">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8 font-medium">¡Explora nuestros planes y potencia tus ventas!</p>
        <button 
          onClick={onContinueShopping}
          className="bg-[#091F4F] text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
        >
          Ver Planes Disponibles
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 md:py-20 animate-fade-in">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-black text-[#091F4F] mb-8 tracking-tighter leading-none uppercase">Tu Carrito de Compras</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 transition-all hover:shadow-md">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-lg font-black text-[#091F4F] uppercase tracking-tight">{item.package.name}</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{item.package.description}</p>
                  <div className="mt-2 text-xs font-medium text-gray-500">
                    {item.package.propertyLimit} Propiedades • {item.package.durationDays} Días • {item.package.featuredLimit} Destacados
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100 text-gray-600 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-bold text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right min-w-[5rem]">
                    <div className="text-lg font-black text-[#091F4F]">S/ {(item.package.price * item.quantity).toFixed(2)}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-gray-400">S/ {item.package.price} c/u</div>
                    )}
                  </div>

                  <button 
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 sticky top-24">
              <h3 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-6">Resumen de Compra</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>IGV (18%)</span>
                  <span>S/ {(total * 0.18).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                  <span className="text-lg font-black text-[#091F4F] uppercase tracking-tight">Total</span>
                  <span className="text-3xl font-black text-[#e31e24] tracking-tighter">S/ {(total * 1.18).toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={onCheckout}
                className="w-full bg-[#e31e24] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#091F4F] transition-all shadow-lg hover:shadow-xl active:scale-95 mb-4"
              >
                Proceder al Pago
              </button>
              
              <button 
                onClick={onContinueShopping}
                className="w-full bg-white text-gray-500 border border-gray-200 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
              >
                Seguir Comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
