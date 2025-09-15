import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { Product, Specification } from '../../types';

export class RobustAmazonScraper {
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  
  private proxyUrl: string | null;
  private requestDelay: number;
  private maxRetries: number;
  private lastRequestTime: number = 0;
  
  constructor(options: {
    proxyUrl?: string | null,
    requestDelay?: number,
    maxRetries?: number
  } = {}) {
    this.proxyUrl = options.proxyUrl || null;
    this.requestDelay = options.requestDelay || 1000; // 1 second delay between requests
    this.maxRetries = options.maxRetries || 3;
  }
  
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async throttledRequest(url: string, config: AxiosRequestConfig = {}): Promise<string> {
    // Ensure we're respecting rate limits
    const now = Date.now();
    const timeElapsed = now - this.lastRequestTime;
    
    if (timeElapsed < this.requestDelay) {
      await this.delay(this.requestDelay - timeElapsed);
    }
    
    this.lastRequestTime = Date.now();
    
    // Prepare request with random user agent
    const finalConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
        ...config.headers
      },
      timeout: 15000
    };
    
    let lastError: Error | null = null;
    
    // Implement retry logic
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const requestUrl = this.proxyUrl ? `${this.proxyUrl}${url}` : url;
        const response = await axios.get(requestUrl, finalConfig);
        
        // Check if we got a CAPTCHA page
        if (response.data.includes('captcha') || response.data.includes('robot check')) {
          throw new Error('CAPTCHA detected');
        }
        
        return response.data;
      } catch (error: any) {
        console.error(`Request attempt ${attempt + 1} failed for ${url}:`, error.message);
        lastError = error;
        
        // Exponential backoff
        const backoffDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await this.delay(backoffDelay);
        
        // Rotate user agent for next attempt
        finalConfig.headers = {
          ...finalConfig.headers,
          'User-Agent': this.getRandomUserAgent()
        };
      }
    }
    
    // All attempts failed
    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }
  
  async searchProducts(keyword: string, limit: number = 10): Promise<Product[]> {
    try {
      const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
      console.log(`Searching for "${keyword}" on Amazon...`);
      
      const html = await this.throttledRequest(searchUrl);
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Try multiple selectors for products
      const productSelectors = [
        'div[data-component-type="s-search-result"]',
        '.s-result-item[data-asin]',
        '[data-asin]:not([data-asin=""])' // Fallback selector
      ];
      
      // Find first selector that works
      let productElements;
      for (const selector of productSelectors) {
        productElements = $(selector);
        if (productElements.length > 0) {
          console.log(`Found ${productElements.length} products using selector: ${selector}`);
          break;
        }
      }
      
      if (!productElements || productElements.length === 0) {
        console.warn('No product elements found. HTML structure may have changed.');
        return [];
      }
      
      productElements.each((i, element) => {
        if (i >= limit) return false;
        
        // Get ASIN using multiple methods
        const asin = $(element).attr('data-asin') || 
                    $(element).attr('data-component-id') ||
                    this.extractAsinFromElement($, element);
        
        if (!asin) {
          console.warn('Could not extract ASIN for an element');
          return;
        }
        
        // Extract product data using multiple strategies
        const product = this.extractProductFromSearchResult($, element, asin);
        if (product) {
          products.push(product);
        }
      });
      
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  
  private extractAsinFromElement($: cheerio.CheerioAPI, element: cheerio.Element): string | null {
    // Try to find ASIN in links
    const links = $(element).find('a[href*="/dp/"]');
    for (let i = 0; i < links.length; i++) {
      const href = $(links[i]).attr('href');
      if (href) {
        const match = href.match(/\/dp\/([A-Z0-9]{10})/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    
    // Try other methods - data attributes, etc.
    return null;
  }
  
  private extractProductFromSearchResult($: cheerio.CheerioAPI, element: cheerio.Element, asin: string): Product | null {
    try {
      // Extract title using multiple selectors
      const titleSelectors = [
        'h2 a span',
        '.a-text-normal',
        '.a-link-normal .a-text-normal',
        'h2', // Fallback
        '.a-size-base-plus' // Another fallback
      ];
      
      let title = this.extractTextWithFallbacks($, element, titleSelectors).trim();
      if (!title) {
        console.warn(`Could not extract title for ASIN ${asin}`);
        return null;
      }
      
      // Extract brand from title or dedicated elements
      let brand = "Unknown";
      const brandSelectors = [
        '.a-row.a-size-base-plus .a-size-base',
        '.a-row .a-color-secondary',
        '.a-row .a-size-base.a-color-secondary'
      ];
      
      const extractedBrand = this.extractTextWithFallbacks($, element, brandSelectors).trim();
      if (extractedBrand && !extractedBrand.includes('by')) {
        brand = extractedBrand;
      } else if (title) {
        // Extract from title as fallback
        const brandMatch = title.match(/^([\w\s]+?)\s+/);
        if (brandMatch) {
          brand = brandMatch[1].trim();
        }
      }
      
      // Extract price using multiple strategies
      const price = this.extractPrice($, element);
      
      // Extract original price if available
      const originalPrice = this.extractOriginalPrice($, element);
      
      // Extract rating and review count
      const { rating, reviewCount } = this.extractRating($, element);
      
      // Extract image URL
      const image = this.extractImage($, element);
      
      return {
        id: asin,
        title,
        brand,
        price: {
          current: price || 0,
          original: originalPrice,
          currency: 'USD'
        },
        rating: rating ? {
          value: rating,
          count: reviewCount || 0
        } : null,
        images: [
          {
            small: image || '',
            large: image ? this.convertToLargeImageUrl(image) : ''
          }
        ],
        specifications: [],
        description: '',
        features: []
      };
    } catch (error) {
      console.error(`Error extracting product data for ASIN ${asin}:`, error);
      return null;
    }
  }
  
  private extractTextWithFallbacks($: cheerio.CheerioAPI, element: cheerio.Element, selectors: string[]): string {
    for (const selector of selectors) {
      const found = $(element).find(selector);
      if (found.length > 0) {
        return found.first().text();
      }
    }
    return '';
  }
  
  private extractPrice($: cheerio.CheerioAPI, element: cheerio.Element): number | null {
    // Try multiple price selectors
    const priceSelectors = [
      '.a-price .a-offscreen',
      '.a-color-price',
      '.a-price',
      '[data-a-color="price"] .a-offscreen',
      '.a-price .a-text-price'
    ];
    
    const priceText = this.extractTextWithFallbacks($, element, priceSelectors);
    return this.parsePrice(priceText);
  }
  
  private extractOriginalPrice($: cheerio.CheerioAPI, element: cheerio.Element): number | null {
    // Try multiple selectors for original price
    const originalPriceSelectors = [
      '.a-price.a-text-price .a-offscreen',
      '.a-price.a-text-price',
      '.a-text-price .a-offscreen',
      '.a-price.a-text-strike',
      '.a-text-strike'
    ];
    
    const priceText = this.extractTextWithFallbacks($, element, originalPriceSelectors);
    return this.parsePrice(priceText);
  }
  
  private parsePrice(priceText: string): number | null {
    if (!priceText) return null;
    
    // Handle different price formats
    const match = priceText.match(/\$?([\d,]+\.?\d*)/);
    if (match && match[1]) {
      // Remove commas and convert to number
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }
  
  private extractRating($: cheerio.CheerioAPI, element: cheerio.Element): { rating: number | null, reviewCount: number | null } {
    // Try multiple rating selectors
    const ratingSelectors = [
      '.a-icon-star-small .a-icon-alt',
      '.a-icon-star .a-icon-alt',
      '.a-rating .a-icon-alt',
      'i.a-icon-star'
    ];
    
    const ratingText = this.extractTextWithFallbacks($, element, ratingSelectors);
    let rating: number | null = null;
    
    // Parse rating text using different patterns
    const ratingPatterns = [
      /(\d+(?:\.\d+)?) out of \d+/i,
      /(\d+(?:\.\d+)?) stars/i,
      /(\d+(?:\.\d+)?)/
    ];
    
    for (const pattern of ratingPatterns) {
      const match = ratingText.match(pattern);
      if (match && match[1]) {
        rating = parseFloat(match[1]);
        break;
      }
    }
    
    // Extract review count using multiple selectors
    const reviewCountSelectors = [
      'a .a-size-base',
      '.a-row a[href*="reviews"]',
      '.a-link-normal[href*="reviews"]'
    ];
    
    const reviewCountText = this.extractTextWithFallbacks($, element, reviewCountSelectors);
    let reviewCount: number | null = null;
    
    if (reviewCountText) {
      const match = reviewCountText.match(/([\d,]+)/);
      if (match && match[1]) {
        reviewCount = parseInt(match[1].replace(/,/g, ''), 10);
      }
    }
    
    return { rating, reviewCount };
  }
  
  private extractImage($: cheerio.CheerioAPI, element: cheerio.Element): string | null {
    // Try multiple image selectors
    const imageSelectors = [
      'img.s-image',
      '.s-image',
      '.a-section img',
      'img[srcset]',
      'img[data-image-index="0"]',
      'img'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = $(element).find(selector).first();
      if (imgElement.length) {
        // Try srcset first (higher quality images)
        const srcset = imgElement.attr('srcset');
        if (srcset) {
          const srcsetParts = srcset.split(',');
          // Get the largest image from srcset
          const lastSrc = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
          if (lastSrc) return lastSrc;
        }
        
        // Fallback to src
        const src = imgElement.attr('src');
        if (src) return src;
      }
    }
    
    return null;
  }
  
  private convertToLargeImageUrl(smallImageUrl: string): string {
    // Convert small Amazon image URL to large size
    return smallImageUrl
      .replace(/\._SL\d+_/, '._SL500_')  // Standard format
      .replace(/\._AC_US\d+_/, '._AC_SL500_')  // Alternate format
      .replace(/\._AC_UL\d+_/, '._AC_SL500_'); // Another format
  }
  
  // Get product details
  async getProductDetails(asin: string): Promise<Product | null> {
    try {
      const productUrl = `https://www.amazon.com/dp/${asin}`;
      console.log(`Getting details for product ${asin}...`);
      
      const html = await this.throttledRequest(productUrl);
      const $ = cheerio.load(html);
      
      // Extract basic product information
      const title = this.extractProductTitle($);
      if (!title) {
        console.warn(`Could not extract title for ASIN ${asin}, page may be invalid`);
        return null;
      }
      
      const brand = this.extractBrand($);
      const price = this.extractProductPrice($);
      const originalPrice = this.extractProductOriginalPrice($);
      const { rating, reviewCount } = this.extractProductRating($);
      const images = this.extractProductImages($);
      const description = this.extractDescription($);
      const features = this.extractFeatures($);
      const specifications = this.extractSpecifications($);
      
      return {
        id: asin,
        title,
        brand,
        price: {
          current: price || 0,
          original: originalPrice,
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
    } catch (error) {
      console.error(`Error getting product details for ${asin}:`, error);
      throw error;
    }
  }
  
  private extractProductTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const element = $(selector);
      if (element.length) {
        return element.text().trim();
      }
    }
    
    return '';
  }
  
  private extractBrand($: cheerio.CheerioAPI): string {
    // Try different selectors for brand extraction
    const brandSelectors = [
      '#bylineInfo',
      '#bylineInfo_feature_div',
      '.a-link-normal.contributorNameID',
      '#brand',
      '.a-section .a-spacing-none:contains("Brand") + span',
      'a[href*="/stores/"]'
    ];
    
    for (const selector of brandSelectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        // Clean up brand text
        const brandMatch = text.match(/(?:brand|from|by|sold by)[\s:]+(.+)/i) || [null, text];
        return brandMatch[1].trim();
      }
    }
    
    // Try table-based specifications
    const detailsRows = $('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, .a-expander-content table tr, #prodDetails table tr');
    let brand = null;
    
    detailsRows.each((i, row) => {
      const header = $(row).find('th, td.label').text().trim().toLowerCase();
      if (header.includes('brand') || header.includes('manufacturer')) {
        brand = $(row).find('td').text().trim();
        return false; // Break the loop
      }
    });
    
    return brand || 'Unknown';
  }
  
  private extractProductPrice($: cheerio.CheerioAPI): number | null {
    const priceSelectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '.a-color-price',
      '[data-a-color="price"] .a-offscreen',
      '#corePrice_feature_div .a-offscreen'
    ];
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        return this.parsePrice(element.text());
      }
    }
    
    // Try structured data
    try {
      const structuredData = $('script[type="application/ld+json"]').html();
      if (structuredData) {
        const data = JSON.parse(structuredData);
        if (data.offers?.price) {
          return parseFloat(data.offers.price);
        }
      }
    } catch (e) {
      console.warn("Failed to parse structured data for price");
    }
    
    return null;
  }
  
  private extractProductOriginalPrice($: cheerio.CheerioAPI): number | null {
    const originalPriceSelectors = [
      '.priceBlockStrikePriceString',
      '.a-text-price .a-offscreen',
      '.a-price.a-text-price span[aria-hidden]',
      '#listPrice',
      '#price',
      '.a-text-strike'
    ];
    
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const price = this.parsePrice(element.text());
        // Only return if original price is higher than 0
        if (price && price > 0) {
          return price;
        }
      }
    }
    
    return null;
  }
  
  private extractProductRating($: cheerio.CheerioAPI): { rating: number | null, reviewCount: number | null } {
    // Extract rating
    const ratingSelectors = [
      '#acrPopover .a-icon-alt',
      '.a-icon-star .a-icon-alt',
      'span[data-hook="rating-out-of-text"]',
      '#averageCustomerReviews .a-icon-alt'
    ];
    
    let rating: number | null = null;
    
    for (const selector of ratingSelectors) {
      const element = $(selector);
      if (element.length) {
        const ratingText = element.text().trim();
        const match = ratingText.match(/(\d+(?:\.\d+)?) out of \d+/i);
        if (match && match[1]) {
          rating = parseFloat(match[1]);
          break;
        }
      }
    }
    
    // Extract review count
    const reviewCountSelectors = [
      '#acrCustomerReviewText',
      '#reviewsMedley .a-color-secondary',
      '[data-hook="total-review-count"]'
    ];
    
    let reviewCount: number | null = null;
    
    for (const selector of reviewCountSelectors) {
      const element = $(selector);
      if (element.length) {
        const reviewText = element.text().trim();
        const match = reviewText.match(/([\d,]+)/);
        if (match && match[1]) {
          reviewCount = parseInt(match[1].replace(/,/g, ''), 10);
          break;
        }
      }
    }
    
    return { rating, reviewCount };
  }
  
  private extractProductImages($: cheerio.CheerioAPI): Product['images'] {
    const images: Product['images'] = [];
    
    // Try multiple image extraction strategies
    
    // Strategy 1: Extract from image gallery
    const altImageSelectors = [
      '#altImages .a-button-text img',
      '#imageBlock .a-spacing-small img',
      '#imageBlock .item img',
      '[data-hook="image-block-gallery"] img'
    ];
    
    for (const selector of altImageSelectors) {
      const imgElements = $(selector);
      if (imgElements.length > 0) {
        imgElements.each((i, img) => {
          const smallUrl = $(img).attr('src');
          if (smallUrl) {
            // Convert thumbnail URL to large image URL
            const largeUrl = this.convertToLargeImageUrl(smallUrl);
            images.push({
              small: smallUrl,
              large: largeUrl
            });
          }
        });
        
        // If we found images, break the loop
        if (images.length > 0) break;
      }
    }
    
    // Strategy 2: Extract from main image if no other images found
    if (images.length === 0) {
      const mainImageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '#mainImageContainer img',
        '[data-hook="main-image-container"] img',
        '.imgTagWrapper img'
      ];
      
      for (const selector of mainImageSelectors) {
        const imgElement = $(selector);
        if (imgElement.length) {
          const imgUrl = imgElement.attr('src') || imgElement.attr('data-old-hires');
          // Check 'data-a-dynamic-image' for multiple sizes
          const dynamicImageAttr = imgElement.attr('data-a-dynamic-image');
          
          if (dynamicImageAttr) {
            try {
              const dynamicImage = JSON.parse(dynamicImageAttr);
              const urls = Object.keys(dynamicImage);
              if (urls.length > 0) {
                // Sort by image dimensions to get the largest
                const sortedUrls = urls.sort((a, b) => {
                  const aDims = dynamicImage[a];
                  const bDims = dynamicImage[b];
                  return (bDims[0] * bDims[1]) - (aDims[0] * aDims[1]);
                });
                
                const largeUrl = sortedUrls[0];
                const smallUrl = urls.length > 1 ? sortedUrls[urls.length - 1] : largeUrl;
                
                images.push({
                  small: smallUrl,
                  large: largeUrl
                });
                break;
              }
            } catch (e) {
              console.warn("Failed to parse dynamic image data");
            }
          }
          
          if (imgUrl) {
            images.push({
              small: imgUrl,
              large: this.convertToLargeImageUrl(imgUrl)
            });
            break;
          }
        }
      }
    }
    
    return images;
  }
  
  private extractDescription($: cheerio.CheerioAPI): string {
    const descriptionSelectors = [
      '#productDescription p',
      '#feature-bullets .a-list-item',
      '.a-expander-content p',
      '#productDescription',
      '#aplus',
      '.aplus-v2 .aplus-module'
    ];
    
    for (const selector of descriptionSelectors) {
      const elements = $(selector);
      if (elements.length) {
        // Combine multiple elements
        let description = '';
        elements.each((i, el) => {
          description += $(el).text().trim() + ' ';
        });
        
        if (description.trim()) {
          return description.trim();
        }
      }
    }
    
    return 'No description available';
  }
  
  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = [];
    const featureSelectors = [
      '#feature-bullets .a-list-item',
      '.a-unordered-list .a-list-item',
      '#features .a-list-item',
      '[data-hook="feature-bullets"] li'
    ];
    
    for (const selector of featureSelectors) {
      const elements = $(selector);
      if (elements.length) {
        elements.each((i, item) => {
          const text = $(item).text().trim();
          if (text && !text.toLowerCase().includes('warranty') && !features.includes(text)) {
            features.push(text);
          }
        });
        
        if (features.length > 0) break;
      }
    }
    
    return features;
  }
  
  private extractSpecifications($: cheerio.CheerioAPI): Specification[] {
    const specifications: Specification[] = [];
    
    // Multiple specification extraction strategies
    
    // Strategy 1: Extract from product details table
    const tableSelectors = [
      '#productDetails_techSpec_section_1 tr',
      '#productDetails_detailBullets_sections1 tr',
      '.a-expander-content table tr',
      '#prodDetails table tr',
      '.prodDetTable tr',
      '.techSpecsTable tr'
    ];
    
    for (const selector of tableSelectors) {
      const rows = $(selector);
      if (rows.length > 0) {
        rows.each((i, row) => {
          const headerElement = $(row).find('th, .a-color-secondary');
          const valueElement = $(row).find('td:not(.a-color-secondary)');
          
          if (headerElement.length && valueElement.length) {
            const header = headerElement.text().trim();
            const value = valueElement.text().trim();
            
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
          }
        });
        
        // If we found specifications, break the loop
        if (specifications.length > 0) break;
      }
    }
    
    // Strategy 2: Extract from bullet points if no table found
    if (specifications.length === 0) {
      const bulletSelectors = [
        '#feature-bullets .a-list-item',
        '.a-unordered-list .a-list-item',
        '#features .a-list-item'
      ];
      
      for (const selector of bulletSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, item) => {
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
          
          if (specifications.length > 0) break;
        }
      }
    }
    
    // Strategy 3: Extract from detail bullets
    if (specifications.length === 0) {
      const bulletSelectors = ['#detailBullets_feature_div li'];
      
      for (const selector of bulletSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, item) => {
            const text = $(item).text().trim();
            // Format is usually "Name: Value"
            const match = text.match(/([^:]+):\s*(.+)/);
            
            if (match) {
              let [_, name, value] = match;
              name = name.replace(/‎/g, '').trim(); // Remove invisible characters
              value = value.replace(/‎/g, '').trim();
              
              if (name && value) {
                let category = 'other';
                if (/processor|cpu|ram|memory|storage|graphics|gpu/i.test(name)) {
                  category = 'technical';
                } else if (/dimensions|weight|color|material/i.test(name)) {
                  category = 'physical';
                } else if (/warranty|manufacturer|country/i.test(name)) {
                  category = 'administrative';
                }
                
                specifications.push({
                  id: name.toLowerCase().replace(/\s+/g, '_'),
                  name,
                  value,
                  category,
                  confidenceScore: 0.9,
                  source: 'extraction'
                });
              }
            }
          });
          
          if (specifications.length > 0) break;
        }
      }
    }
    
    // Strategy 4: Extract from structured data if available
    if (specifications.length === 0) {
      try {
        const structuredData = $('script[type="application/ld+json"]').html();
        if (structuredData) {
          const data = JSON.parse(structuredData);
          if (data.width || data.height || data.weight || data.depth) {
            if (data.width) {
              specifications.push({
                id: 'width',
                name: 'Width',
                value: data.width.toString(),
                category: 'physical',
                confidenceScore: 1.0,
                source: 'extraction'
              });
            }
            
            if (data.height) {
              specifications.push({
                id: 'height',
                name: 'Height',
                value: data.height.toString(),
                category: 'physical',
                confidenceScore: 1.0,
                source: 'extraction'
              });
            }
            
            if (data.depth) {
              specifications.push({
                id: 'depth',
                name: 'Depth',
                value: data.depth.toString(),
                category: 'physical',
                confidenceScore: 1.0,
                source: 'extraction'
              });
            }
            
            if (data.weight) {
              specifications.push({
                id: 'weight',
                name: 'Weight',
                value: data.weight.toString(),
                category: 'physical',
                confidenceScore: 1.0,
                source: 'extraction'
              });
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse structured data for specifications");
      }
    }
    
    return specifications;
  }
}