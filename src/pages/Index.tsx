import DynamicRenderer from '@/components/DynamicRenderer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useDesign } from '@/contexts/DesignContext';

const Index = () => {
  const { design } = useDesign();
  
  return (
    <div className={`min-h-screen bg-${design.colors.pageBackground}`}>
      <DynamicRenderer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
