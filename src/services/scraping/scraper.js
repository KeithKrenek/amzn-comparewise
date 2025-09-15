import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a proxy server to bypass CORS restrictions
const setupProxy = async () => {
  try {
    // This is a simple implementation. In production, you would use a more robust solution.
    const corsAnywhere = await import('cors-anywhere');
    const host = 'localhost';
    const port = 8080;

    corsAnywhere.createServer({
      originWhitelist: [], // Allow all origins
      requireHeader: ['origin', 'x-requested-with'],
      removeHeaders: ['cookie', 'cookie2']
    }).listen(port, host, () => {
      console.log(`CORS Anywhere proxy running on ${host}:${port}`);
    });

    return `http://${host}:${port}/`;
  } catch (error) {
    console.error('Failed to set up proxy server:', error);
    return null;
  }
};

// Main scraper class
class AmazonScraper {
  constructor(proxyUrl = null) {
    this.proxyUrl = proxyUrl;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
  }

  // Get a random user agent
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Make a request to Amazon
  async makeRequest(url) {
    try {
      const requestUrl = this.proxyUrl ? `${this.proxyUrl}${url}` : url;
      const response = await axios.get(requestUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${url}:`, error.message);
      return null;
    }
  }

  // Search for products
  async searchProducts(keyword, limit = 10) {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    console.log(`Searching for "${keyword}" on Amazon...`);
    
    const html = await this.makeRequest(searchUrl);
    if (!html) return [];
    
    const $ = cheerio.load(html);
    const products = [];
    
    // Amazon search results are in div elements with data-component-type="s-search-result"
    const productElements = $('div[data-component-type="s-search-result"]');
    
    console.log(`Found ${productElements.length} product elements`);
    
    productElements.each((i, element) => {
      if (i >= limit) return false;
      
      const asin = $(element).attr('data-asin');
      if (!asin) return;
      
      const titleElement = $(element).find('h2 a span');
      const title = titleElement.text().trim();
      
      const priceElement = $(element).find('.a-price .a-offscreen').first();
      const priceText = priceElement.text().trim();
      const price = this.extractPrice(priceText);
      
      const originalPriceElement = $(element).find('.a-price.a-text-price .a-offscreen').first();
      const originalPriceText = originalPriceElement.text().trim();
      const originalPrice = this.extractPrice(originalPriceText);
      
      const ratingElement = $(element).find('.a-icon-star-small .a-icon-alt');
      const ratingText = ratingElement.text().trim();
      const rating = this.extractRating(ratingText);
      
      const reviewCountElement = $(element).find('a .a-size-base');
      const reviewCountText = reviewCountElement.text().trim();
      const reviewCount = this.extractNumber(reviewCountText);
      
      const imageElement = $(element).find('img.s-image');
      const imageUrl = imageElement.attr('src');
      
      products.push({
        id: asin,
        title,
        price: {
          current: price,
          original: originalPrice || null,
          currency: 'USD'
        },
        rating: rating ? {
          value: rating,
          count: reviewCount || 0
        } : null,
        images: [
          {
            small: imageUrl,
            large: imageUrl?.replace('._SL160_', '._SL500_') || ''
          }
        ],
        url: `https://www.amazon.com/dp/${asin}`
      });
    });
    
    return products;
  }

  // Get product details
  async getProductDetails(asin) {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    console.log(`Getting details for product ${asin}...`);
    
    const html = await this.makeRequest(productUrl);
    if (!html) return null;
    
    const $ = cheerio.load(html);
    
    // Extract basic product info
    const title = $('#productTitle').text().trim();
    const brand = this.extractBrand($);
    
    // Extract price
    const priceElement = $('.a-price .a-offscreen').first();
    const priceText = priceElement.text().trim();
    const price = this.extractPrice(priceText);
    
    // Extract original price if available
    const originalPriceElement = $('.a-price.a-text-price .a-offscreen').first();
    const originalPriceText = originalPriceElement.text().trim();
    const originalPrice = this.extractPrice(originalPriceText);
    
    // Extract rating
    const ratingElement = $('#acrPopover .a-icon-alt');
    const ratingText = ratingElement.text().trim();
    const rating = this.extractRating(ratingText);
    
    // Extract review count
    const reviewCountElement = $('#acrCustomerReviewText');
    const reviewCountText = reviewCountElement.text().trim();
    const reviewCount = this.extractNumber(reviewCountText);
    
    // Extract images
    const images = [];
    $('#altImages .a-button-text img').each((i, img) => {
      const smallUrl = $(img).attr('src');
      if (smallUrl) {
        // Convert thumbnail URL to large image URL
        const largeUrl = smallUrl.replace(/\._SS40_/, '._SL500_');
        images.push({
          small: smallUrl,
          large: largeUrl,
          alt: title
        });
      }
    });
    
    // If no images found in the alternate images section, try the main image
    if (images.length === 0) {
      const mainImageUrl = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
      if (mainImageUrl) {
        images.push({
          small: mainImageUrl,
          large: mainImageUrl,
          alt: title
        });
      }
    }
    
    // Extract product description
    const description = this.extractDescription($);
    
    // Extract product features
    const features = this.extractFeatures($);
    
    // Extract specifications
    const specifications = this.extractSpecifications($);
    
    return {
      id: asin,
      title,
      brand,
      price: {
        current: price,
        original: originalPrice || null,
        currency: 'USD'
      },
      rating: rating ? {
        value: rating,
        count: reviewCount || 0
      } : null,
      images,
      specifications,
      description,
      features
    };
  }

  // Helper methods for extraction
  extractPrice(priceText) {
    if (!priceText) return null;
    const match = priceText.match(/\$?([\d,]+\.?\d*)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }

  extractRating(ratingText) {
    if (!ratingText) return null;
    const match = ratingText.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  }

  extractNumber(text) {
    if (!text) return null;
    const match = text.match(/([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
  }

  extractBrand($) {
    // Try different selectors for brand
    const brandElement = $('#bylineInfo') || $('.a-link-normal.contributorNameID');
    if (brandElement.length) {
      const brandText = brandElement.text().trim();
      const match = brandText.match(/(?:by|from)\s+(.+)/i);
      return match ? match[1].trim() : brandText;
    }
    
    // Try the product details section
    const detailsRows = $('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, .a-expander-content table tr');
    let brand = null;
    
    detailsRows.each((i, row) => {
      const header = $(row).find('th').text().trim().toLowerCase();
      if (header.includes('brand') || header.includes('manufacturer')) {
        brand = $(row).find('td').text().trim();
        return false; // Break the loop
      }
    });
    
    return brand || 'Unknown';
  }

  extractDescription($) {
    // Try different selectors for product description
    const descriptionElement = $('#productDescription p') || $('#feature-bullets .a-list-item') || $('.a-expander-content p');
    
    if (descriptionElement.length) {
      return descriptionElement.text().trim();
    }
    
    return 'No description available';
  }

  extractFeatures($) {
    const features = [];
    
    // Try the feature bullets
    $('#feature-bullets .a-list-item').each((i, item) => {
      const text = $(item).text().trim();
      if (text && !text.toLowerCase().includes('warranty')) {
        features.push(text);
      }
    });
    
    return features;
  }

  extractSpecifications($) {
    const specifications = [];
    
    // Try the product details section
    const detailsRows = $('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, .a-expander-content table tr');
    
    detailsRows.each((i, row) => {
      const header = $(row).find('th').text().trim();
      const value = $(row).find('td').text().trim();
      
      if (header && value) {
        // Determine category based on header
        let category = 'other';
        
        if (/processor|cpu|ram|memory|storage|graphics|gpu/i.test(header)) {
          category = 'technical';
        } else if (/dimensions|weight|color|material/i.test(header)) {
          category = 'physical';
        } else if (/warranty|manufacturer|country/i.test(header)) {
          category = 'administrative';
        }
        
        specifications.push({
          id: header.toLowerCase().replace(/\s+/g, '_'),
          name: header,
          value,
          category,
          confidenceScore: 1.0, // High confidence since it's directly from the product page
          source: 'extraction'
        });
      }
    });
    
    // If no specifications found in the table, try the bullet points
    if (specifications.length === 0) {
      $('#feature-bullets .a-list-item').each((i, item) => {
        const text = $(item).text().trim();
        const match = text.match(/^([^:]+):\s*(.+)$/);
        
        if (match) {
          const [_, name, value] = match;
          specifications.push({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            value,
            category: 'technical', // Default category
            confidenceScore: 0.8, // Slightly lower confidence
            source: 'extraction'
          });
        }
      });
    }
    
    return specifications;
  }
}

// Main function to run the scraper
const runScraper = async () => {
  console.log('Setting up scraper...');
  const proxyUrl = await setupProxy();
  const scraper = new AmazonScraper(proxyUrl);
  
  // Example: Search for products
  const searchTerm = 'laptop';
  const searchResults = await scraper.searchProducts(searchTerm, 5);
  console.log(`Found ${searchResults.length} products for "${searchTerm}"`);
  
  // Save search results to file
  const searchResultsPath = path.join(__dirname, 'data', 'search_results.json');
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  fs.writeFileSync(searchResultsPath, JSON.stringify(searchResults, null, 2));
  console.log(`Saved search results to ${searchResultsPath}`);
  
  // Example: Get product details for the first result
  if (searchResults.length > 0) {
    const productId = searchResults[0].id;
    console.log(`Getting details for product ${productId}...`);
    const productDetails = await scraper.getProductDetails(productId);
    
    if (productDetails) {
      const productDetailsPath = path.join(__dirname, 'data', `product_${productId}.json`);
      fs.writeFileSync(productDetailsPath, JSON.stringify(productDetails, null, 2));
      console.log(`Saved product details to ${productDetailsPath}`);
    } else {
      console.log(`Failed to get details for product ${productId}`);
    }
  }
};

// Run the scraper
runScraper().catch(error => {
  console.error('Error running scraper:', error);
});