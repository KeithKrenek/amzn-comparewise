import { EnhancedSpecification } from '../../types/specifications';

export class SpecificationMatcher {
  // Common specification name variations
  private specNameVariations: Record<string, string[]> = {
    'processor': ['cpu', 'processor', 'chip', 'chipset'],
    'memory': ['ram', 'memory', 'system memory'],
    'storage': ['storage', 'ssd', 'hdd', 'hard drive', 'solid state drive'],
    'display': ['screen', 'display', 'monitor'],
    'graphics': ['gpu', 'graphics', 'graphics card', 'video card'],
    'battery': ['battery', 'battery life'],
    'weight': ['weight', 'mass'],
    'dimensions': ['dimensions', 'size', 'measurements'],
    'resolution': ['resolution', 'screen resolution', 'display resolution'],
    'refresh_rate': ['refresh rate', 'screen refresh', 'hz'],
    'operating_system': ['os', 'operating system'],
    'ports': ['ports', 'connectivity', 'io', 'inputs'],
    'camera': ['camera', 'webcam', 'front camera'],
    'keyboard': ['keyboard', 'keys'],
    'touchpad': ['touchpad', 'trackpad'],
    'wireless': ['wifi', 'wireless', 'bluetooth', 'connectivity'],
    'audio': ['audio', 'sound', 'speakers', 'microphone']
  };
  
  // Find equivalent specifications across products
  findMatchingSpecifications(specs1: EnhancedSpecification[], specs2: EnhancedSpecification[]): Map<string, string> {
    const matches = new Map<string, string>();
    
    // For each spec in the first set
    for (const spec1 of specs1) {
      let bestMatch: EnhancedSpecification | null = null;
      let bestScore = 0;
      
      // Compare with each spec in the second set
      for (const spec2 of specs2) {
        const similarity = this.calculateSpecSimilarity(spec1, spec2);
        
        if (similarity > bestScore && similarity > 0.7) { // Threshold for considering a match
          bestMatch = spec2;
          bestScore = similarity;
        }
      }
      
      // If we found a good match, add it to our matches
      if (bestMatch) {
        matches.set(spec1.id, bestMatch.id);
      }
    }
    
    return matches;
  }
  
  // Calculate similarity between two specifications
  calculateSpecSimilarity(spec1: EnhancedSpecification, spec2: EnhancedSpecification): number {
    // If names are exactly the same, high similarity
    if (spec1.name.toLowerCase() === spec2.name.toLowerCase()) {
      return 1.0;
    }
    
    // If categories are different, lower similarity
    if (spec1.category !== spec2.category) {
      return 0.3 * this.calculateNameSimilarity(spec1.name, spec2.name);
    }
    
    // Check if they're semantically equivalent
    if (this.areSpecsSemanticallyEquivalent(spec1, spec2)) {
      return 0.9;
    }
    
    // Calculate name similarity
    const nameSimilarity = this.calculateNameSimilarity(spec1.name, spec2.name);
    
    // If names are very similar, high similarity
    if (nameSimilarity > 0.8) {
      return nameSimilarity;
    }
    
    // If alternative names match, good similarity
    if (spec1.metadata.alternativeNames && spec2.metadata.alternativeNames) {
      for (const alt1 of spec1.metadata.alternativeNames) {
        for (const alt2 of spec2.metadata.alternativeNames) {
          if (alt1.toLowerCase() === alt2.toLowerCase()) {
            return 0.85;
          }
        }
      }
    }
    
    // Return weighted similarity
    return nameSimilarity * 0.7;
  }
  
  // Calculate similarity between two specification names
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();
    
    // Exact match
    if (n1 === n2) return 1.0;
    
    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) {
      return 0.9;
    }
    
    // Split into words and check for common words
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (word1.length < 3) continue; // Skip short words
      
      for (const word2 of words2) {
        if (word2.length < 3) continue;
        
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          commonWords++;
          break;
        }
      }
    }
    
    const totalWords = Math.max(words1.length, words2.length);
    return commonWords / totalWords;
  }
  
  // Check if specs are semantically similar despite name differences
  areSpecsSemanticallyEquivalent(spec1: EnhancedSpecification, spec2: EnhancedSpecification): boolean {
    const canonical1 = this.getCanonicalSpecName(spec1.name, spec1.category);
    const canonical2 = this.getCanonicalSpecName(spec2.name, spec2.category);
    
    return canonical1 === canonical2 && canonical1 !== '';
  }
  
  // Get canonical name for a specification
  getCanonicalSpecName(specName: string, category: string): string {
    const name = specName.toLowerCase();
    
    // Check each group of variations
    for (const [canonical, variations] of Object.entries(this.specNameVariations)) {
      for (const variation of variations) {
        if (name.includes(variation)) {
          return canonical;
        }
      }
    }
    
    // No match found
    return '';
  }
}

// Create a singleton instance
export const specificationMatcher = new SpecificationMatcher();