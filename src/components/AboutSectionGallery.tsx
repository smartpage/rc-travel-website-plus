import { useDesign } from '@/contexts/DesignContext';
import { useContent } from '@/contexts/ContentContext';
import Masonry from 'react-masonry-css';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Img } from 'react-image';

// True Masonry CSS
const masonryStyle = `
.masonry-grid {
  display: flex;
  margin-left: -16px; /* gutter size offset */
  width: 100%;
}
.masonry-column {
  padding-left: 16px; /* gutter size */
  background-clip: padding-box;
  display: flex;
  flex-direction: column;
}
`;
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = masonryStyle;
  document.head.appendChild(style);
}

import React, { useEffect, useRef, useState } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/button';

const IMAGES_PATH = '/viagens_hugo';

interface Image {
  id: string;
  src: string;
}
const INITIAL_IMAGES = 12;
const LOAD_MORE = 8;

// Async image loader with skeleton using react-image
const ImageWithSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="mb-6 w-full">
      <Img
        src={src}
        alt={alt}
        loader={
          <Skeleton
            height={220}
            style={{ borderRadius: '1rem', width: '100%' }}
            containerClassName="w-full"
          />
        }
        unloader={null} // Hide slot if image is missing
        className="w-full rounded-xl shadow-lg object-cover object-center transition-transform duration-300 hover:scale-105"
        style={{ width: '100%', display: 'block', background: '#eee', borderRadius: '1rem' }}
        decode={true} // Garante que a imagem seja decodificada antes de ser exibida
      />
    </div>
  );
};

const AboutSectionGallery = () => {
  const { design } = useDesign();
  const { getContentForComponent, loading } = useContent();
  const galleryContent = getContentForComponent<any>('AboutSectionGallery');
  const [visibleCount, setVisibleCount] = useState(INITIAL_IMAGES);
  const [columns, setColumns] = useState<number>(3);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || 0;
      const nextCols = w < 500 ? 1 : w < 800 ? 2 : 3;
      setColumns(nextCols);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (loading || !galleryContent) {
    return (
      <Section sectionId="about">
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
          <div className="w-full max-w-7xl mx-auto">
            <Skeleton height={40} width={300} className="mb-4" />
            <Skeleton height={20} width={500} className="mb-8" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton height={220} />
              <Skeleton height={220} />
              <Skeleton height={220} />
            </div>
          </div>
        </SkeletonTheme>
      </Section>
    );
  }

  const visibleImages = galleryContent.galleryImages.slice(0, visibleCount);
  const hasMore = visibleCount < galleryContent.galleryImages.length;

  // Find branding area (branding = main content, right after subtitle)
  return (
    <Section sectionId="about" backgroundImageUrl={galleryContent.backgroundImage}>
      <div className="relative z-20 w-full h-full flex flex-col justify-center items-center text-center min-h-[80vh]">
          {/* Main content */}
          <div className="mb-10 @md:mb-16 max-w-4xl">
            <SectionTitle 
              title={galleryContent.title}
              description={galleryContent.description}
              centerAlign={true}
              titleColor="#FFFFFF"
              descriptionColor="rgba(255, 255, 255, 0.8)"
            />
          </div>
          {/* Masonry Gallery */}
          <div className="w-full mt-8" ref={containerRef}>
            <SkeletonTheme baseColor="#202020" highlightColor="#444">
            <Masonry
              breakpointCols={columns}
              className="masonry-grid"
              columnClassName="masonry-column"
            >
              {visibleImages.map((imageSrc, i) => (
                <ImageWithSkeleton key={i} src={imageSrc} alt={`${galleryContent.imageAlt} ${i + 1}`} />
              ))}
            </Masonry>
            </SkeletonTheme>
            {hasMore && (
              <div className="w-full flex justify-center mt-8">
                <Button
                  onClick={() => setVisibleCount(c => Math.min(c + LOAD_MORE, galleryContent.galleryImages.length))}
                  data-element="primaryButton"
                  className="transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: design.components?.button?.variants?.primary?.backgroundColor,
                    color: design.components?.button?.variants?.primary?.textColor,
                    borderColor: design.components?.button?.variants?.primary?.borderColor,
                    fontFamily: design.components?.button?.variants?.primary?.fontFamily,
                    fontSize: design.components?.button?.variants?.primary?.fontSize,
                    fontWeight: design.components?.button?.variants?.primary?.fontWeight,
                    padding: design.components?.button?.variants?.primary?.padding,
                    borderRadius: design.components?.button?.variants?.primary?.borderRadius,
                    borderWidth: design.components?.button?.variants?.primary?.borderWidth,
                    borderStyle: 'solid'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColorHover || '';
                    e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColorHover || '';
                    e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColorHover || '';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColor || '';
                    e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColor || '';
                    e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColor || '';
                  }}
                >
                  {galleryContent.loadMoreText}
                </Button>
              </div>
            )}
          </div>
        </div>
    </Section>
  );
};

export default AboutSectionGallery;
