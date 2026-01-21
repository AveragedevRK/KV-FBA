import React, { useState, useRef, useEffect, useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { Calendar, Package, Truck, Boxes, TrendingUp, Info } from 'lucide-react';
import { Shipment } from '../types';
// Removed: import { MOCK_ITEMS } from '../hooks/useItems'; // Import mock items

// Reusing DASHBOARD_MOCK_SHIPMENTS from DashboardPage for consistency
const DASHBOARD_MOCK_SHIPMENTS: Shipment[] = [
  { shipmentId: 'SHP-1', name: 'S1', destination: 'D1', originWarehouse: 'W1', totalItems: 120, carrier: 'UPS', status: 'In Progress', createdDate: '2025-05-12T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', quantity: 50, asin: 'B0WH001XXX' }, { sku: 'EM-202', name: 'Ergonomic Mouse', quantity: 70, asin: 'B0EM202XXX' }] },
  { shipmentId: 'SHP-2', name: 'S2', destination: 'D2', originWarehouse: 'W1', totalItems: 450, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-05-10T10:00:00', lastUpdated: '', items: [{ sku: 'LS-303', name: 'Laptop Stand', quantity: 200, asin: 'B0LS303XXX' }, { sku: 'CB-101', name: 'USB-C Cable (2m)', quantity: 250, asin: 'B0CB101XXX' }] },
  { shipmentId: 'SHP-3', name: 'S3', destination: 'D3', originWarehouse: 'W1', totalItems: 15, carrier: 'DHL', status: 'Delivered', createdDate: '2025-05-08T10:00:00', lastUpdated: '', items: [{ sku: 'MK-550', name: 'Mechanical Keyboard', quantity: 15, asin: 'B0MK550XXX' }] },
  { shipmentId: 'SHP-4', name: 'S4', destination: 'D4', originWarehouse: 'W1', totalItems: 200, carrier: 'UPS', status: 'Draft', createdDate: '2025-05-14T10:00:00', lastUpdated: '', items: [{ sku: 'MA-800', name: 'Monitor Arm', quantity: 100, asin: 'B0MA800XXX' }, { sku: 'WC-400', name: 'Webcam 4K', quantity: 100, asin: 'B0WC400XXX' }] },
  { shipmentId: 'SHP-5', name: 'S5', destination: 'D5', originWarehouse: 'W1', totalItems: 5, carrier: 'USPS', status: 'Cancelled', createdDate: '2025-05-05T10:00:00', lastUpdated: '', items: [{ sku: 'DM-012', name: 'Desk Mat', quantity: 5, asin: 'B0DM012XXX' }] },
  { shipmentId: 'S6', name: 'S6', destination: 'D6', originWarehouse: 'W1', totalItems: 1200, carrier: 'Maersk', status: 'In Progress', createdDate: '2025-05-13T10:00:00', lastUpdated: '', items: [{ sku: 'LG-900', name: 'Gaming Monitor 27"', quantity: 1200, asin: 'B0LG900XXX' }] },
  { shipmentId: 'S7', name: 'S7', destination: 'D7', originWarehouse: 'W1', totalItems: 50, carrier: 'Internal', status: 'Shipped', createdDate: '2025-05-12T10:00:00', lastUpdated: '', items: [{ sku: 'SP-101', name: 'Smart Plug', quantity: 50, asin: 'B0SP101XXX' }] },
  { shipmentId: 'S8', name: 'S8', destination: 'D8', originWarehouse: 'W1', totalItems: 240, carrier: 'FedEx', status: 'Delivered', createdDate: '2025-05-01T10:00:00', lastUpdated: '', items: [{ sku: 'EM-202', name: 'Ergonomic Mouse', quantity: 240, asin: 'B0EM202XXX' }] },
  { shipmentId: 'SHP-9', name: 'S9', destination: 'D9', originWarehouse: 'W1', totalItems: 0, carrier: 'UPS', status: 'Draft', createdDate: '2025-05-15T10:00:00', lastUpdated: '' },
  { shipmentId: 'SHP-10', name: 'S10', destination: 'D10', originWarehouse: 'W1', totalItems: 300, carrier: 'UPS', status: 'Shipped', createdDate: '2025-04-28T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', quantity: 150, asin: 'B0WH001XXX' }, { sku: 'LS-303', name: 'Laptop Stand', quantity: 150, asin: 'B0LS303XXX' }] },
  { shipmentId: 'S11-WH001', name: 'S11-WH001', destination: 'D11', originWarehouse: 'W1', totalItems: 10, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-04-25T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', quantity: 10, asin: 'B0WH001XXX' }] },
  { shipmentId: 'S11-EM202', name: 'S11-EM202', destination: 'D11', originWarehouse: 'W1', totalItems: 5, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-04-25T10:00:00', lastUpdated: '', items: [{ sku: 'EM-202', name: 'Ergonomic Mouse', quantity: 5, asin: 'B0EM202XXX' }] },
  { shipmentId: 'S12', name: 'S12', destination: 'D12', originWarehouse: 'W1', totalItems: 500, carrier: 'DHL', status: 'Shipped', createdDate: '2025-04-20T10:00:00', lastUpdated: '', items: [{ sku: 'CB-101', name: 'USB-C Cable (2m)', quantity: 500, asin: 'B0CB101XXX' }] },
  { shipmentId: 'S13', name: 'S13', destination: 'D13', originWarehouse: 'W1', totalItems: 150, carrier: 'UPS', status: 'Shipped', createdDate: '2025-05-09T10:00:00', lastUpdated: '', items: [{ sku: 'DM-012', name: 'Desk Mat', quantity: 100, asin: 'B0DM012XXX' }, { sku: 'SP-101', name: 'Smart Plug', quantity: 50, asin: 'B0SP101XXX' }] },
  { shipmentId: 'S14', name: 'S14', destination: 'D14', originWarehouse: 'W1', totalItems: 250, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-05-07T10:00:00', lastUpdated: '', items: [{ sku: 'LS-303', name: 'Laptop Stand', quantity: 250, asin: 'B0LS303XXX' }] },
  { shipmentId: 'S15', name: 'S15', destination: 'D15', originWarehouse: 'W1', totalItems: 75, carrier: 'DHL', status: 'Delivered', createdDate: '2025-05-06T10:00:00', lastUpdated: '', items: [{ sku: 'MA-800', name: 'Monitor Arm', quantity: 75, asin: 'B0MA800XXX' }] },
  { shipmentId: 'S16', name: 'S16', destination: 'D16', originWarehouse: 'W1', totalItems: 180, carrier: 'USPS', status: 'Shipped', createdDate: '2025-05-04T10:00:00', lastUpdated: '', items: [{ sku: 'WC-400', name: 'Webcam 4K', quantity: 180, asin: 'B0WC400XXX' }] }
];

interface TooltipData {
  x: number; // Percentage for horizontal positioning
  y: number; // SVG Y coordinate for vertical positioning
  date: string;
  units: number;
  products: number; // For Inventory Movement: Products shipped
}

const InventoryOverviewPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  
  // Interactive Chart State
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Metrics Calculation ---

  const { productsInOpenShipments, unitsInOpenShipments, unitsShippedForPeriod, chartData } = useMemo(() => {
    const today = new Date('2025-05-15'); // Fixed "Today" for demo consistency
    let daysToLookBack = 30;
    
    if (dateRange === 'Today') daysToLookBack = 1;
    if (dateRange === 'Last 7 Days') daysToLookBack = 7;
    if (dateRange === 'Last 30 Days') daysToLookBack = 30;
    if (dateRange === 'Year to Date') daysToLookBack = 135; // approx

    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysToLookBack + 1);

    // Filter shipments for the selected period
    const relevantShipmentsForPeriod = DASHBOARD_MOCK_SHIPMENTS.filter(s => {
      const d = new Date(s.createdDate);
      return d.toISOString().split('T')[0] >= cutoffDate.toISOString().split('T')[0] && 
             d.toISOString().split('T')[0] <= today.toISOString().split('T')[0];
    });

    // Metric 1: Products in Open Shipments
    const uniqueSKUsInOpenShipments = new Set<string>();
    DASHBOARD_MOCK_SHIPMENTS.filter(s => 
        ['Draft', 'In Progress', 'Shipped'].includes(s.status)
    ).forEach(s => {
        s.items?.forEach(item => uniqueSKUsInOpenShipments.add(item.sku));
    });
    const productsInOpenShipments = uniqueSKUsInOpenShipments.size;

    // Metric 2: Units in Open Shipments
    const unitsInOpenShipments = DASHBOARD_MOCK_SHIPMENTS.filter(s => 
        ['Draft', 'In Progress', 'Shipped'].includes(s.status)
    ).reduce((sum, s) => sum + (s.totalItems || 0), 0);

    // Metric 3: Units Shipped (Selected Period)
    const unitsShippedForPeriod = relevantShipmentsForPeriod
        .filter(s => s.status === 'Shipped' || s.status === 'Delivered')
        .reduce((sum, s) => sum + s.totalItems, 0);

    // Chart Data: Aggregated units shipped per day (Inventory Movement)
    const dailyData: Record<string, { units: number; products: Set<string> }> = {};
    
    for (let i = 0; i < daysToLookBack; i++) {
        const d = new Date(cutoffDate);
        d.setDate(d.getDate() + i); 
        const key = d.toISOString().split('T')[0];
        dailyData[key] = { units: 0, products: new Set() };
    }

    DASHBOARD_MOCK_SHIPMENTS
      .filter(s => (s.status === 'Shipped' || s.status === 'Delivered'))
      .forEach(s => {
          const key = s.createdDate.split('T')[0];
          if (dailyData[key]) {
              dailyData[key].units += s.totalItems;
              s.items?.forEach(item => dailyData[key].products.add(item.sku));
          }
      });

    const dataPoints = Object.keys(dailyData).sort().map(date => ({
        date,
        value: dailyData[date].units,
        products: dailyData[date].products.size 
    }));

    return { productsInOpenShipments, unitsInOpenShipments, unitsShippedForPeriod, chartData: dataPoints };
  }, [dateRange]);

  // Metric 4: Total Active SKUs
  // FIX: Recalculate totalActiveSKUs based on available DASHBOARD_MOCK_SHIPMENTS
  const totalActiveSKUs = useMemo(() => {
    const uniqueSKUs = new Set<string>();
    DASHBOARD_MOCK_SHIPMENTS.forEach(s => {
      s.items?.forEach(item => uniqueSKUs.add(item.sku));
    });
    return uniqueSKUs.size;
  }, []);

  // --- Helper to create smooth SVG path ---
  const getSmoothPath = (points: {value: number}[], width: number, height: number) => {
    if (points.length === 0) return { path: '', area: '', normalizeY: (v: number) => 0 };
    
    const maxY = Math.max(...points.map(p => p.value)) || 1; // Ensure maxY is at least 1 to avoid division by zero
    const stepX = width / (points.length - 1 || 1);
    
    // Normalize Y (0 at bottom, height at top visually)
    const normalizeY = (val: number) => height - (val / maxY) * (height * 0.8) - (height * 0.1); 

    let d = `M 0 ${normalizeY(points[0].value)}`;

    for (let i = 0; i < points.length - 1; i++) {
        const x0 = i * stepX;
        const y0 = normalizeY(points[i].value);
        const x1 = (i + 1) * stepX;
        const y1 = normalizeY(points[i+1].value);
        
        // Control points for bezier curve
        const cp1x = x0 + (x1 - x0) / 2;
        const cp1y = y0;
        const cp2x = x1 - (x1 - x0) / 2;
        const cp2y = y1;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }

    return { 
      path: d, 
      area: `${d} L ${width} ${height} L 0 ${height} Z`,
      normalizeY 
    };
  };

  const chartInfo = useMemo(() => {
      return getSmoothPath(chartData, 1000, 300);
  }, [chartData]);


  // --- Interactive Chart Handlers ---
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (!chartData.length || !chartContainerRef.current) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const svgWidth = 1000;
    
    const svgX = (mouseX / svgRect.width) * svgWidth;
    
    const stepX = svgWidth / (chartData.length - 1 || 1);
    const index = Math.round(svgX / stepX);
    
    if (index >= 0 && index < chartData.length) {
      const dataPoint = chartData[index];
      const yPos = chartInfo.normalizeY(dataPoint.value);
      const xPercent = (index / (chartData.length - 1 || 1)) * 100;
      
      setTooltip({
        x: xPercent, 
        y: yPos,
        date: new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        units: dataPoint.value,
        products: dataPoint.products
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartData.length || !chartContainerRef.current) return;
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    const svgRect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - svgRect.left;
    const svgWidth = 1000;

    const svgX = (touchX / svgRect.width) * svgWidth;

    const stepX = svgWidth / (chartData.length - 1 || 1);
    const index = Math.round(svgX / stepX);

    if (index >= 0 && index < chartData.length) {
      const dataPoint = chartData[index];
      const yPos = chartInfo.normalizeY(dataPoint.value);
      const xPercent = (index / (chartData.length - 1 || 1)) * 100;

      setTooltip({
        x: xPercent,
        y: yPos,
        date: new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        units: dataPoint.value,
        products: dataPoint.products
      });
    } else {
      setTooltip(null);
    }
  };

  const hasChartData = chartData.length > 0 && chartData.some(d => d.value > 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-fade-in-fast no-scrollbar">
      
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div>
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Inventory Overview</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Comprehensive view of your inventory movement and status.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`bg-[var(--bg-1)] hover:bg-[var(--bg-2)] border border-[var(--border-1)] text-[var(--text-primary)] h-[40px] px-4 flex items-center gap-2 text-[14px] transition-colors duration-200 ${isDateDropdownOpen ? 'bg-[var(--bg-2)]' : ''}`}
            >
              <Calendar size={16} />
              {dateRange}
            </button>
            {isDateDropdownOpen && (
              <div className="absolute top-full right-0 w-[200px] bg-[var(--bg-1)] border border-[var(--border-1)] shadow-xl z-50 animate-fade-in-fast origin-top-right">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'Year to Date'].map((opt, idx) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setIsDateDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[var(--bg-2)] cursor-pointer text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Card 1: Products in Open Shipments */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
            <DashboardCard
              title="Products in Open Shipments"
              value={productsInOpenShipments}
              subtext="Unique products in active shipments."
              trend="neutral"
              icon={<Package size={20} />}
            />
        </div>

        {/* Card 2: Units in Open Shipments */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
            <DashboardCard
              title="Units in Open Shipments"
              value={unitsInOpenShipments.toLocaleString()}
              subtext="Total units pending shipment."
              trend="neutral"
              icon={<Truck size={20} />}
            />
        </div>

        {/* Card 3: Units Shipped (Selected Period) */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
            <DashboardCard
              title="Units Shipped (Selected Period)"
              value={unitsShippedForPeriod.toLocaleString()}
              subtext="Units shipped during the selected period."
              trend="up"
              icon={<TrendingUp size={20} />}
            />
        </div>

        {/* Card 4: Total Active SKUs */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
            <DashboardCard
              title="Total Active SKUs"
              value={totalActiveSKUs.toLocaleString()}
              subtext="Total available product listings."
              trend="neutral"
              icon={<Boxes size={20} />}
            />
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[var(--bg-1)] border border-[var(--border-1)] p-6 flex flex-col h-[400px] opacity-0 animate-slide-up-fade relative" style={{ animationDelay: '300ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-[var(--text-primary)]">Inventory Movement Over Time</h3>
            <div className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0f62fe]"></div>
                Units Shipped
            </div>
          </div>

          <div className="flex-1 w-full relative overflow-hidden" ref={chartContainerRef}>
             {hasChartData ? (
                <>
                  <svg 
                    viewBox="0 0 1000 300" 
                    className="w-full h-full preserve-3d" 
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseLeave}
                  >
                      <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#0f62fe" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#0f62fe" stopOpacity="0" />
                          </linearGradient>
                      </defs>
                      
                      {/* Area Fill */}
                      <path 
                          d={chartInfo.area} 
                          fill="url(#chartGradient)" 
                          className="animate-fade-in-fast pointer-events-none"
                      />
                      
                      {/* Stroke Line */}
                      <path 
                          d={chartInfo.path} 
                          fill="none" 
                          stroke="#0f62fe" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          className="animate-grow-bar pointer-events-none"
                          style={{ strokeDasharray: chartInfo.path.length, strokeDashoffset: chartInfo.path.length }}
                      />

                      {/* Hover Interaction Overlay: Transparent rect to capture events */}
                      <rect 
                        width="1000" 
                        height="300" 
                        fill="transparent" 
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="cursor-crosshair"
                      />

                      {/* Active Point Indicator (only in SVG) */}
                      {tooltip && (
                         <circle 
                            cx={(tooltip.x / 100) * 1000} 
                            cy={tooltip.y} 
                            r="5" 
                            fill="#0f62fe" 
                            stroke="#fff" 
                            strokeWidth="2"
                            className="pointer-events-none"
                         />
                      )}

                      {/* Simple X Axis Line */}
                      <line x1="0" y1="298" x2="1000" y2="298" stroke="var(--border-1)" strokeWidth="1" className="pointer-events-none" />
                  </svg>

                  {/* HTML Tooltip Overlay */}
                  {tooltip && (
                     <div 
                        className="absolute pointer-events-none z-[var(--z-popover)] bg-[var(--bg-2)] border border-[var(--border-1)] p-3 rounded shadow-lg text-[12px] flex flex-col gap-1 min-w-[140px]"
                        style={{
                           left: `${tooltip.x}%`,
                           top: `${(tooltip.y / 300) * 100}%`, 
                           transform: `translateX(${tooltip.x > 70 ? '-105%' : '5px'}) translateY(${tooltip.y / 300 > 0.5 ? '-105%' : '5px'})` 
                        }}
                     >
                        <div className="text-[var(--text-secondary)] font-medium border-b border-[var(--border-1)] pb-1 mb-1">
                           {tooltip.date}
                        </div>
                        <div className="flex justify-between gap-4">
                           <span className="text-[var(--text-tertiary)]">Products shipped:</span>
                           <span className="text-[var(--text-primary)] font-mono">{tooltip.products}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                           <span className="text-[var(--text-tertiary)]">Units shipped:</span>
                           <span className="text-[var(--text-primary)] font-mono font-bold">{tooltip.units}</span>
                        </div>
                     </div>
                  )}
                </>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
                    <Info size={32} className="mb-2 opacity-30" />
                    <p>No inventory movement data for this period.</p>
                </div>
             )}
          </div>
          
          {/* X Axis Labels */}
          {hasChartData && (
            <div className="flex justify-between mt-2 text-[11px] text-[var(--text-tertiary)] font-mono px-2">
                <span>{new Date(chartData[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(chartData[Math.floor(chartData.length / 2)]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(chartData[chartData.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
      </div>

    </div>
  );
};

export default InventoryOverviewPage;