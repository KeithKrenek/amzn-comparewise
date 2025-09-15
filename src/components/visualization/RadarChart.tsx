import React, { useEffect, useRef } from 'react';
import { Product } from '../../types';

export interface RadarChartProps {
  products: Product[];
  dimensions: Array<{
    id: string;
    label: string;
    valueAccessor: (product: Product) => number;
    maxValue?: number;
    betterDirection: 'higher' | 'lower';
  }>;
  width?: number;
  height?: number;
  colorScale?: string[];
  showLegend?: boolean;
  interactive?: boolean;
  onPointClick?: (dimension: string, productId: string) => void;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  products,
  dimensions,
  width = 400,
  height = 400,
  colorScale = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  showLegend = true,
  interactive = true,
  onPointClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw the radar chart
  useEffect(() => {
    if (!canvasRef.current || products.length === 0 || dimensions.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Draw background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw axes
    const angleStep = (2 * Math.PI) / dimensions.length;
    
    // Draw grid lines
    const gridLevels = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px sans-serif';
    
    for (let level = 1; level <= gridLevels; level++) {
      const levelRadius = (radius * level) / gridLevels;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px sans-serif';
    
    dimensions.forEach((dimension, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      
      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
      
      // Draw axis label
      const labelX = centerX + (radius + 20) * Math.cos(angle);
      const labelY = centerY + (radius + 20) * Math.sin(angle);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dimension.label, labelX, labelY);
    });
    
    // Draw data
    products.forEach((product, productIndex) => {
      const color = colorScale[productIndex % colorScale.length];
      
      // Draw polygon
      ctx.beginPath();
      
      dimensions.forEach((dimension, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        
        // Get value and normalize to 0-1
        let value = dimension.valueAccessor(product);
        
        // Handle better direction
        if (dimension.betterDirection === 'lower') {
          // Invert value for "lower is better" dimensions
          const maxVal = dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p)));
          value = maxVal - value;
        }
        
        // Normalize to 0-1 range
        const maxVal = dimension.maxValue || Math.max(...products.map(p => 
          dimension.betterDirection === 'lower' 
            ? dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p))) - dimension.valueAccessor(p)
            : dimension.valueAccessor(p)
        ));
        
        const normalizedValue = maxVal > 0 ? value / maxVal : 0;
        
        // Calculate point position
        const pointRadius = radius * normalizedValue;
        const pointX = centerX + pointRadius * Math.cos(angle);
        const pointY = centerY + pointRadius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      });
      
      // Close the path
      ctx.closePath();
      
      // Fill with semi-transparent color
      ctx.fillStyle = `${color}33`; // 20% opacity
      ctx.fill();
      
      // Stroke with solid color
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      ctx.fillStyle = color;
      
      dimensions.forEach((dimension, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        
        // Get value and normalize to 0-1
        let value = dimension.valueAccessor(product);
        
        // Handle better direction
        if (dimension.betterDirection === 'lower') {
          // Invert value for "lower is better" dimensions
          const maxVal = dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p)));
          value = maxVal - value;
        }
        
        // Normalize to 0-1 range
        const maxVal = dimension.maxValue || Math.max(...products.map(p => 
          dimension.betterDirection === 'lower' 
            ? dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p))) - dimension.valueAccessor(p)
            : dimension.valueAccessor(p)
        ));
        
        const normalizedValue = maxVal > 0 ? value / maxVal : 0;
        
        // Calculate point position
        const pointRadius = radius * normalizedValue;
        const pointX = centerX + pointRadius * Math.cos(angle);
        const pointY = centerY + pointRadius * Math.sin(angle);
        
        // Draw point
        ctx.beginPath();
        ctx.arc(pointX, pointY, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
    
    // Draw legend
    if (showLegend && products.length > 1) {
      const legendX = 20;
      let legendY = 20;
      const legendSpacing = 20;
      
      products.forEach((product, i) => {
        const color = colorScale[i % colorScale.length];
        
        // Draw color box
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY, 12, 12);
        
        // Draw product name
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(product.brand, legendX + 20, legendY + 6);
        
        legendY += legendSpacing;
      });
    }
    
    // Add click handler for interactivity
    if (interactive && onPointClick) {
      canvas.onclick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Calculate distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only handle clicks within the chart area
        if (distance <= radius) {
          // Calculate angle
          let angle = Math.atan2(dy, dx) + Math.PI / 2; // Adjust to start from top
          if (angle < 0) angle += 2 * Math.PI;
          
          // Determine which dimension was clicked
          const dimensionIndex = Math.floor((angle / (2 * Math.PI)) * dimensions.length) % dimensions.length;
          const dimension = dimensions[dimensionIndex];
          
          // Find closest product point
          let closestProduct = products[0];
          let closestDistance = Infinity;
          
          products.forEach(product => {
            let value = dimension.valueAccessor(product);
            
            // Handle better direction
            if (dimension.betterDirection === 'lower') {
              const maxVal = dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p)));
              value = maxVal - value;
            }
            
            // Normalize to 0-1 range
            const maxVal = dimension.maxValue || Math.max(...products.map(p => 
              dimension.betterDirection === 'lower' 
                ? dimension.maxValue || Math.max(...products.map(p => dimension.valueAccessor(p))) - dimension.valueAccessor(p)
                : dimension.valueAccessor(p)
            ));
            
            const normalizedValue = maxVal > 0 ? value / maxVal : 0;
            
            // Calculate point position
            const pointRadius = radius * normalizedValue;
            const pointAngle = dimensionIndex * angleStep - Math.PI / 2;
            const pointX = centerX + pointRadius * Math.cos(pointAngle);
            const pointY = centerY + pointRadius * Math.sin(pointAngle);
            
            // Calculate distance to point
            const pointDx = x - pointX;
            const pointDy = y - pointY;
            const pointDistance = Math.sqrt(pointDx * pointDx + pointDy * pointDy);
            
            if (pointDistance < closestDistance) {
              closestDistance = pointDistance;
              closestProduct = product;
            }
          });
          
          // Call the click handler
          onPointClick(dimension.id, closestProduct.id);
        }
      };
    }
  }, [products, dimensions, width, height, colorScale, showLegend, interactive, onPointClick]);
  
  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="mx-auto"
      />
    </div>
  );
};