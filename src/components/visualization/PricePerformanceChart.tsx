import React, { useEffect, useRef } from 'react';
import { Product } from '../../types';

export interface PricePerformanceChartProps {
  products: Product[];
  performanceScorer: (product: Product) => number;
  width?: number;
  height?: number;
  highlightBest?: boolean;
  onProductClick?: (productId: string) => void;
  valueThresholds?: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export const PricePerformanceChart: React.FC<PricePerformanceChartProps> = ({
  products,
  performanceScorer,
  width = 600,
  height = 400,
  highlightBest = true,
  onProductClick,
  valueThresholds = {
    excellent: 1.2,
    good: 1.0,
    average: 0.8,
    poor: 0.6
  }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate performance scores and value ratios
  const productData = products.map(product => {
    const performance = performanceScorer(product);
    const price = product.price.current;
    const valueRatio = performance / price;
    
    return {
      product,
      performance,
      price,
      valueRatio
    };
  });
  
  // Find the best value product
  const bestValueProduct = highlightBest 
    ? productData.reduce((best, current) => 
        current.valueRatio > best.valueRatio ? current : best, 
        productData[0]
      )
    : null;
  
  // Draw the chart
  useEffect(() => {
    if (!canvasRef.current || products.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas .getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate min/max values for axes
    const minPrice = Math.min(...productData.map(d => d.price));
    const maxPrice = Math.max(...productData.map(d => d.price));
    const minPerformance = Math.min(...productData.map(d => d.performance));
    const maxPerformance = Math.max(...productData.map(d => d.performance));
    
    // Add some padding
    const pricePadding = (maxPrice - minPrice) * 0.1;
    const performancePadding = (maxPerformance - minPerformance) * 0.1;
    
    const xMin = Math.max(0, minPrice - pricePadding);
    const xMax = maxPrice + pricePadding;
    const yMin = Math.max(0, minPerformance - performancePadding);
    const yMax = maxPerformance + performancePadding;
    
    // Define chart area
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Function to convert data coordinates to canvas coordinates
    const xScale = (price: number) => padding + (price - xMin) / (xMax - xMin) * chartWidth;
    const yScale = (performance: number) => height - padding - (performance - yMin) / (yMax - yMin) * chartHeight;
    
    // Draw background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding + chartWidth, height - padding);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    
    // X-axis grid lines
    const xStep = Math.ceil((xMax - xMin) / 5);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const xPos = xScale(x);
      
      ctx.beginPath();
      ctx.moveTo(xPos, padding);
      ctx.lineTo(xPos, height - padding);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`$${x}`, xPos, height - padding + 5);
    }
    
    // Y-axis grid lines
    const yStep = Math.ceil((yMax - yMin) / 5);
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const yPos = yScale(y);
      
      ctx.beginPath();
      ctx.moveTo(padding, yPos);
      ctx.lineTo(padding + chartWidth, yPos);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(y.toFixed(1), padding - 5, yPos);
    }
    
    // Draw axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px sans-serif';
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Price ($)', padding + chartWidth / 2, height - 15);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, padding + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Performance', 0, 0);
    ctx.restore();
    
    // Draw value ratio lines
    const valueLines = [
      { ratio: valueThresholds.excellent, color: 'rgba(34, 197, 94, 0.5)', label: 'Excellent value' },
      { ratio: valueThresholds.good, color: 'rgba(59, 130, 246, 0.5)', label: 'Good value' },
      { ratio: valueThresholds.average, color: 'rgba(250, 204, 21, 0.5)', label: 'Average value' },
      { ratio: valueThresholds.poor, color: 'rgba(239, 68, 68, 0.5)', label: 'Poor value' }
    ];
    
    valueLines.forEach(line => {
      // Calculate two points on the line
      const x1 = xMin;
      const y1 = x1 * line.ratio;
      const x2 = xMax;
      const y2 = x2 * line.ratio;
      
      // Only draw if within chart bounds
      if ((y1 >= yMin && y1 <= yMax) || (y2 >= yMin && y2 <= yMax)) {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        
        ctx.beginPath();
        ctx.moveTo(xScale(x1), yScale(y1));
        ctx.lineTo(xScale(x2), yScale(y2));
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw label
        ctx.fillStyle = line.color.replace('0.5', '0.9');
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(line.label, padding + chartWidth - 5, yScale(xMax * line.ratio) - 5);
      }
    });
    
    // Draw data points
    productData.forEach(data => {
      const x = xScale(data.price);
      const y = yScale(data.performance);
      
      // Determine color based on value ratio
      let color = 'rgba(156, 163, 175, 1)'; // Default gray
      
      if (data.valueRatio >= valueThresholds.excellent) {
        color = 'rgba(34, 197, 94, 1)'; // Green
      } else if (data.valueRatio >= valueThresholds.good) {
        color = 'rgba(59, 130, 246, 1)'; // Blue
      } else if (data.valueRatio >= valueThresholds.average) {
        color = 'rgba(250, 204, 21, 1)'; // Yellow
      } else if (data.valueRatio >= valueThresholds.poor) {
        color = 'rgba(239, 68, 68, 1)'; // Red
      }
      
      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, bestValueProduct && data.product.id === bestValueProduct.product.id ? 8 : 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw stroke for best value product
      if (bestValueProduct && data.product.id === bestValueProduct.product.id) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(data.product.brand, x, y - 10);
    });
    
    // Add click handler for interactivity
    if (onProductClick) {
      canvas.onclick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Find closest product
        let closestProduct = products[0];
        let closestDistance = Infinity;
        
        productData.forEach(data => {
          const dataX = xScale(data.price);
          const dataY = yScale(data.performance);
          
          const dx = x - dataX;
          const dy = y - dataY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < closestDistance && distance < 20) {
            closestDistance = distance;
            closestProduct = data.product;
          }
        });
        
        if (closestDistance < 20) {
          onProductClick(closestProduct.id);
        }
      };
    }
  }, [products, productData, width, height, performanceScorer, highlightBest, bestValueProduct, valueThresholds, onProductClick]);
  
  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="mx-auto"
      />
      {bestValueProduct && (
        <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-80 p-2 rounded text-sm">
          <p className="font-medium">Best Value: {bestValueProduct.product.brand} {bestValueProduct.product.title.substring(0, 20)}...</p>
          <p className="text-xs text-gray-300">Performance: {bestValueProduct.performance.toFixed(1)}</p>
          <p className="text-xs text-gray-300">Price: ${bestValueProduct.price.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};