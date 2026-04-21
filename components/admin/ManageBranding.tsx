
import React, { useState, useEffect } from 'react';
import type { Driver } from '../../types';
import { RideCarLogo } from '../icons';

interface ManageBrandingProps {
  currentDriver: Driver;
  onUpdate: (updates: Partial<Driver>) => Promise<{ success: boolean; error?: string }>;
}

const ManageBranding: React.FC<ManageBrandingProps> = ({ currentDriver, onUpdate }) => {
  const [brandName, setBrandName] = useState(currentDriver.brandName || 'RideCar');
  const [primaryColor, setPrimaryColor] = useState(currentDriver.primaryColor || '#f97316');
  const [backgroundColor, setBackgroundColor] = useState(currentDriver.backgroundColor || '#030712');
  const [logoUrl, setLogoUrl] = useState(currentDriver.customLogoUrl || '');
  const [slug, setSlug] = useState(currentDriver.slug || '');
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(!!currentDriver.slug);

  // Sincroniza estado se o motorista mudar via props
  useEffect(() => {
    setBrandName(currentDriver.brandName || 'RideCar');
    setPrimaryColor(currentDriver.primaryColor || '#f97316');
    setBackgroundColor(currentDriver.backgroundColor || '#030712');
    setLogoUrl(currentDriver.customLogoUrl || '');
    setSlug(currentDriver.slug || '');
    setHasManuallyEditedSlug(!!currentDriver.slug);
  }, [currentDriver.id]);

  // URL base dinâmica
  const baseUrl = window.location.origin;
  const fullLink = `${baseUrl}/${slug}`;

  // Sugestão automática de SLUG
  useEffect(() => {
    if (!hasManuallyEditedSlug && brandName) {
        const suggestedSlug = brandName
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^a-z0-9]/g, "-")      // Troca caracteres especiais por hífen
            .replace(/-+/g, "-")             // Evita hifens duplos
            .replace(/^-|-$/g, "");          // Remove hifens nas extremidades
        
        setSlug(suggestedSlug);
    }
  }, [brandName, hasManuallyEditedSlug]);

  const handleSave = async () => {
    setErrorMessage(null);
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, "-");
    
    const result = await onUpdate({
      brandName,
      primaryColor,
      backgroundColor,
      customLogoUrl: logoUrl,
      slug: cleanSlug
    });

    if (result.success) {
        setSlug(cleanSlug);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    } else {
        setErrorMessage(result.error || 'Ocorreu um erro ao salvar.');
    }
  };

  const copyToClipboard = () => {
    if (!slug) return;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = [
    { name: 'Laranja (Padrão)', hex: '#f97316' },
    { name: 'Rosa Pink', hex: '#ec4899' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Verde', hex: '#22c55e' },
    { name: 'Roxo', hex: '#a855f7' },
    { name: 'Vermelho', hex: '#ef4444' },
    { name: 'Preto', hex: '#111827' },
  ];

  const bgColors = [
    { name: 'Escuro (Padrão)', hex: '#030712' },
    { name: 'Cinza Profundo', hex: '#0f172a' },
    { name: 'Vinho Escuro', hex: '#1c0c0c' },
    { name: 'Azul Meia-noite', hex: '#020617' },
    { name: 'Verde Floresta', hex: '#022c22' },
    { name: 'Roxo Escuro', hex: '#1e1b4b' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 string storage
        alert('A imagem é muito grande. Escolha uma imagem de até 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SEÇÃO DE LINK EXCLUSIVO */}
      <div className="bg-gray-900 p-8 rounded-[32px] border border-primary/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i className="fa-solid fa-share-nodes text-8xl text-primary"></i>
        </div>
        
        <div className="flex items-center mb-6">
            <div className="bg-primary p-3 rounded-2xl mr-4 shadow-lg shadow-primary/30">
                <i className="fa-solid fa-rocket text-white text-2xl"></i>
            </div>
            <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Seu Link de Divulgação</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Compartilhe para receber chamadas diretas</p>
            </div>
        </div>

        <div className="space-y-6 relative z-10">
            <div className="bg-black/50 border border-gray-700/50 rounded-2xl p-5 flex flex-col items-center">
                <p className="text-[10px] text-primary font-black uppercase mb-3 tracking-[0.2em]">Endereço Público do seu App:</p>
                <div className="text-white font-mono font-bold text-base md:text-lg break-all text-center">
                    <span className="opacity-40">{baseUrl}/</span>
                    <span className="text-primary underline decoration-2 underline-offset-8 decoration-primary/50">{slug || '...'}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 flex items-center group focus-within:border-primary transition-all">
                    <span className="text-gray-500 font-bold mr-2">/</span>
                    <input 
                        type="text"
                        value={slug}
                        onChange={(e) => {
                            setSlug(e.target.value.toLowerCase().replace(/\s/g, '-'));
                            setHasManuallyEditedSlug(true);
                        }}
                        placeholder="nome-do-seu-negocio"
                        className="bg-transparent border-none text-white font-black text-lg focus:ring-0 w-full placeholder-gray-700"
                    />
                    {!hasManuallyEditedSlug && (
                        <i className="fa-solid fa-magic text-primary animate-pulse" title="Gerado automaticamente"></i>
                    )}
                </div>
                <button 
                    onClick={copyToClipboard}
                    disabled={!slug}
                    className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center shadow-2xl active:scale-95 disabled:opacity-50 ${
                        copied ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-primary-hover'
                    }`}
                >
                    {copied ? <><i className="fa-solid fa-check-double mr-3"></i> Copiado!</> : <><i className="fa-solid fa-copy mr-3"></i> Copiar Link</>}
                </button>
            </div>
            
            <div className="flex items-center justify-center space-x-2 p-3 bg-primary/10 rounded-xl border border-primary/20">
                <i className="fa-solid fa-circle-info text-primary"></i>
                <p className="text-[10px] text-gray-300 font-bold uppercase">
                    Este link exibe seu perfil personalizado para os passageiros.
                </p>
            </div>
        </div>
      </div>

      {/* PERSONALIZAÇÃO VISUAL */}
      <div className="bg-gray-800/40 p-8 rounded-[32px] border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-8 flex items-center">
            <i className="fa-solid fa-palette text-primary mr-3"></i> Personalizar Identidade
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
                <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Nome Fantasia (Marca)</label>
                    <div className="relative">
                        <i className="fa-solid fa-star absolute left-5 top-1/2 -translate-y-1/2 text-primary"></i>
                        <input 
                            type="text" 
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="Ex: João Transporte Executivo"
                            className="w-full bg-gray-900/80 border border-gray-700 p-5 pl-14 rounded-2xl text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">Cor do Topo e Botões (Destaque)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                        {colors.map(c => (
                            <button 
                                key={c.hex}
                                onClick={() => setPrimaryColor(c.hex)}
                                className={`w-full aspect-square rounded-2xl border-4 transition-all flex items-center justify-center ${primaryColor === c.hex ? 'border-white scale-110 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                            >
                                {primaryColor === c.hex && <i className="fa-solid fa-check text-white drop-shadow-md"></i>}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">Cor de Fundo da Tela</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {bgColors.map(c => (
                            <button 
                                key={c.hex}
                                onClick={() => setBackgroundColor(c.hex)}
                                className={`w-full aspect-square rounded-2xl border-4 transition-all flex items-center justify-center ${backgroundColor === c.hex ? 'border-primary scale-110 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                            >
                                {backgroundColor === c.hex && <i className="fa-solid fa-check text-primary drop-shadow-md"></i>}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Logomarca (Upload ou Link)</label>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <label className="flex-grow flex items-center justify-center p-5 bg-gray-900/80 border border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-primary transition-all group">
                                <i className="fa-solid fa-cloud-arrow-up text-primary mr-3 text-xl group-hover:scale-110 transition-transform"></i>
                                <span className="text-white font-bold text-sm">Upload do Celular/Notebook</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleLogoUpload}
                                />
                            </label>
                            {logoUrl && (
                                <button 
                                    onClick={() => setLogoUrl('')}
                                    className="bg-red-500/20 text-red-500 p-5 rounded-2xl border border-red-500/30 hover:bg-red-500 transition-all hover:text-white"
                                    title="Remover Logo"
                                >
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <i className="fa-solid fa-link absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                            <input 
                                type="text" 
                                value={logoUrl.startsWith('data:') ? 'Imagem carregada via upload' : logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                disabled={logoUrl.startsWith('data:')}
                                placeholder="Ou cole o link de uma imagem externa..."
                                className="w-full bg-gray-900/80 border border-gray-700 p-4 pl-12 rounded-2xl text-white focus:ring-2 focus:ring-primary outline-none text-xs font-medium disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className={`w-full font-black py-5 rounded-2xl shadow-2xl transition-all transform active:scale-95 uppercase tracking-[0.2em] italic text-sm ${
                        errorMessage ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-primary hover:bg-primary-hover shadow-primary/30 text-white'
                    }`}
                >
                    {isSaved ? <><i className="fa-solid fa-check-circle mr-3"></i> TUDO SALVO COM SUCESSO!</> : 
                     errorMessage ? <><i className="fa-solid fa-circle-exclamation mr-3 text-white"></i> {errorMessage}</> :
                     'SALVAR IDENTIDADE VISUAL'}
                </button>
            </div>

            {/* PREVIEW MOBILE */}
            <div className="flex flex-col items-center">
                <p className="text-[10px] text-gray-500 mb-6 uppercase font-black tracking-[0.4em]">Preview do seu App</p>
                
                <div className="w-full max-w-[300px] bg-gray-950 rounded-[50px] border-[10px] border-gray-900 shadow-2xl relative overflow-hidden aspect-[9/18]" style={{ backgroundColor: backgroundColor }}>
                    <div className="absolute top-0 w-full h-6 bg-gray-900 flex justify-center items-center">
                        <div className="w-20 h-3 bg-gray-800 rounded-full"></div>
                    </div>
                    
                    <div className="p-8 pt-12 flex flex-col items-center h-full">
                        <RideCarLogo 
                            customName={brandName} 
                            customLogoUrl={logoUrl} 
                            className="w-full"
                        />
                        
                        <div className="mt-10 space-y-4 w-full">
                            <div className="h-2.5 w-full bg-gray-800/50 rounded-full"></div>
                            <div className="h-2.5 w-5/6 bg-gray-800/50 rounded-full mx-auto"></div>
                            <div className="h-2.5 w-4/6 bg-gray-800/50 rounded-full mx-auto"></div>
                        </div>

                        <div className="mt-auto mb-12 w-full">
                            <div 
                                className="w-full py-5 rounded-3xl text-white font-black text-[11px] text-center uppercase tracking-[0.2em] shadow-xl animate-pulse"
                                style={{ backgroundColor: primaryColor }}
                            >
                                SOLICITAR VIAGEM
                            </div>
                        </div>
                    </div>
                </div>
                <p className="mt-6 text-[10px] text-gray-600 font-bold uppercase">Simulação de visualização mobile</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBranding;
