import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subtext, icon, trend }) => {
  return (
    <div className="bg-[#262626] border border-[#393939] p-4 flex flex-col justify-between h-[140px] hover:border-[#8d8d8d] transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:shadow-lg">
      
      <div className="flex justify-between items-start">
        <h3 className="text-[14px] font-semibold text-[#c6c6c6] uppercase tracking-wide group-hover:text-[#f4f4f4] transition-colors">{title}</h3>
        <div className="text-[#0f62fe] opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100">{icon}</div>
      </div>

      <div className="mt-auto">
        <div className="text-[32px] font-light text-[#f4f4f4] leading-none mb-1">
          {value}
        </div>
        {subtext && (
          <div className="flex items-center text-[12px] text-[#8d8d8d]">
            {trend === 'up' && <span className="text-[#42be65] mr-1 animate-bounce">▲</span>}
            {trend === 'down' && <span className="text-[#fa4d56] mr-1 animate-bounce">▼</span>}
            {subtext}
          </div>
        )}
      </div>
      
      {/* Hover decorative line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0f62fe] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
};

export default DashboardCard;