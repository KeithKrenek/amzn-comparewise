import React, { useState, useEffect, useRef } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, onChange }) => {
  const [lowValue, setLowValue] = useState(value[0]);
  const [highValue, setHighValue] = useState(value[1]);
  const lowThumbRef = useRef<HTMLInputElement>(null);
  const highThumbRef = useRef<HTMLInputElement>(null);

  // Update local state when props change
  useEffect(() => {
    setLowValue(value[0]);
    setHighValue(value[1]);
  }, [value]);

  // Handle low value change
  const handleLowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLow = Number(e.target.value);
    if (newLow <= highValue) {
      setLowValue(newLow);
      onChange([newLow, highValue]);
    }
  };

  // Handle high value change
  const handleHighChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHigh = Number(e.target.value);
    if (newHigh >= lowValue) {
      setHighValue(newHigh);
      onChange([lowValue, newHigh]);
    }
  };

  // Calculate the percentage for the active track
  const lowPercent = ((lowValue - min) / (max - min)) * 100;
  const highPercent = ((highValue - min) / (max - min)) * 100;

  return (
    <div className="py-4">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      <div className="relative h-6">
        {/* Background track */}
        <div className="absolute w-full h-2 bg-gray-700 rounded-full top-2"></div>
        
        {/* Active track */}
        <div 
          className="absolute h-2 bg-blue-500 rounded-full top-2"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        ></div>
        
        {/* Thumbs */}
        <input
          ref={lowThumbRef}
          type="range"
          min={min}
          max={max}
          value={lowValue}
          onChange={handleLowChange}
          className="absolute w-full h-6 cursor-pointer opacity-0"
          style={{ zIndex: 3 }}
        />
        
        <input
          ref={highThumbRef}
          type="range"
          min={min}
          max={max}
          value={highValue}
          onChange={handleHighChange}
          className="absolute w-full h-6 cursor-pointer opacity-0"
          style={{ zIndex: 4 }}
        />
        
        {/* Visible thumbs */}
        <div 
          className="absolute w-4 h-4 bg-white rounded-full shadow-md top-1 -ml-2 cursor-pointer"
          style={{ left: `${lowPercent}%`, zIndex: 5 }}
        ></div>
        
        <div 
          className="absolute w-4 h-4 bg-white rounded-full shadow-md top-1 -ml-2 cursor-pointer"
          style={{ left: `${highPercent}%`, zIndex: 6 }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-4">
        <div className="px-2 py-1 bg-gray-700 rounded text-xs">
          {lowValue}
        </div>
        <div className="px-2 py-1 bg-gray-700 rounded text-xs">
          {highValue}
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;