import { EnhancedSpecification, NormalizedValue } from '../../types/specifications';

// Define normalization rules for different types of specifications
interface NormalizationRule {
  pattern: RegExp;
  extractValue: (match: RegExpMatchArray) => number;
  extractUnit: (match: RegExpMatchArray) => string;
  targetUnit: string;
  conversionFactor: (sourceUnit: string) => number;
}

// Define processor information structure
interface ProcessorInfo {
  brand: string;
  series: string | number;
  model: string | number;
  generation?: number;
  cores?: number;
  frequency?: number;
  suffix?: string;
}

// Define dimension information structure
interface DimensionInfo {
  length: number;
  width: number;
  height: number;
  unit: string;
  volume?: number;
}

export class SpecificationNormalizer {
  // Storage normalization rules
  private storageRules: NormalizationRule = {
    pattern: /(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB|PB)/i,
    extractValue: (match) => parseFloat(match[1]),
    extractUnit: (match) => match[2].toLowerCase(),
    targetUnit: 'mb',
    conversionFactor: (unit) => {
      switch (unit.toLowerCase()) {
        case 'kb': return 1/1024;
        case 'mb': return 1;
        case 'gb': return 1024;
        case 'tb': return 1024 * 1024;
        case 'pb': return 1024 * 1024 * 1024;
        default: return 1;
      }
    }
  };
  
  // Weight normalization rules
  private weightRules: NormalizationRule = {
    pattern: /(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds)/i,
    extractValue: (match) => parseFloat(match[1]),
    extractUnit: (match) => match[2].toLowerCase(),
    targetUnit: 'g',
    conversionFactor: (unit) => {
      const lowerUnit = unit.toLowerCase();
      if (lowerUnit.startsWith('kg') || lowerUnit.startsWith('kilo')) return 1000;
      if (lowerUnit.startsWith('oz') || lowerUnit.startsWith('ounce')) return 28.35;
      if (lowerUnit.startsWith('lb') || lowerUnit.startsWith('pound')) return 453.59;
      return 1; // grams
    }
  };
  
  // Dimension normalization rules
  private dimensionRules: NormalizationRule = {
    pattern: /(\d+(?:\.\d+)?)\s*(mm|cm|m|in|inch|inches|ft|feet)/i,
    extractValue: (match) => parseFloat(match[1]),
    extractUnit: (match) => match[2].toLowerCase(),
    targetUnit: 'mm',
    conversionFactor: (unit) => {
      const lowerUnit = unit.toLowerCase();
      if (lowerUnit.startsWith('cm')) return 10;
      if (lowerUnit.startsWith('m') && !lowerUnit.startsWith('mm')) return 1000;
      if (lowerUnit.startsWith('in') || lowerUnit === 'inch' || lowerUnit === 'inches') return 25.4;
      if (lowerUnit.startsWith('ft') || lowerUnit === 'feet') return 304.8;
      return 1; // mm
    }
  };
  
  // Main normalization pipeline
  normalizeSpecification(spec: EnhancedSpecification, productCategory: string): EnhancedSpecification {
    // Create a copy of the spec to avoid mutating the original
    const normalizedSpec = { ...spec };
    
    // Apply category-specific normalization if available
    switch (productCategory.toLowerCase()) {
      case 'electronics':
      case 'computers':
      case 'laptops':
        return this.normalizeElectronicsSpec(normalizedSpec);
      case 'appliances':
        return this.normalizeApplianceSpec(normalizedSpec);
      default:
        // Apply generic normalization based on spec name
        return this.normalizeGenericSpec(normalizedSpec);
    }
  }
  
  // Category-specific normalizers
  normalizeElectronicsSpec(spec: EnhancedSpecification): EnhancedSpecification {
    const specName = spec.name.toLowerCase();
    
    if (specName.includes('storage') || specName.includes('ssd') || specName.includes('hdd') || specName.includes('ram') || specName.includes('memory')) {
      return this.normalizeStorageSpec(spec);
    } else if (specName.includes('processor') || specName.includes('cpu')) {
      return this.normalizeCpuSpec(spec);
    } else if (specName.includes('dimension') || specName.includes('size')) {
      return this.normalizeDimensionSpec(spec);
    } else if (specName.includes('weight')) {
      return this.normalizeWeightSpec(spec);
    } else if (specName.includes('battery')) {
      return this.normalizeBatterySpec(spec);
    } else if (specName.includes('display') || specName.includes('screen')) {
      return this.normalizeDisplaySpec(spec);
    } else if (specName.includes('resolution')) {
      return this.normalizeResolutionSpec(spec);
    } else if (specName.includes('refresh rate')) {
      return this.normalizeRefreshRateSpec(spec);
    }
    
    return spec;
  }
  
  normalizeApplianceSpec(spec: EnhancedSpecification): EnhancedSpecification {
    const specName = spec.name.toLowerCase();
    
    if (specName.includes('capacity')) {
      return this.normalizeCapacitySpec(spec);
    } else if (specName.includes('power') || specName.includes('wattage')) {
      return this.normalizePowerSpec(spec);
    } else if (specName.includes('dimension') || specName.includes('size')) {
      return this.normalizeDimensionSpec(spec);
    } else if (specName.includes('weight')) {
      return this.normalizeWeightSpec(spec);
    } else if (specName.includes('energy') || specName.includes('efficiency')) {
      return this.normalizeEnergyEfficiencySpec(spec);
    }
    
    return spec;
  }
  
  // Generic normalization based on spec name
  normalizeGenericSpec(spec: EnhancedSpecification): EnhancedSpecification {
    const specName = spec.name.toLowerCase();
    
    if (specName.includes('storage') || specName.includes('memory') || specName.includes('ram')) {
      return this.normalizeStorageSpec(spec);
    } else if (specName.includes('dimension') || specName.includes('size')) {
      return this.normalizeDimensionSpec(spec);
    } else if (specName.includes('weight')) {
      return this.normalizeWeightSpec(spec);
    } else if (specName.includes('processor') || specName.includes('cpu')) {
      return this.normalizeCpuSpec(spec);
    }
    
    return spec;
  }
  
  // Specialized normalizers
  normalizeStorageSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    const match = spec.value.match(this.storageRules.pattern);
    
    if (match) {
      const value = this.storageRules.extractValue(match);
      const unit = this.storageRules.extractUnit(match);
      const conversionFactor = this.storageRules.conversionFactor(unit);
      const normalizedValue = value * conversionFactor;
      
      return {
        ...spec,
        normalizedValue: {
          value: normalizedValue,
          unit: this.storageRules.targetUnit,
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeDimensionSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match patterns like "13.3 x 8.9 x 0.6 inches" or "338 x 226 x 15.2 mm"
    const dimensionRegex = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(inches|in|cm|mm)/i;
    const match = spec.value.match(dimensionRegex);
    
    if (match) {
      const [_, length, width, height, unit] = match;
      const normalizedUnit = 'mm'; // Normalize to mm
      
      const conversionFactor = this.getDimensionConversionFactor(unit, normalizedUnit);
      
      // Convert dimensions to mm
      const normalizedLength = parseFloat(length) * conversionFactor;
      const normalizedWidth = parseFloat(width) * conversionFactor;
      const normalizedHeight = parseFloat(height) * conversionFactor;
      
      // Calculate volume
      const volume = normalizedLength * normalizedWidth * normalizedHeight;
      
      const dimensions: DimensionInfo = {
        length: normalizedLength,
        width: normalizedWidth,
        height: normalizedHeight,
        unit: normalizedUnit,
        volume
      };
      
      return {
        ...spec,
        normalizedValue: dimensions,
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeWeightSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    const match = spec.value.match(this.weightRules.pattern);
    
    if (match) {
      const value = this.weightRules.extractValue(match);
      const unit = this.weightRules.extractUnit(match);
      const conversionFactor = this.weightRules.conversionFactor(unit);
      const normalizedValue = value * conversionFactor;
      
      return {
        ...spec,
        normalizedValue: {
          value: normalizedValue,
          unit: this.weightRules.targetUnit,
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeCpuSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Extract CPU generation and model if possible
    const intelRegex = /Intel\s+Core\s+(i\d)-(\d+)(\w*)/i;
    const amdRegex = /AMD\s+Ryzen\s+(\d)\s+(\d+)(\w*)/i;
    const appleRegex = /Apple\s+M(\d)(?:\s+(Pro|Max|Ultra))?/i;
    
    let match = spec.value.match(intelRegex);
    if (match) {
      const [_, series, model, suffix] = match;
      
      // Extract frequency if available
      const freqMatch = spec.value.match(/(\d+(?:\.\d+)?)\s*GHz/i);
      const frequency = freqMatch ? parseFloat(freqMatch[1]) : undefined;
      
      // Extract cores if available
      const coresMatch = spec.value.match(/(\d+)\s*cores?/i);
      const cores = coresMatch ? parseInt(coresMatch[1]) : undefined;
      
      const processorInfo: ProcessorInfo = {
        brand: 'Intel',
        series,
        model: parseInt(model),
        generation: parseInt(model.charAt(0)),
        cores,
        frequency,
        suffix: suffix || ''
      };
      
      return {
        ...spec,
        normalizedValue: processorInfo,
        valueType: 'categorical'
      };
    }
    
    match = spec.value.match(amdRegex);
    if (match) {
      const [_, series, model, suffix] = match;
      
      // Extract frequency if available
      const freqMatch = spec.value.match(/(\d+(?:\.\d+)?)\s*GHz/i);
      const frequency = freqMatch ? parseFloat(freqMatch[1]) : undefined;
      
      // Extract cores if available
      const coresMatch = spec.value.match(/(\d+)\s*cores?/i);
      const cores = coresMatch ? parseInt(coresMatch[1]) : undefined;
      
      const processorInfo: ProcessorInfo = {
        brand: 'AMD',
        series: parseInt(series),
        model: parseInt(model),
        cores,
        frequency,
        suffix: suffix || ''
      };
      
      return {
        ...spec,
        normalizedValue: processorInfo,
        valueType: 'categorical'
      };
    }
    
    match = spec.value.match(appleRegex);
    if (match) {
      const [_, series, variant] = match;
      
      // Extract cores if available
      const coresMatch = spec.value.match(/(\d+)\s*cores?/i);
      const cores = coresMatch ? parseInt(coresMatch[1]) : undefined;
      
      const processorInfo: ProcessorInfo = {
        brand: 'Apple',
        series: parseInt(series),
        model: parseInt(series),
        cores,
        suffix: variant || 'Standard'
      };
      
      return {
        ...spec,
        normalizedValue: processorInfo,
        valueType: 'categorical'
      };
    }
    
    return spec;
  }
  
  normalizeBatterySpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match patterns like "Up to 10 hours" or "10 hour battery life"
    const hourRegex = /(\d+(?:\.\d+)?)\s*hours?/i;
    const match = spec.value.match(hourRegex);
    
    if (match) {
      const hours = parseFloat(match[1]);
      
      return {
        ...spec,
        normalizedValue: {
          value: hours,
          unit: 'hours',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    // Match battery capacity in mAh or Wh
    const capacityRegex = /(\d+(?:\.\d+)?)\s*(mAh|Wh)/i;
    const capacityMatch = spec.value.match(capacityRegex);
    
    if (capacityMatch) {
      const [_, value, unit] = capacityMatch;
      const numValue = parseFloat(value);
      
      // Convert Wh to mAh if needed (approximate conversion)
      const normalizedValue = unit.toLowerCase() === 'wh' ? numValue * 250 : numValue;
      
      return {
        ...spec,
        normalizedValue: {
          value: normalizedValue,
          unit: 'mAh',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeDisplaySpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match screen size pattern like "13.3-inch" or "15.6 inch"
    const sizeRegex = /(\d+(?:\.\d+)?)["-]\s*inch/i;
    const sizeMatch = spec.value.match(sizeRegex);
    
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      
      // Also try to extract resolution if present
      const resolutionRegex = /(\d+)\s*[x×]\s*(\d+)/i;
      const resolutionMatch = spec.value.match(resolutionRegex);
      
      let resolution = null;
      if (resolutionMatch) {
        const width = parseInt(resolutionMatch[1]);
        const height = parseInt(resolutionMatch[2]);
        resolution = {
          width,
          height,
          pixels: width * height
        };
      }
      
      // Try to extract panel type (IPS, OLED, etc.)
      const panelTypes = ['IPS', 'OLED', 'AMOLED', 'LCD', 'LED', 'TN', 'VA', 'Mini-LED', 'Retina'];
      let panelType = null;
      
      for (const type of panelTypes) {
        if (spec.value.includes(type)) {
          panelType = type;
          break;
        }
      }
      
      return {
        ...spec,
        normalizedValue: {
          size,
          unit: 'inches',
          resolution,
          panelType,
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeResolutionSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match resolution pattern like "1920 x 1080" or "3840 x 2160"
    const resolutionRegex = /(\d+)\s*[x×]\s*(\d+)/i;
    const match = spec.value.match(resolutionRegex);
    
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      const pixels = width * height;
      
      // Determine common name (HD, Full HD, 4K, etc.)
      let commonName = '';
      if (width === 3840 && height === 2160) {
        commonName = '4K UHD';
      } else if (width === 2560 && height === 1440) {
        commonName = 'QHD';
      } else if (width === 1920 && height === 1080) {
        commonName = 'Full HD';
      } else if (width === 1280 && height === 720) {
        commonName = 'HD';
      }
      
      return {
        ...spec,
        normalizedValue: {
          width,
          height,
          pixels,
          commonName,
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    // Try to match common resolution names
    const resolutionNames: Record<string, { width: number; height: number }> = {
      '4k': { width: 3840, height: 2160 },
      'uhd': { width: 3840, height: 2160 },
      'qhd': { width: 2560, height: 1440 },
      'wqhd': { width: 2560, height: 1440 },
      'full hd': { width: 1920, height: 1080 },
      'fhd': { width: 1920, height: 1080 },
      'hd': { width: 1280, height: 720 }
    };
    
    const lowerValue = spec.value.toLowerCase();
    for (const [name, resolution] of Object.entries(resolutionNames)) {
      if (lowerValue.includes(name)) {
        return {
          ...spec,
          normalizedValue: {
            width: resolution.width,
            height: resolution.height,
            pixels: resolution.width * resolution.height,
            commonName: name.toUpperCase(),
            originalString: spec.value
          },
          valueType: 'numeric'
        };
      }
    }
    
    return spec;
  }
  
  normalizeRefreshRateSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match refresh rate pattern like "120 Hz" or "144Hz"
    const refreshRateRegex = /(\d+(?:\.\d+)?)\s*Hz/i;
    const match = spec.value.match(refreshRateRegex);
    
    if (match) {
      const rate = parseFloat(match[1]);
      
      return {
        ...spec,
        normalizedValue: {
          value: rate,
          unit: 'Hz',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeCapacitySpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match capacity patterns like "5.2 cu. ft." or "2.4 cubic feet"
    const capacityRegex = /(\d+(?:\.\d+)?)\s*(?:cu\.|cubic)\s*(?:ft\.|feet|foot)/i;
    const match = spec.value.match(capacityRegex);
    
    if (match) {
      const capacity = parseFloat(match[1]);
      
      return {
        ...spec,
        normalizedValue: {
          value: capacity,
          unit: 'cubic_feet',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    // Match liter capacity
    const literRegex = /(\d+(?:\.\d+)?)\s*(?:l|liter|liters)/i;
    const literMatch = spec.value.match(literRegex);
    
    if (literMatch) {
      const capacity = parseFloat(literMatch[1]);
      
      // Convert liters to cubic feet (1 cubic foot = 28.3168 liters)
      const cubicFeet = capacity / 28.3168;
      
      return {
        ...spec,
        normalizedValue: {
          value: capacity,
          convertedValue: cubicFeet,
          unit: 'liters',
          convertedUnit: 'cubic_feet',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizePowerSpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match power patterns like "1000W" or "1.5 kW"
    const powerRegex = /(\d+(?:\.\d+)?)\s*(w|watts?|kw|kilowatts?)/i;
    const match = spec.value.match(powerRegex);
    
    if (match) {
      const [_, value, unit] = match;
      const numValue = parseFloat(value);
      
      // Convert to watts
      let normalizedValue = numValue;
      if (unit.toLowerCase().startsWith('k')) {
        normalizedValue = numValue * 1000; // Convert kW to W
      }
      
      return {
        ...spec,
        normalizedValue: {
          value: normalizedValue,
          unit: 'watts',
          originalString: spec.value
        },
        valueType: 'numeric'
      };
    }
    
    return spec;
  }
  
  normalizeEnergyEfficiencySpec(spec: EnhancedSpecification): EnhancedSpecification {
    if (typeof spec.value !== 'string') return spec;
    
    // Match energy efficiency rating patterns like "A+++" or "Energy Star"
    const euRatingRegex = /([A-G][+]*)/i;
    const euMatch = spec.value.match(euRatingRegex);
    
    if (euMatch) {
      const rating = euMatch[1];
      
      // Convert EU energy rating to numeric score (A+++ = 7, A++ = 6, A+ = 5, A = 4, B = 3, etc.)
      let numericRating = 4 - (rating.charAt(0).toUpperCase().charCodeAt(0) - 65); // A=4, B=3, etc.
      const plusCount = (rating.match(/\+/g) || []).length;
      numericRating += plusCount;
      
      return {
        ...spec,
        normalizedValue: {
          value: numericRating,
          rating,
          originalString: spec.value
        },
        valueType: 'categorical'
      };
    }
    
    // Check for Energy Star certification
    if (spec.value.toLowerCase().includes('energy star')) {
      return {
        ...spec,
        normalizedValue: {
          value: 1,
          rating: 'Energy Star',
          originalString: spec.value
        },
        valueType: 'boolean'
      };
    }
    
    return spec;
  }
  
  // Helper methods for unit conversion
  getDimensionConversionFactor(fromUnit: string, toUnit: string): number {
    const unitFactors: Record<string, number> = {
      'mm': 1,
      'cm': 10,
      'in': 25.4,
      'inch': 25.4,
      'inches': 25.4,
      'ft': 304.8,
      'feet': 304.8,
      'm': 1000
    };
    
    const fromFactor = unitFactors[fromUnit.toLowerCase()] || 1;
    const toFactor = unitFactors[toUnit.toLowerCase()] || 1;
    
    return fromFactor / toFactor;
  }
  
  // Batch normalize multiple specifications
  normalizeSpecifications(specs: EnhancedSpecification[], productCategory: string): EnhancedSpecification[] {
    return specs.map(spec => this.normalizeSpecification(spec, productCategory));
  }
  
  // Determine confidence in normalization
  calculateNormalizationConfidence(original: EnhancedSpecification, normalized: EnhancedSpecification): number {
    // If no normalization was performed, low confidence
    if (!normalized.normalizedValue) return 0.5;
    
    // If the normalized value is the same as the original, medium confidence
    if (normalized.normalizedValue === original.value) return 0.7;
    
    // If we have a structured normalized value, high confidence
    if (typeof normalized.normalizedValue === 'object') return 0.9;
    
    // Default medium-high confidence
    return 0.8;
  }
}

// Create a singleton instance
export const specificationNormalizer = new SpecificationNormalizer();