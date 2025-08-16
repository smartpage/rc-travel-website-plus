import React from 'react';
import { useDesign } from '@/contexts/DesignContext';

interface ServiceCardProps {
  service: {
    id?: string;
    title: string;
    description: string;
    icon: string;
    featured?: boolean;
    image?: string;
    buttonText?: string;
    buttonLink?: string;
    specialStyling?: string;
  };
  iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, iconMap }) => {
  const { design } = useDesign();
  const IconComponent = iconMap[service.icon as keyof typeof iconMap];

  const handleButtonClick = () => {
    if (service.buttonLink) {
      // Open external links in new tab, internal links in same tab
      if (service.buttonLink.startsWith('http') || service.buttonLink.startsWith('https')) {
        window.open(service.buttonLink, '_blank');
      } else {
        window.location.href = service.buttonLink;
      }
    }
  };

  // Featured service with photo
  if (service.featured && service.image) {
    return (
      <div className="relative overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-300 group min-h-[500px] rounded-2xl">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          style={{ backgroundImage: `url(${service.image})` }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <div className="relative z-10 p-4 @md:p-8 @lg:p-12 h-full flex flex-col min-h-[500px]">
          {/* Icon at top */}
          <div className="mb-12">
            {IconComponent && <IconComponent className="w-12 h-12 text-white" />}
          </div>
          
          {/* Content at fixed position */}
          <div>
            {/* Yellow bar - using RC Travel's primary color */}
            <div className={`w-full h-1 bg-${design.colors.primary} mb-6`} />
            
            <h3 className="text-2xl font-light text-white mb-6">
              {service.title}
            </h3>
            <p className="text-lg text-gray-200 font-light leading-relaxed mb-6">
              {service.description}
            </p>
            {service.buttonText && service.buttonText.trim() !== '' && (
              <button 
                onClick={handleButtonClick}
                className={`bg-${design.colors.primary} text-black hover:bg-${design.colors.primaryHover} px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300`}
              >
                {service.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Special yellow card styling
  if (service.specialStyling === 'yellow-card') {
    return (
      <div className="relative overflow-hidden bg-yellow-500 hover:bg-yellow-400 transition-all duration-300 group min-h-[500px] flex flex-col rounded-2xl">
        <div className="relative z-10 p-4 @md:p-8 @lg:p-12 h-full flex flex-col min-h-[500px]">
          {/* Icon at top */}
          <div className="mb-12">
            {IconComponent && <IconComponent className="w-12 h-12 text-black" />}
          </div>
          
          {/* Content */}
          <div>
            {/* Black bar */}
            <div className="w-full h-1 bg-black mb-6" />
            
            <h3 className="text-2xl font-light text-black mb-6">
              {service.title}
            </h3>
            <p className="text-lg text-black font-light leading-relaxed mb-6">
              {service.description}
            </p>
            
            {/* Button - Only render if buttonText exists */}
            {service.buttonText && (
              <button 
                onClick={handleButtonClick}
                className="bg-black text-yellow-500 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors duration-300"
              >
                {service.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular service
  return (
    <div className="border border-gray-800 p-4 @md:p-8 @lg:p-12 bg-gray-900/20 hover:bg-gray-900/40 transition-all duration-300 group min-h-[500px] flex flex-col rounded-2xl">
      <div className="mb-12">
        {IconComponent && (
          <IconComponent className={`w-12 h-12 text-gray-400 group-hover:text-${design.colors.primary} transition-colors duration-300`} />
        )}
      </div>
      <div>
        <h3 className="text-2xl font-light text-white mb-6">
          {service.title}
        </h3>
        <p className="text-lg text-gray-400 font-light leading-relaxed">
          {service.description}
        </p>
        
        {/* Button - Only render if buttonText exists */}
        {service.buttonText && (
          <button 
            onClick={handleButtonClick}
            className="mt-6 bg-gray-800 text-yellow-500 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors duration-300"
          >
            {service.buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
