export class PromptBuilder {
  // Build a prompt for extracting specifications
  buildExtractionPrompt(productDescription: string, category: string): string {
    return `
Extract product specifications from the following ${category} product description.
Return the specifications in a structured format with name, value, and category.

Product Description:
${productDescription}

For each specification, provide:
1. Name (e.g., "Processor", "RAM", "Storage")
2. Value (e.g., "Intel Core i7-1165G7", "16GB", "512GB SSD")
3. Category (e.g., "technical", "physical", "performance")
4. Confidence score (0.0-1.0)

Focus on extracting specifications related to:
- Technical specs (processor, memory, storage, graphics)
- Physical attributes (dimensions, weight, color)
- Display characteristics (size, resolution, technology)
- Battery information
- Connectivity options
- Audio features
- Camera specifications

Format your response as a JSON array of specification objects.
`;
  }
  
  // Build a prompt for comparing products
  buildComparisonPrompt(
    products: Record<string, { title: string; specs: Record<string, any> }>
  ): string {
    const productEntries = Object.entries(products)
      .map(([id, product]) => {
        const specsList = Object.entries(product.specs)
          .map(([name, value]) => `- ${name}: ${value}`)
          .join('\n');
        
        return `Product ID: ${id}
Title: ${product.title}
Specifications:
${specsList}
`;
      })
      .join('\n\n');
    
    return `
Compare the following products and identify the key differences and similarities.
For each significant difference, explain why it matters and how it might affect the user experience.

${productEntries}

In your analysis:
1. Identify the most important specifications that differ between products
2. Explain the real-world impact of these differences
3. Highlight which product is better for specific use cases
4. Note any specifications where one product is clearly superior

Format your response as a structured comparison with sections for each key specification category.
`;
  }
  
  // Build a prompt for explaining a specification
  buildExplanationPrompt(specName: string, context: string): string {
    return `
Explain the following product specification in simple terms: "${specName}"

Context about the product:
${context}

In your explanation:
1. Describe what this specification means
2. Explain why it matters to consumers
3. Provide context about what values are considered good or bad
4. Mention how this specification affects the user experience
5. Include any relevant technical details that would help a non-expert understand

Keep your explanation concise, informative, and accessible to someone without technical expertise.
`;
  }
  
  // Generate few-shot examples for better AI performance
  generateFewShotExamples(taskType: string, category: string): string {
    switch (taskType) {
      case 'extraction':
        return this.generateExtractionExamples(category);
      case 'comparison':
        return this.generateComparisonExamples(category);
      case 'explanation':
        return this.generateExplanationExamples(category);
      default:
        return '';
    }
  }
  
  // Generate examples for extraction
  private generateExtractionExamples(category: string): string {
    if (category === 'laptop' || category === 'computer') {
      return `
Example 1:
Input: "The MacBook Pro features an Apple M1 Pro chip, 16GB unified memory, and 512GB SSD storage. It has a 14-inch Liquid Retina XDR display and provides up to 17 hours of battery life."
Output: [
  {
    "name": "Processor",
    "value": "Apple M1 Pro",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "RAM",
    "value": "16GB",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Storage",
    "value": "512GB SSD",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Display",
    "value": "14-inch Liquid Retina XDR",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Battery Life",
    "value": "Up to 17 hours",
    "category": "technical",
    "confidenceScore": 0.85
  }
]

Example 2:
Input: "Dell XPS 13 with 11th Gen Intel Core i7-1185G7 processor, 16GB LPDDR4x RAM, and 1TB PCIe SSD. Features a 13.4-inch UHD+ (3840 x 2400) touch display and weighs just 2.8 pounds."
Output: [
  {
    "name": "Processor",
    "value": "Intel Core i7-1185G7",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "RAM",
    "value": "16GB LPDDR4x",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Storage",
    "value": "1TB PCIe SSD",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Display",
    "value": "13.4-inch UHD+ (3840 x 2400) touch",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Weight",
    "value": "2.8 pounds",
    "category": "physical",
    "confidenceScore": 0.9
  }
]
`;
    }
    
    // Default examples
    return `
Example 1:
Input: "Product X features 8GB of RAM, 256GB storage, and a 6.7-inch AMOLED display with 120Hz refresh rate. It has a 5000mAh battery that supports 65W fast charging."
Output: [
  {
    "name": "RAM",
    "value": "8GB",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Storage",
    "value": "256GB",
    "category": "technical",
    "confidenceScore": 0.95
  },
  {
    "name": "Display Size",
    "value": "6.7-inch",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Display Type",
    "value": "AMOLED",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Refresh Rate",
    "value": "120Hz",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Battery Capacity",
    "value": "5000mAh",
    "category": "technical",
    "confidenceScore": 0.9
  },
  {
    "name": "Charging Speed",
    "value": "65W fast charging",
    "category": "technical",
    "confidenceScore": 0.85
  }
]
`;
  }
  
  // Generate examples for comparison
  private generateComparisonExamples(category: string): string {
    return `
Example:
Input: Two laptops with different processors and RAM
Output: 
The key difference between these laptops is in their processing power and memory. 

Laptop A features an Intel Core i7 processor which offers better multi-core performance, making it more suitable for demanding tasks like video editing and 3D rendering. Its 16GB of RAM allows for smooth multitasking with multiple applications open simultaneously.

Laptop B has an Intel Core i5 processor which is still capable for everyday tasks like web browsing, document editing, and media consumption, but may struggle with more intensive workloads. The 8GB of RAM is sufficient for basic multitasking but may become a bottleneck when running memory-intensive applications.

For users who primarily use their laptop for productivity tasks, web browsing, and streaming, Laptop B offers sufficient performance at a likely lower price point. For professionals, content creators, or power users who need more processing power, Laptop A would be the better choice despite the potential price premium.
`;
  }
  
  // Generate examples for explanation
  private generateExplanationExamples(category: string): string {
    return `
Example 1:
Input: "RAM"
Output: RAM (Random Access Memory) is your computer's short-term memory that temporarily stores data the processor needs to access quickly. More RAM allows your computer to handle more applications simultaneously without slowing down. For everyday tasks like web browsing and document editing, 8GB is usually sufficient. For more demanding tasks like video editing or gaming, 16GB or more is recommended. RAM speed (measured in MHz) also matters, with faster RAM providing better performance, especially for tasks that require quick data access.

Example 2:
Input: "Processor"
Output: The processor (CPU) is essentially the brain of your computer, handling all the instructions and calculations needed to run programs. Key factors to consider are:

1. Cores: More cores allow the processor to handle more tasks simultaneously. Modern processors typically have 4-16 cores.

2. Clock speed: Measured in GHz, this indicates how many operations the processor can perform per second. Higher is generally better.

3. Generation: Newer generations (e.g., 12th Gen Intel vs. 11th Gen) typically offer better performance and efficiency.

For everyday use, a mid-range processor (like an Intel Core i5 or AMD Ryzen 5) is usually sufficient. For gaming or professional work like video editing, a higher-end processor (Intel Core i7/i9 or AMD Ryzen 7/9) would be beneficial.
`;
  }
}

// Create a singleton instance
export const promptBuilder = new PromptBuilder();