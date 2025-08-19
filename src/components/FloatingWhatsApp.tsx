import { MessageCircle } from "lucide-react";
import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useDesign } from '@/contexts/DesignContext';

const FloatingWhatsApp = () => {
  const { agentConfig } = useSettings();
  const { design } = useDesign();
  const [isHovered, setIsHovered] = useState(false);

  const handleWhatsAppContact = () => {
    if (!agentConfig) {
      console.warn('AgentConfig not loaded yet');
      return;
    }
    
    const phoneNumber = agentConfig.whatsapp.replace(/[^0-9]/g, ''); // Remove formatting
    const message = `Olá ${agentConfig.firstName}, gostaria de saber mais sobre os seus pacotes de viagem!`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      onClick={handleWhatsAppContact}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-element="primaryButton"
      className="fixed bottom-6 right-6 z-50 text-white p-4 rounded-full shadow-2xl cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
      style={{
        backgroundColor: '#22c55e', // Keep WhatsApp green for brand recognition
        borderColor: '#22c55e',
        borderWidth: '2px',
        borderStyle: 'solid'
      }}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        <MessageCircle className="w-6 h-6" />
      </div>
      
      {isHovered && agentConfig && (
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">
          Conversar com {agentConfig.firstName}
          <div className="absolute right-[-6px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-gray-900 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default FloatingWhatsApp;
