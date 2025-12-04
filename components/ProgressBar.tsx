import React from 'react';

interface ProgressBarProps {
    value: number;
    max: number;
    colorClass?: string;
    label?: string;
    showValue?: boolean;
    height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
    value, 
    max, 
    colorClass = "bg-green-500", 
    label, 
    showValue = true,
    height = "h-4"
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    return (
        <div className="w-full relative mb-1 select-none">
            <div className={`w-full bg-gray-300 rounded-sm overflow-hidden border border-gray-400 ${height}`}>
                <div 
                    className={`h-full ${colorClass} transition-all duration-200 ease-linear`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-semibold text-gray-800 drop-shadow-md">
                <span>{label}</span>
                {showValue && <span>{Math.floor(value)}/{max}</span>}
            </div>
        </div>
    );
};
