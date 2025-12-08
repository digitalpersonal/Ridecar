
import React, { useState } from 'react';

interface FooterProps {
  onDemoClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onDemoClick }) => {
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 p-6 text-center mt-auto z-10 flex flex-col items-center">
      
      {/* 1. Instruções de Instalação (No topo do rodapé) */}
      <div className="w-full mb-6 border-b border-gray-800 pb-4">
        <button 
            onClick={() => setShowInstallHelp(!showInstallHelp)}
            className="text-[11px] text-orange-500 hover:text-orange-400 flex items-center justify-center w-full uppercase tracking-wider font-bold"
        >
            <i className={`fa-solid ${showInstallHelp ? 'fa-chevron-up' : 'fa-download'} mr-2`}></i>
            {showInstallHelp ? 'Ocultar Instruções' : 'Instalar App'}
        </button>

        {showInstallHelp && (
            <div className="text-[11px] text-gray-400 mt-3 bg-gray-800 p-3 rounded-lg text-left mx-auto max-w-xs border border-gray-700">
                <p className="mb-2"><strong className="text-white">iOS (iPhone):</strong> Toque no botão <i className="fa-solid fa-share-from-square mx-1"></i> Compartilhar e selecione "Adicionar à Tela de Início".</p>
                <p><strong className="text-white">Android:</strong> Toque nos três pontos <i className="fa-solid fa-ellipsis-vertical mx-1"></i> do navegador e selecione "Instalar aplicativo".</p>
            </div>
        )}
      </div>

      {/* 2. Botão de Suporte WhatsApp */}
      <a 
        href="https://wa.me/5535991048020" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center space-x-2 bg-green-600/10 text-green-400 hover:bg-green-600/20 px-5 py-3 rounded-full mb-6 transition-colors text-sm border border-green-600/30 w-full max-w-xs"
      >
        <i className="fa-brands fa-whatsapp text-xl"></i>
        <span className="font-semibold">Falar com o desenvolvedor</span>
      </a>

      {/* 3. Créditos */}
      <p className="text-xs text-gray-500">
        &copy; {new Date().getFullYear()} RideCar. Todos os direitos reservados.
      </p>
      
      <p className="text-[10px] text-orange-500 mt-2 font-medium">
        Desenvolvido por Multiplus - Silvio T. de Sá Filho
      </p>

      {/* 4. Link Demo (Aparece apenas se a função for passada - Tela de Login) */}
      {onDemoClick && (
          <button 
              onClick={onDemoClick}
              className="mt-8 text-[10px] text-gray-700 hover:text-gray-500 transition-colors border-t border-gray-800 pt-2 px-4"
          >
              [Entrar como Motorista Demo]
          </button>
      )}
    </footer>
  );
};

export default Footer;
