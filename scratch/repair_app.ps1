
$path = 'App.tsx'
$content = [System.IO.File]::ReadAllText($path)

$replacement = @"
                  if (finalPlanType === 'SUPER_FEATURED') {
                    if ((updatedProfile.superFeaturedRemaining || 0) > 0) updatedProfile.superFeaturedRemaining!--;
                  } else if (finalPlanType === 'FEATURED') {
                    if ((updatedProfile.featuredRemaining || 0) > 0) updatedProfile.featuredRemaining!--;
                  } else {
                    if ((updatedProfile.propertiesRemaining || 0) > 0) updatedProfile.propertiesRemaining!--;
                  }

                  const { error: profileError } = await supabase.from('profiles').update({
                    propertiesRemaining: updatedProfile.propertiesRemaining,
                    featuredRemaining: updatedProfile.featuredRemaining,
                    superFeaturedRemaining: updatedProfile.superFeaturedRemaining
                  }).eq('id', currentUser.id);
                  
                  if (profileError) {
                    console.error("Error updating credits on publish:", profileError);
                  } else {
                    setCurrentUser(updatedProfile);
                  }
                }

                const { error } = await supabase.from('properties').insert({
                    ...dbData,
                    planType: finalPlanType,
                    publishedAt: finalPublishedAt,
                    expiresAt: finalExpiresAt,
                    agentId: currentUser?.id
                }); 
                
                if (error) {
                  console.error("Supabase insert error details:", error);
                  showToast(`Error al subir inmueble: ${error.message}`, "ERROR");
                  throw error; 
                }

                await fetchProperties(); 
                showToast("Inmueble publicado con éxito", "SUCCESS");
                setView('DASHBOARD'); 
              }} 
              onUpdate={async p => { 
                const { 
                  agentName, agentAvatar, agentWhatsapp, profiles, 
                  constructionArea,
                  ...cleanP 
                } = p as any;

                const dbData = {
                  ...cleanP
                };

                const { error } = await supabase.from('properties').update(dbData).eq('id', p.id); 
                if (error) {
                  console.error("Supabase update error details:", error);
                  showToast(`Error al actualizar inmueble: ${error.message}`, "ERROR");
                  throw error; 
                }
                await fetchProperties(); 
                showToast("Inmueble actualizado con éxito", "SUCCESS");
                setView('DASHBOARD'); 
              }} 
              onCancel={() => { setSelectedPropertyId(null); setView('DASHBOARD'); }} 
              showToast={showToast}
            />
          )}

          {view === 'DETAILS' && selectedPropertyId && (
            properties.some(p => p.id === selectedPropertyId) ? (
              <PropertyDetails property={properties.find(p => p.id === selectedPropertyId)!} onBack={() => { setView('SEARCH'); window.history.pushState({}, '', window.location.pathname); }} onSendMessage={handleSendMessage} showToast={showToast} />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Propiedad no encontrada</h2>
                <p className="text-slate-500 mb-8 font-medium">El inmueble que buscas no existe o ha sido eliminado.</p>
                <button onClick={() => { setView('SEARCH'); window.history.pushState({}, '', '/'); }} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all">Volver al inicio</button>
              </div>
            )
          )}

          {view === 'PRICING' && (
            <PricingPage 
              onSelectPackage={p => { 
                setSelectedPackage(p); 
                setIsCartCheckout(false); 
                if (currentUser) setView('PAYMENT'); 
                else setView('AUTH'); 
              }} 
              onAddToCart={handleAddToCart} 
              customPackages={packages.filter(p => p.isActive)} 
              userRole={currentUser?.role}
            />
          )}

          {view === 'CART' && (
            <CartPage 
              cart={cart} 
              onRemove={handleRemoveFromCart} 
              onUpdateQuantity={handleUpdateCartQuantity} 
              onCheckout={() => { setIsCartCheckout(true); if (currentUser) setView('PAYMENT'); else setView('AUTH'); }} 
              onContinueShopping={() => setView('PRICING')} 
            />
          )}
"@

# Pattern to find the corrupted block
$pattern = "if \(finalPlanType === 'SUPER_FEATURED'\) \{\s+cart=\{cart\}\s+onRemove=\{handleRemoveFromCart\}\s+onUpdateQuantity=\{handleUpdateCartQuantity\}\s+onCheckout=\{\(\) => \{ setIsCartCheckout\(true\); if \(currentUser\) setView\('PAYMENT'\); else setView\('AUTH'\); \}\}\s+onContinueShopping=\{\(\) => setView\('PRICING'\)\}\s+\/>\s+\)\}"

$newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)

[System.IO.File]::WriteAllText($path, $newContent)
