
import React, { useState } from 'react';

interface FooterProps {
  onDemoClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onDemoClick }) => {
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  return (
    <footer className="w-full bg-transparent p-6 text-center mt-auto z-10 flex flex-col items-center">
      
      {/* 1. Instruções de Instalação */}
      <div className="w-full mb-4 border-b border-gray-800/50 pb-4">
        <button 
            onClick={() => setShowInstallHelp(!showInstallHelp)}
            className="text-[10px] text-gray-300 hover:text-primary flex items-center justify-center w-full uppercase tracking-wider font-bold transition-colors"
        >
            <i className={`fa-solid ${showInstallHelp ? 'fa-chevron-up' : 'fa-download'} mr-2`}></i>
            {showInstallHelp ? 'Ocultar Dicas' : 'Instalar no Celular'}
        </button>

        {showInstallHelp && (
            <div className="text-[10px] text-white mt-3 bg-gray-900/90 backdrop-blur-md p-3 rounded-xl text-left mx-auto max-w-xs border border-gray-700 shadow-2xl">
                <p className="mb-2"><strong className="text-white">iPhone:</strong> Toque em <i className="fa-solid fa-share-from-square mx-1"></i> e "Adicionar à Tela de Início".</p>
                <p><strong className="text-white">Android:</strong> Toque nos <i className="fa-solid fa-ellipsis-vertical mx-1"></i> do Chrome e "Instalar aplicativo".</p>
            </div>
        )}
      </div>

      {/* 2. Aviso Legal (Leis) */}
      <div className="mb-6 px-4">
        <p className="text-[9px] text-white leading-tight uppercase tracking-tight font-medium">
          Serviço de transporte privado individual de passageiros operado em conformidade com a 
          <span className="text-primary font-black ml-1">Lei Federal nº 13.640/2018</span>.
        </p>
      </div>

      {/* 3. Botão de Suporte WhatsApp */}
      <a 
        href="https://wa.me/5535991048020" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center space-x-2 bg-gray-800 text-white hover:text-green-400 px-4 py-2 rounded-full mb-6 transition-all text-[10px] border border-gray-700 hover:border-green-500 shadow-lg"
      >
        <i className="fa-brands fa-whatsapp text-green-500"></i>
        <span className="font-black uppercase tracking-widest">Suporte RideCar</span>
      </a>

      {/* 4. Créditos */}
      <div className="space-y-1">
        <p className="text-[10px] text-white font-bold">
            &copy; {new Date().getFullYear()} RideCar - Todos os direitos reservados.
        </p>
        <p className="text-[10px] text-primary font-black uppercase tracking-widest drop-shadow-md">
            Desenvolvido por Silvio T. de Sá Filho
        </p>
      </div>
    </footer>
  );
};

export default Footer;
