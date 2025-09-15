import express from 'express';
import { AmazonScraper } from './amazonScraper';
import { startProxyServer } from './proxyServer';

// Create Express app
const app = express();
app.use(express.json());

// Initialize scraper
let scraper: AmazonScraper | null = null;

// Start the proxy server and initialize the scraper
const initialize = async () => {
  try {
    const { url } = await startProxyServer();
    scraper = new AmazonScraper(url);
    console.log('Scraper initialized with proxy server');
  } catch (error) {
    console.error('Failed to initialize scraper:', error);
    // Initialize without proxy as fallback
    scraper = new AmazonScraper();
  }
};

// API routes
app.get('/status', (req, res) => {
  res.json({ status: 'ok', scraper: scraper ? 'initialized' : 'not initialized' });
});

// Search products
app.post('/api/search', async (req, res) => {
  try {
    if (!scraper) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }
    
    const { keyword, limit = 10 } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    const products = await scraper.searchProducts(keyword, limit);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get product details
app.get('/api/product/:id', async (req, res) => {
  try {
    if (!scraper) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }
    
    const { id } = req.params;
    const product = await scraper.getProductDetails(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error(`Error getting product details for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get product details' });
  }
});

// Get related products
app.get('/api/product/:id/related', async (req, res) => {
  try {
    if (!scraper) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }
    
    const { id } = req.params;
    // For now, we'll just search for products with the same brand
    const product = await scraper.getProductDetails(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Search for products with the same brand
    const relatedProducts = await scraper.searchProducts(product.brand, 4);
    
    // Filter out the current product
    const filteredProducts = relatedProducts.filter(p => p.id !== id);
    
    res.json(filteredProducts);
  } catch (error) {
    console.error(`Error getting related products for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get related products' });
  }
});

// Get product specifications
app.get('/api/product/:id/specifications', async (req, res) => {
  try {
    if (!scraper) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }
    
    const { id } = req.params;
    const product = await scraper.getProductDetails(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product.specifications || []);
  } catch (error) {
    console.error(`Error getting specifications for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get specifications' });
  }
});

// Normalize specifications
app.post('/api/normalize', async (req, res) => {
  try {
    const { specifications } = req.body;
    
    if (!Array.isArray(specifications)) {
      return res.status(400).json({ error: 'Specifications must be an array' });
    }
    
    // For now, we'll just return the specifications with enhanced confidence
    const normalizedSpecs = specifications.map(spec => ({
      ...spec,
      confidenceScore: Math.min(spec.confidenceScore + 0.1, 1.0),
      source: spec.source || 'ai_enhanced'
    }));
    
    res.json(normalizedSpecs);
  } catch (error) {
    console.error('Error normalizing specifications:', error);
    res.status(500).json({ error: 'Failed to normalize specifications' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`API server running on port ${PORT}`);
  await initialize();
});