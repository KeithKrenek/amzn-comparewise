import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { extractionService } from '../services/extractionService';

export const ScraperStatus: React.FC = () => {
  const [isScraperAvailable, setIsScraperAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const checkScraperStatus = async () => {
    setIsChecking(true);
    try {
      // Wait a bit to ensure the scraper has time to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      const status = extractionService.isScraperAvailable();
      console.log('Current scraper status:', status);
      setIsScraperAvailable(status);
    } catch (error) {
      console.error('Error checking scraper status:', error);
      setIsScraperAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    checkScraperStatus();
  }, []);
  
  const handleToggleAdapter = () => {
    if (isScraperAvailable) {
      // If scraper is available, we're already using it
      // So toggle to mock adapter
      const result = extractionService.useMockAdapter();
      console.log('Switched to mock adapter, result:', result);
      setIsScraperAvailable(false);
    } else {
      // If scraper is not available, try to use real scraper
      const success = extractionService.useRealScraper();
      console.log('Attempted to use real scraper, result:', success);
      setIsScraperAvailable(success);
    }
  };
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>Scraper:</span>
      {isChecking ? (
        <RefreshCw size={16} className="animate-spin text-blue-400" />
      ) : isScraperAvailable ? (
        <CheckCircle size={16} className="text-green-400" />
      ) : (
        <AlertCircle size={16} className="text-yellow-400" />
      )}
      <span className={isScraperAvailable ? 'text-green-400' : 'text-yellow-400'}>
        {isScraperAvailable ? 'Active' : 'Using Mock Data'}
      </span>
      <button
        onClick={handleToggleAdapter}
        className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
      >
        {isScraperAvailable ? 'Use Mock Data' : 'Try Real Scraper'}
      </button>
      <button
        onClick={checkScraperStatus}
        className="p-1 hover:bg-gray-700 rounded"
        title="Refresh status"
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
};