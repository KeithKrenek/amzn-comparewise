import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { aiService } from '../services/ai/aiService';

interface AIStatusProps {
  apiKey?: string;
}

export const AIStatus: React.FC<AIStatusProps> = ({ apiKey }) => {
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  const checkAIStatus = async () => {
    const status = aiService.isInitialized();
    setIsAIAvailable(status);
    return status;
  };
  
  const initializeAI = async (key: string) => {
    if (!key) return false;
    
    setIsInitializing(true);
    try {
      const success = await aiService.initialize(key);
      setIsAIAvailable(success);
      return success;
    } catch (error) {
      console.error('Error initializing AI service:', error);
      setIsAIAvailable(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };
  
  useEffect(() => {
    checkAIStatus();
    
    // If API key is provided and AI is not initialized, initialize it
    if (apiKey && !aiService.isInitialized()) {
      initializeAI(apiKey);
    }
  }, [apiKey]);
  
  const handleToggleApiKeyInput = () => {
    setShowApiKeyInput(!showApiKeyInput);
  };
  
  const handleInitializeAI = async () => {
    if (apiKeyInput) {
      const success = await initializeAI(apiKeyInput);
      if (success) {
        setShowApiKeyInput(false);
      }
    }
  };
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>AI:</span>
      {isInitializing ? (
        <RefreshCw size={16} className="animate-spin text-blue-400" />
      ) : isAIAvailable ? (
        <CheckCircle size={16} className="text-green-400" />
      ) : (
        <AlertCircle size={16} className="text-yellow-400" />
      )}
      <span className={isAIAvailable ? 'text-green-400' : 'text-yellow-400'}>
        {isAIAvailable ? 'Active' : 'Inactive'}
      </span>
      
      {showApiKeyInput ? (
        <div className="flex items-center space-x-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter OpenAI API Key"
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded w-64"
          />
          <button
            onClick={handleInitializeAI}
            disabled={isInitializing || !apiKeyInput}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? 'Initializing...' : 'Initialize'}
          </button>
          <button
            onClick={handleToggleApiKeyInput}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleToggleApiKeyInput}
          className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded flex items-center"
        >
          <Zap size={12} className="mr-1" />
          {isAIAvailable ? 'Change API Key' : 'Set API Key'}
        </button>
      )}
      
      <button
        onClick={() => checkAIStatus()}
        className="p-1 hover:bg-gray-700 rounded"
        title="Refresh status"
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
};