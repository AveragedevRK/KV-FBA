import React from 'react';
import { Layers, ArrowLeft, Construction } from 'lucide-react';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
  onBack?: () => void;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ 
  title = "Coming Soon", 
  description = "This feature is currently under development. Stay tuned for updates!",
  onBack 
}) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in-fast bg-[var(--bg-0)]">
      
      {/* Icon Graphic */}
      <div className="relative mb-8 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div className="w-24 h-24 bg-[var(--bg-1)] rounded-full flex items-center justify-center border border-[var(--border-1)] shadow-2xl relative z-10">
           <Layers size={40} className="text-[var(--text-tertiary)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#0f62fe] text-white p-2.5 rounded-full border-4 border-[var(--bg-0)] z-20 flex items-center justify-center shadow-lg">
            <Construction size={18} />
        </div>
        
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#0f62fe]/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <h1 className="text-[32px] md:text-[42px] font-light text-[var(--text-primary)] mb-3 tracking-tight animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
        {title}
      </h1>
      
      <div className="w-[60px] h-[2px] bg-[#0f62fe] mb-6 animate-grow-bar" style={{ '--target-height': '2px', width: '60px' } as React.CSSProperties}></div>

      <p className="text-[14px] md:text-[16px] text-[var(--text-tertiary)] max-w-[480px] leading-relaxed mb-10 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
        {description}
      </p>

      {onBack && (
        <button 
          onClick={onBack}
          className="h-[48px] px-8 bg-[var(--bg-1)] border border-[var(--border-1)] hover:bg-[var(--bg-2)] hover:border-[var(--border-2)] text-[var(--text-primary)] text-[14px] font-medium transition-all duration-200 hover:-translate-y-1 flex items-center gap-2 animate-slide-up-fade"
          style={{ animationDelay: '300ms' }}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      )}
    </div>
  );
};

export default ComingSoonPage;