import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle, MapPin, MessageCircle, Loader2 } from 'lucide-react';


const TravelPackages = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading, error } = useContent();
  const travelPackages = getContentForComponent<any>('TravelPackages');

  const handleWhatsAppContact = (packageName: string) => {
    if (!agentConfig) {
      console.warn('AgentConfig not loaded yet');
      return;
    }
    const message = travelPackages.contactMessageTemplate.replace('{agentFirstName}', agentConfig.firstName).replace('{packageName}', packageName);
    const whatsappUrl = `https://wa.me/${agentConfig.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading || !travelPackages) {
    return (
      <section id="packages" className={`py-20 :py-32 bg-${design.colors.background}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton height={48} width={400} className="mx-auto mb-4" />
            <Skeleton height={20} width={600} className="mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 :grid-cols-2 :grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <Skeleton height={200} className="rounded-none" />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Skeleton height={24} width={200} />
                    <Skeleton height={20} width={80} />
                  </div>
                  
                  <Skeleton height={16} count={3} className="mb-4" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton height={20} width={120} />
                    <Skeleton height={20} width={60} />
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-6">
                    <Skeleton height={16} width="100%" />
                    <Skeleton height={16} width="90%" />
                    <Skeleton height={16} width="80%" />
                  </div>
                  
                  <Skeleton height={40} width="100%" className="rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="packages" className={`py-20 :py-32 bg-${design.colors.background}`}>
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <p className="text-lg text-red-600">Erro ao carregar pacotes: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!travelPackages) {
    return null; // Content is not available for this section
  }

  return (
    <section id="packages" className={`py-20 :py-32 bg-${design.colors.background}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
            <p className="text-lg text-gray-600" style={{ fontFamily: design.fonts.body }}>{travelPackages.preTitle}</p>
            <h2 
                className="text-7xl :text-9xl font-light tracking-tighter text-gray-900 mt-2"
                style={{ fontFamily: design.fonts.title }}
            >
                {travelPackages.title}
            </h2>
            <p className={`text-lg text-${design.colors.textLight} mt-6 max-w-3xl mx-auto`} style={{ fontFamily: design.fonts.body }}>
                {travelPackages.description}
            </p>
        </div>

        <Tabs defaultValue={travelPackages.categories[0].id} className="w-full">
          <div className="relative w-full mb-10 overflow-hidden">
            <TabsList className="flex justify-between overflow-x-auto whitespace-nowrap pb-2 bg-transparent rounded-none border-0 shadow-none scrollbar-hide touch-pan-x">
              {travelPackages.categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className="text-slate-400 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-700 py-3 px-4 :px-6 font-medium transition-all flex-shrink-0 flex-grow text-center min-w-[100px]"
                  style={{ fontFamily: design.fonts.body }}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {travelPackages.categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 :grid-cols-2 :grid-cols-3 gap-8">
                {travelPackages.packages
                  .filter((pkg) => pkg.categoryIds.includes(category.id))
                  .map((pkg: any) => {
                    return (
                      <Card key={pkg.id} className={`bg-${design.colors.cardBackground} rounded-2xl overflow-hidden shadow-lg border-0 hover:shadow-xl transition-all duration-300 flex flex-col`}>
                        <CardHeader className="p-0">
                          <div className="relative">
                            <img 
                              src={pkg.image} 
                              alt={pkg.name} 
                              className="w-full h-56 object-cover" 
                            />
                            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                              {pkg.duration}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-6 flex-grow">
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin className={`w-4 h-4 text-${design.colors.primary} mt-1 flex-shrink-0`} />
                            <div>
                              <CardTitle className={`text-xl font-bold text-${design.colors.text} leading-tight`} style={{ fontFamily: design.fonts.title }}>
                                {pkg.name}
                              </CardTitle>
                              <p className={`text-sm text-${design.colors.textLight} mt-1`} style={{ fontFamily: design.fonts.body }}>{pkg.duration}</p>
                            </div>
                          </div>
                          
                          <p className={`text-${design.colors.textLight} mb-4 text-sm leading-relaxed line-clamp-2`} style={{ fontFamily: design.fonts.body }}>
                            {pkg.description}
                          </p>
                          
                          <div className="space-y-2 mb-4">
                            {pkg.includes.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-start">
                                <CheckCircle className={`w-4 h-4 text-${design.colors.primary} mr-2 mt-0.5 flex-shrink-0`} />
                                <span className={`text-${design.colors.text} text-sm`} style={{ fontFamily: design.fonts.body }}>{item}</span>
                              </div>
                            ))}
                            {pkg.includes.length > 2 && (
                              <div className="flex items-start mt-2">
                                <MessageCircle className={`w-4 h-4 text-${design.colors.highlight} mr-2 mt-0.5 flex-shrink-0`} />
                                <span className={`text-${design.colors.highlight} text-sm font-normal`} style={{ fontFamily: design.fonts.body }}>{travelPackages.moreDetailsText}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="p-6">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-light" style={{ fontFamily: design.fonts.body, color: design.colors.textLight }}>{pkg.price.type}</span>
                              <span className="text-3xl font-medium" style={{ fontFamily: design.fonts.title, color: design.colors.text }}>
                                {pkg.price.currency}{pkg.price.value}
                              </span>
                            </div>
                            <Button 
                              onClick={() => handleWhatsAppContact(pkg.name)}
                              className={`${design.buttons.primary.bg} ${design.buttons.primary.hover} ${design.buttons.primary.textColor} font-normal py-3 px-5 rounded-lg text-sm shadow-lg hover:shadow-cyan-700/30 transition-all duration-300`}
                              style={{ fontFamily: design.fonts.body }}
                            >
                              {travelPackages.ctaText}
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default TravelPackages;
