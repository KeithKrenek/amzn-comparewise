import { SpecificationComparison } from '../../types/specifications';

export class DifferenceExplainer {
  // Generate human-readable explanation of difference
  explainDifference(
    specName: string,
    values: any[],
    category: string
  ): string {
    if (values.length < 2) {
      return `No comparison available for ${specName}.`;
    }
    
    const lowerName = specName.toLowerCase();
    
    // Handle specific types of specifications
    if (lowerName.includes('processor') || lowerName.includes('cpu')) {
      return this.explainProcessorDifference(values);
    } else if (lowerName.includes('ram') || lowerName.includes('memory')) {
      return this.explainMemoryDifference(values);
    } else if (lowerName.includes('storage')) {
      return this.explainStorageDifference(values);
    } else if (lowerName.includes('display') || lowerName.includes('screen')) {
      return this.explainDisplayDifference(values, specName);
    } else if (lowerName.includes('battery')) {
      return this.explainBatteryDifference(values);
    } else if (lowerName.includes('weight')) {
      return this.explainWeightDifference(values);
    } else if (lowerName.includes('graphics') || lowerName.includes('gpu')) {
      return this.explainGraphicsDifference(values);
    } else if (lowerName.includes('resolution')) {
      return this.explainResolutionDifference(values);
    } else if (lowerName.includes('refresh rate')) {
      return this.explainRefreshRateDifference(values);
    } else if (lowerName.includes('ports') || lowerName.includes('connectivity')) {
      return this.explainConnectivityDifference(values);
    } else if (lowerName.includes('camera')) {
      return this.explainCameraDifference(values);
    } else if (lowerName.includes('audio') || lowerName.includes('speaker')) {
      return this.explainAudioDifference(values);
    }
    
    // Generic explanation for numeric values
    const numericValues = values
      .map(v => {
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v && 'value' in v) return v.value;
        if (typeof v === 'string') {
          const match = v.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : NaN;
        }
        return NaN;
      })
      .filter(v => !isNaN(v));
    
    if (numericValues.length >= 2) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const difference = max - min;
      const percentDifference = (difference / min) * 100;
      
      if (percentDifference > 50) {
        return `There's a significant difference in ${specName} (${percentDifference.toFixed(0)}% variation). This could substantially impact your experience with the product.`;
      } else if (percentDifference > 20) {
        return `There's a notable difference in ${specName} (${percentDifference.toFixed(0)}% variation). This may be important depending on your specific needs.`;
      } else {
        return `There's a minor difference in ${specName} (${percentDifference.toFixed(0)}% variation). This is unlikely to significantly impact your experience.`;
      }
    }
    
    // Generic explanation for non-numeric values
    const uniqueValues = new Set(values.map(v => String(v)));
    if (uniqueValues.size > 1) {
      return `The products have different ${specName} specifications. Consider which option better suits your needs.`;
    } else {
      return `All products have the same ${specName} specification.`;
    }
  }
  
  // Specialized explanation methods
  explainProcessorDifference(values: any[]): string {
    // Extract processor information
    const processors = values.map(v => String(v));
    const uniqueProcessors = new Set(processors);
    
    if (uniqueProcessors.size === 1) {
      return `All products use the same processor: ${processors[0]}.`;
    }
    
    // Check for different brands
    const intelProcessors = processors.filter(p => p.toLowerCase().includes('intel'));
    const amdProcessors = processors.filter(p => p.toLowerCase().includes('amd'));
    const appleProcessors = processors.filter(p => p.toLowerCase().includes('apple'));
    
    if (intelProcessors.length > 0 && amdProcessors.length > 0) {
      return `The products use different processor brands: some use Intel processors while others use AMD processors. This can affect compatibility with certain software and performance characteristics. Intel processors often excel in single-core performance, while AMD typically offers better multi-core performance for the price.`;
    }
    
    if ((intelProcessors.length > 0 || amdProcessors.length > 0) && appleProcessors.length > 0) {
      return `Some products use Apple Silicon processors while others use x86 processors (Intel/AMD). This is a fundamental architecture difference that affects software compatibility and performance characteristics. Apple Silicon offers excellent power efficiency and performance for optimized apps, but may require software emulation for some x86 applications.`;
    }
    
    // Check for different generations
    if (intelProcessors.length > 1) {
      const generations = intelProcessors.map(p => {
        const match = p.match(/i\d-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }).filter(g => g > 0);
      
      if (generations.length > 1) {
        const minGen = Math.min(...generations);
        const maxGen = Math.max(...generations);
        
        if (maxGen - minGen >= 2) {
          return `There's a significant difference in Intel processor generations (${maxGen - minGen} generations apart), which can substantially impact performance and power efficiency. Each generation typically brings 10-15% performance improvements and better power efficiency. The newer ${maxGen}th generation will provide better performance, especially for demanding tasks.`;
        } else {
          return `There's a difference in Intel processor generations (${minGen}th vs ${maxGen}th gen), which may affect performance and features. Newer generations typically offer better performance and power efficiency, though the difference may be modest for everyday tasks.`;
        }
      }
    }
    
    // Check for different AMD generations
    if (amdProcessors.length > 1) {
      const generations = amdProcessors.map(p => {
        const match = p.match(/Ryzen\s+(\d)/i);
        return match ? parseInt(match[1]) : 0;
      }).filter(g => g > 0);
      
      if (generations.length > 1) {
        const minGen = Math.min(...generations);
        const maxGen = Math.max(...generations);
        
        if (maxGen - minGen >= 2) {
          return `There's a significant difference in AMD Ryzen generations (${maxGen - minGen} generations apart), which can substantially impact performance and power efficiency. The newer Ryzen ${maxGen} will provide better performance, especially for multi-threaded applications and gaming.`;
        } else {
          return `There's a difference in AMD Ryzen generations (Ryzen ${minGen} vs Ryzen ${maxGen}), which may affect performance and features. Newer generations typically offer better performance and power efficiency.`;
        }
      }
    }
    
    // Check for different Apple Silicon generations
    if (appleProcessors.length > 1) {
      const generations = appleProcessors.map(p => {
        const match = p.match(/M(\d)/i);
        return match ? parseInt(match[1]) : 0;
      }).filter(g => g > 0);
      
      if (generations.length > 1) {
        const minGen = Math.min(...generations);
        const maxGen = Math.max(...generations);
        
        if (maxGen - minGen >= 1) {
          return `There's a difference in Apple Silicon generations (M${minGen} vs M${maxGen}), which can impact performance and power efficiency. The M${maxGen} chip offers significant improvements in processing power, graphics performance, and potentially battery life compared to the M${minGen}.`;
        }
      }
      
      // Check for different variants (Pro, Max, Ultra)
      const variants = appleProcessors.map(p => {
        if (p.includes('Ultra')) return 'Ultra';
        if (p.includes('Max')) return 'Max';
        if (p.includes('Pro')) return 'Pro';
        return 'Base';
      });
      
      if (new Set(variants).size > 1) {
        return `The products use different Apple Silicon variants (${variants.join(', ')}). The higher-tier variants (Ultra > Max > Pro > Base) offer more CPU cores, GPU cores, and memory bandwidth, which affects performance, especially for graphics-intensive tasks, video editing, and professional applications.`;
      }
    }
    
    // Check for different tiers (i3 vs i5 vs i7 vs i9)
    if (intelProcessors.length > 1) {
      const tiers = intelProcessors.map(p => {
        const match = p.match(/i(\d)/);
        return match ? parseInt(match[1]) : 0;
      }).filter(t => t > 0);
      
      if (tiers.length > 1) {
        const minTier = Math.min(...tiers);
        const maxTier = Math.max(...tiers);
        
        if (maxTier - minTier >= 2) {
          return `There's a significant difference in Intel processor tiers (i${minTier} vs i${maxTier}). Higher-tier processors (i9 > i7 > i5 > i3) offer more cores, higher clock speeds, and better performance. The i${maxTier} will provide substantially better performance, especially for demanding tasks like video editing, gaming, or running multiple applications simultaneously.`;
        } else {
          return `There's a difference in Intel processor tiers (i${minTier} vs i${maxTier}). The i${maxTier} typically offers better performance with more cores or higher clock speeds compared to the i${minTier}.`;
        }
      }
    }
    
    // Generic processor difference
    return `The products use different processors, which can affect overall performance, power efficiency, and compatibility with certain software. The processor is the brain of the computer, so this difference could significantly impact your experience depending on your usage needs.`;
  }
  
  explainMemoryDifference(values: any[]): string {
    // Extract memory sizes
     const memorySizes = values.map(v => {
      if (typeof v === 'object' && v && 'value' in v) {
        return v.value;
      }
      
      const str = String(v);
      const match = str.match(/(\d+)\s*(?:GB|MB|TB)/i);
      return match ? parseInt(match[1]) : 0;
    }).filter(size => size > 0);
    
    if (memorySizes.length < 2) {
      return `The products have different RAM configurations.`;
    }
    
    const minSize = Math.min(...memorySizes);
    const maxSize = Math.max(...memorySizes);
    
    // Check for memory type differences (DDR4 vs DDR5, etc.)
    const memoryTypes = values.map(v => {
      const str = String(v).toLowerCase();
      if (str.includes('ddr5')) return 'DDR5';
      if (str.includes('ddr4')) return 'DDR4';
      if (str.includes('ddr3')) return 'DDR3';
      if (str.includes('lpddr5')) return 'LPDDR5';
      if (str.includes('lpddr4')) return 'LPDDR4';
      return null;
    }).filter(Boolean);
    
    const uniqueTypes = new Set(memoryTypes);
    
    if (uniqueTypes.size > 1 && memoryTypes.length >= 2) {
      return `The products use different RAM technologies (${Array.from(uniqueTypes).join(' vs ')}). Newer memory standards like DDR5 offer higher bandwidth and potentially better performance than older standards like DDR4, though the real-world impact depends on your specific workloads.`;
    }
    
    if (maxSize / minSize >= 2) {
      return `There's a significant difference in RAM capacity (${minSize}GB vs ${maxSize}GB). The product with ${maxSize}GB will handle multitasking and memory-intensive applications much better. This is especially important for tasks like video editing, running virtual machines, or having many browser tabs open simultaneously. With ${minSize}GB, you might experience slowdowns when running multiple applications or working with large files.`;
    } else {
      return `There's a difference in RAM capacity (${minSize}GB vs ${maxSize}GB), which can affect multitasking performance and ability to run memory-intensive applications. More RAM generally means smoother performance when running multiple applications at once, though the difference between ${minSize}GB and ${maxSize}GB may not be noticeable for basic tasks like web browsing or document editing.`;
    }
  }
  
  explainStorageDifference(values: any[]): string {
    // Extract storage sizes
    const storageSizes = values.map(v => {
      if (typeof v === 'object' && v && 'value' in v) {
        return v.value;
      }
      
      const str = String(v);
      const match = str.match(/(\d+)\s*(?:GB|MB|TB)/i);
      if (!match) return 0;
      
      const size = parseInt(match[1]);
      const unit = match[2] ? match[2].toUpperCase() : 'GB'; // Default to GB if unit is missing
      
      // Convert to GB
      if (unit === 'TB') return size * 1024;
      if (unit === 'MB') return size / 1024;
      return size;
    }).filter(size => size > 0);
    
    if (storageSizes.length < 2) {
      return `The products have different storage configurations.`;
    }
    
    const minSize = Math.min(...storageSizes);
    const maxSize = Math.max(...storageSizes);
    
    // Check for SSD vs HDD
    const hasSSD = values.some(v => String(v).toLowerCase().includes('ssd'));
    const hasHDD = values.some(v => String(v).toLowerCase().includes('hdd'));
    
    if (hasSSD && hasHDD) {
      return `There's a fundamental difference in storage technology: some products use SSDs while others use HDDs. SSDs are significantly faster for file access, application loading, and system boot times (often 5-10x faster), while HDDs typically offer more storage capacity for the price. An SSD will make the entire system feel much more responsive, even if other specifications are similar.`;
    }
    
    // Check for NVMe vs SATA
    const hasNVMe = values.some(v => String(v).toLowerCase().includes('nvme'));
    const hasSATA = values.some(v => String(v).toLowerCase().includes('sata'));
    
    if (hasNVMe && hasSATA) {
      return `There's a difference in SSD technology: some products use NVMe SSDs while others use SATA SSDs. NVMe drives are substantially faster (3-7x) than SATA SSDs for sequential read/write operations, which can improve file transfers, application loading, and overall system responsiveness, especially when working with large files.`;
    }
    
    if (maxSize / minSize >= 4) {
      return `There's a substantial difference in storage capacity (${minSize}GB vs ${maxSize}GB). The product with ${maxSize}GB provides much more space for files, applications, and media. This is particularly important if you work with large files like videos or if you need to install many applications. With ${minSize}GB, you may need to regularly manage your storage or rely on external drives or cloud storage.`;
    } else if (maxSize / minSize >= 2) {
      return `There's a significant difference in storage capacity (${minSize}GB vs ${maxSize}GB), which affects how many files, applications, and media you can store. Consider your storage needs based on how you plan to use the device. For reference, modern operating systems typically use 20-40GB, and applications can range from a few hundred MB to tens of GB each.`;
    } else {
      return `There's a difference in storage capacity (${minSize}GB vs ${maxSize}GB), which may be important depending on your storage needs. More storage means more room for your files, photos, videos, and applications, though the difference between these capacities may not be critical for many users.`;
    }
  }
  
  explainDisplayDifference(values: any[], specName: string): string {
    const lowerName = specName.toLowerCase();
    
    // Handle screen size differences
    if (lowerName.includes('size')) {
      const sizes = values.map(v => {
        if (typeof v === 'object' && v && 'size' in v) {
          return v.size;
        }
        
        const str = String(v);
        const match = str.match(/(\d+(?:\.\d+)?)\s*(?:inch|")/i);
        return match ? parseFloat(match[1]) : 0;
      }).filter(size => size > 0);
      
      if (sizes.length < 2) {
        return `The products have different screen sizes.`;
      }
      
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      const difference = maxSize - minSize;
      
      if (difference >= 2) {
        return `There's a substantial difference in screen size (${minSize}" vs ${maxSize}"). This significantly affects the viewing experience and portability. Larger screens provide more workspace and better multimedia experience, while smaller screens make the device more portable and typically consume less battery. A ${difference}" difference is very noticeable and could impact your productivity and comfort, especially for tasks like spreadsheet work, video editing, or watching movies.`;
      } else if (difference >= 1) {
        return `There's a noticeable difference in screen size (${minSize}" vs ${maxSize}"), which affects both viewing experience and portability. Consider whether you prioritize screen real estate or a more compact device. This difference will be apparent in daily use, especially when viewing multiple windows side by side or watching videos.`;
      } else {
        return `There's a slight difference in screen size (${minSize}" vs ${maxSize}"), which may be noticeable in daily use but isn't likely to dramatically change your experience. The difference will be subtle and may not significantly impact usability or portability.`;
      }
    }
    
    // Check for panel type differences
    const panelTypes = ['IPS', 'OLED', 'AMOLED', 'LCD', 'LED', 'TN', 'VA', 'Mini-LED', 'Retina'];
    const detectedPanelTypes = new Set<string>();
    
    values.forEach(v => {
      const str = String(v);
      for (const type of panelTypes) {
        if (str.includes(type)) {
          detectedPanelTypes.add(type);
          break;
        }
      }
    });
    
    if (detectedPanelTypes.size > 1) {
      const types = Array.from(detectedPanelTypes);
      
      if (types.includes('OLED') || types.includes('AMOLED')) {
        return `The products use different display technologies (${types.join(' vs ')}). OLED/AMOLED displays offer perfect blacks, vibrant colors, and better contrast ratios (often 1,000,000:1 vs 1,000:1 for LCD), but may be more prone to burn-in over time. LCD/LED displays typically last longer, may be brighter, and don't suffer from burn-in, but have lower contrast ratios and less vibrant colors. The difference is especially noticeable when viewing dark content or using the device in low-light environments.`;
      } else if (types.includes('IPS') && types.includes('TN')) {
        return `The products use different LCD panel types (${types.join(' vs ')}). IPS panels offer better color accuracy and wider viewing angles than TN panels, but TN panels typically have faster response times which can be beneficial for gaming. The difference is most noticeable when viewing the screen from an angle or when color accuracy is important.`;
      } else {
        return `The products use different display panel types (${types.join(' vs ')}), which can affect color accuracy, viewing angles, and overall visual quality. This difference will impact your viewing experience, especially for color-sensitive work or when sharing the screen with others.`;
      }
    }
    
    // Check for brightness differences
    const brightnesses = values.map(v => {
      const str = String(v);
      const match = str.match(/(\d+)\s*nits/i);
      return match ? parseInt(match[1]) : 0;
    }).filter(b => b > 0);
    
    if (brightnesses.length >= 2) {
      const minBrightness = Math.min(...brightnesses);
      const maxBrightness = Math.max(...brightnesses);
      
      if (maxBrightness / minBrightness >= 1.5) {
        return `There's a significant difference in display brightness (${minBrightness} nits vs ${maxBrightness} nits). The brighter display will be much more visible in well-lit environments or outdoors. For reference, 300-350 nits is adequate for indoor use, 400-500 nits is good for bright indoor environments, and 600+ nits is better for outdoor visibility.`;
      }
    }
    
    // Generic display difference
    return `The products have different display specifications, which can affect visual quality, clarity, and viewing experience. The display is your primary interface with the device, so these differences could significantly impact your satisfaction with the product.`;
  }
  
  explainBatteryDifference(values: any[]): string {
    // Extract battery life in hours
    const batteryHours = values.map(v => {
      if (typeof v === 'object' && v && 'value' in v) {
        return v.value;
      }
      
      const str = String(v);
      const match = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
      return match ? parseFloat(match[1]) : 0;
    }).filter(hours => hours > 0);
    
    if (batteryHours.length < 2) {
      // Try to extract battery capacity
      const batteryCapacities = values.map(v => {
        const str = String(v);
        const match = str.match(/(\d+)\s*(?:mAh|Wh)/i);
        return match ? parseInt(match[1]) : 0;
      }).filter(capacity => capacity > 0);
      
      if (batteryCapacities.length >= 2) {
        const minCapacity = Math.min(...batteryCapacities);
        const maxCapacity = Math.max(...batteryCapacities);
        const percentDifference = ((maxCapacity - minCapacity) / minCapacity) * 100;
        
        if (percentDifference >= 30) {
          return `There's a significant difference in battery capacity (${minCapacity} vs ${maxCapacity} mAh/Wh). The larger battery should provide longer runtime, though actual battery life also depends on other factors like processor efficiency and display power consumption.`;
        } else {
          return `There's a difference in battery capacity (${minCapacity} vs ${maxCapacity} mAh/Wh), which may affect how long you can use the device on a single charge.`;
        }
      }
      
      return `The products have different battery specifications.`;
    }
    
    const minHours = Math.min(...batteryHours);
    const maxHours = Math.max(...batteryHours);
    const difference = maxHours - minHours;
    
    if (difference >= 5) {
      return `There's a substantial difference in battery life (${minHours} hours vs ${maxHours} hours). This can significantly impact how long you can use the device without charging, which is especially important for travel, commuting, or working away from power outlets. The device with ${maxHours} hours of battery life could last through an entire workday, while the ${minHours}-hour device might require mid-day charging.`;
    } else if (difference >= 2) {
      return `There's a noticeable difference in battery life (${minHours} hours vs ${maxHours} hours), which affects how long you can use the device on a single charge. Consider your typical usage patterns and access to power outlets when deciding. An extra ${difference} hours can be valuable during long meetings, flights, or days with heavy use.`;
    } else {
      return `There's a slight difference in battery life (${minHours} hours vs ${maxHours} hours), which may be important for extended use away from power outlets but isn't likely to dramatically change your experience for typical daily use.`;
    }
  }
  
  explainWeightDifference(values: any[]): string {
    // Extract weights
    const weights = values.map(v => {
      if (typeof v === 'object' && v && 'value' in v) {
        return v.value;
      }
      
      const str = String(v);
      let match = str.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i);
      if (match) {
        return parseFloat(match[1]) * 1000; // Convert to grams
      }
      
      match = str.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)/i);
      if (match) {
        return parseFloat(match[1]);
      }
      
      match = str.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/i);
      if (match) {
        return parseFloat(match[1]) * 453.59; // Convert to grams
      }
      
      match = str.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces?)/i);
      if (match) {
        return parseFloat(match[1]) * 28.35; // Convert to grams
      }
      
      return 0;
    }).filter(weight => weight > 0);
    
    if (weights.length < 2) {
      return `The products have different weight specifications.`;
    }
    
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const difference = maxWeight - minWeight;
    const percentDifference = (difference / minWeight) * 100;
    
    // Convert to appropriate units for display
    const displayMin = minWeight >= 1000 ? `${(minWeight / 1000).toFixed(2)} kg` : `${minWeight.toFixed(0)} g`;
    const displayMax = maxWeight >= 1000 ? `${(maxWeight / 1000).toFixed(2)} kg` : `${maxWeight.toFixed(0)} g`;
    
    if (percentDifference >= 50) {
      return `There's a substantial difference in weight (${displayMin} vs ${displayMax}). This can significantly impact portability and comfort during extended use. The lighter device will be much easier to carry around and hold for long periods. For laptops, this difference would be very noticeable in a backpack or when using the device on your lap.`;
    } else if (percentDifference >= 20) {
      return `There's a noticeable difference in weight (${displayMin} vs ${displayMax}), which affects portability and comfort during use. Consider how often you'll be carrying the device and for how long. The weight difference will be apparent when carrying the device in a bag or holding it for extended periods.`;
    } else {
      return `There's a slight difference in weight (${displayMin} vs ${displayMax}), which may be noticeable when carrying the device but isn't likely to dramatically change your experience. This difference would be subtle in daily use.`;
    }
  }
  
  explainGraphicsDifference(values: any[]): string {
    // Extract GPU information
    const gpus = values.map(v => String(v));
    const uniqueGpus = new Set(gpus);
    
    if (uniqueGpus.size === 1) {
      return `All products use the same graphics processor: ${gpus[0]}.`;
    }
    
    // Check for integrated vs dedicated
    const integratedGPUs = gpus.filter(g => 
      g.toLowerCase().includes('integrated') || 
      g.toLowerCase().includes('intel') || 
      g.toLowerCase().includes('iris') ||
      g.toLowerCase().includes('uhd')
    );
    
    const dedicatedGPUs = gpus.filter(g => 
      g.toLowerCase().includes('nvidia') || 
      g.toLowerCase().includes('geforce') || 
      g.toLowerCase().includes('rtx') || 
      g.toLowerCase().includes('gtx') ||
      g.toLowerCase().includes('radeon') && !g.toLowerCase().includes('integrated')
    );
    
    if (integratedGPUs.length > 0 && dedicatedGPUs.length > 0) {
      return `There's a significant difference in graphics capabilities: some products use integrated graphics while others have dedicated GPUs. Dedicated graphics processors like ${dedicatedGPUs[0]} offer substantially better performance (often 3-10x) for gaming, video editing, 3D rendering, and other graphics-intensive tasks compared to integrated solutions like ${integratedGPUs[0]}. This difference is critical if you plan to use the device for gaming, creative work, or any graphics-intensive applications.`;
    }
    
    // Check for different NVIDIA generations
    if (dedicatedGPUs.length > 1) {
      const rtxGPUs = dedicatedGPUs.filter(g => g.toLowerCase().includes('rtx'));
      const gtxGPUs = dedicatedGPUs.filter(g => g.toLowerCase().includes('gtx'));
      
      if (rtxGPUs.length > 0 && gtxGPUs.length > 0) {
        return `The products use different generations of NVIDIA graphics cards. RTX cards (${rtxGPUs[0]}) offer ray tracing capabilities and generally better performance than GTX cards (${gtxGPUs[0]}), which is important for modern games and graphics applications. Ray tracing provides more realistic lighting, shadows, and reflections in games and 3D applications, while the overall performance improvement can be 30-50% or more depending on the specific models.`;
      }
      
      // Check for different RTX series (20 vs 30 vs 40)
      const rtxSeries = rtxGPUs.map(g => {
        const match = g.match(/RTX\s+(\d+)/i);
        return match ? parseInt(match[1].substring(0, 1)) : 0;
      }).filter(s => s > 0);
      
      if (rtxSeries.length > 1 && new Set(rtxSeries).size > 1) {
        const minSeries = Math.min(...rtxSeries);
        const maxSeries = Math.max(...rtxSeries);
        
        return `The products use different series of NVIDIA RTX graphics cards (RTX ${minSeries}000 vs RTX ${maxSeries}000). Newer series offer better performance, more efficient power usage, and improved features. The performance difference can be substantial (30-70% depending on specific models), especially for demanding games and applications.`;
      }
    }
    
    // Check for different AMD generations
    if (dedicatedGPUs.filter(g => g.toLowerCase().includes('radeon')).length > 1) {
      const rdnaGPUs = dedicatedGPUs.filter(g => g.toLowerCase().includes('rdna'));
      const olderRadeons = dedicatedGPUs.filter(g => 
        g.toLowerCase().includes('radeon') && !g.toLowerCase().includes('rdna')
      );
      
      if (rdnaGPUs.length > 0 && olderRadeons.length > 0) {
        return `The products use different generations of AMD graphics cards. RDNA architecture cards offer better performance and efficiency compared to older Radeon architectures, which is important for gaming and graphics-intensive applications.`;
      }
    }
    
    // Generic GPU difference
    return `The products use different graphics processors, which can significantly affect performance in games, video editing, 3D rendering, and other graphics-intensive tasks. The graphics processor is crucial for visual applications, and this difference could substantially impact your experience depending on your usage needs.`;
  }
  
  explainResolutionDifference(values: any[]): string {
    // Extract resolution information
    const resolutions = values.map(v => {
      if (typeof v === 'object' && v && 'width' in v && 'height' in v) {
        return {
          width: v.width,
          height: v.height,
          pixels: v.width * v.height,
          text: `${v.width}x${v.height}`
        };
      }
      
      const str = String(v);
      const match = str.match(/(\d+)\s*[x×]\s*(\d+)/i);
      
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        return {
          width,
          height,
          pixels: width * height,
          text: `${width}x${height}`
        };
      }
      
      // Check for common resolution names
      if (str.toLowerCase().includes('4k') || str.toLowerCase().includes('uhd')) {
        return {
          width: 3840,
          height: 2160,
          pixels: 3840 * 2160,
          text: '4K (3840x2160)'
        };
      } else if (str.toLowerCase().includes('qhd') || str.toLowerCase().includes('1440p')) {
        return {
          width: 2560,
          height: 1440,
          pixels: 2560 * 1440,
          text: 'QHD (2560x1440)'
        };
      } else if (str.toLowerCase().includes('full hd') || str.toLowerCase().includes('fhd') || str.toLowerCase().includes('1080p')) {
        return {
          width: 1920,
          height: 1080,
          pixels: 1920 * 1080,
          text: 'Full HD (1920x1080)'
        };
      } else if (str.toLowerCase().includes('hd') || str.toLowerCase().includes('720p')) {
        return {
          width: 1280,
          height: 720,
          pixels: 1280 * 720,
          text: 'HD (1280x720)'
        };
      }
      
      return null;
    }).filter(Boolean);
    
    if (resolutions.length < 2) {
      return `The products have different screen resolutions.`;
    }
    
    // Sort by total pixels
    resolutions.sort((a, b) => a.pixels - b.pixels);
    
    const lowestRes = resolutions[0];
    const highestRes = resolutions[resolutions.length - 1];
    const pixelRatio = highestRes.pixels / lowestRes.pixels;
    
    if (pixelRatio >= 4) {
      return `There's a dramatic difference in screen resolution (${lowestRes.text} vs ${highestRes.text}). The higher resolution display has ${pixelRatio.toFixed(1)}x more pixels, resulting in much sharper text and images. This is especially noticeable when viewing detailed content like photos, videos, or when working with text documents. The higher resolution will provide a significantly clearer, more detailed image, though it may also consume more battery power.`;
    } else if (pixelRatio >= 2) {
      return `There's a significant difference in screen resolution (${lowestRes.text} vs ${highestRes.text}). The higher resolution display offers noticeably sharper text and images, which improves the viewing experience for photos, videos, and text. You'll be able to see more detail and enjoy a clearer image with the higher resolution display, though the difference may be less apparent at smaller screen sizes or typical viewing distances.`;
    } else {
      return `There's a difference in screen resolution (${lowestRes.text} vs ${highestRes.text}), which affects image sharpness and the amount of content that can be displayed. Higher resolution generally means clearer text and more detailed images, though the difference between these resolutions may be subtle depending on the screen size and your typical viewing distance.`;
    }
  }
  
  explainRefreshRateDifference(values: any[]): string {
    // Extract refresh rates
    const refreshRates = values.map(v => {
      if (typeof v === 'object' && v && 'value' in v) {
        return v.value;
      }
      
      const str = String(v);
      const match = str.match(/(\d+(?:\.\d+)?)\s*Hz/i);
      return match ? parseFloat(match[1]) : 0;
    }).filter(rate => rate > 0);
    
    if (refreshRates.length < 2) {
      return `The products have different screen refresh rates.`;
    }
    
    const minRate = Math.min(...refreshRates);
    const maxRate = Math.max(...refreshRates);
    
    if (maxRate >= 120 && minRate <= 60) {
      return `There's a substantial difference in refresh rate (${minRate}Hz vs ${maxRate}Hz). The higher refresh rate display (${maxRate}Hz) will provide much smoother animations, scrolling, and gameplay compared to the standard ${minRate}Hz display. This is especially noticeable in fast-paced games, when scrolling through content, or during any animation. The difference is immediately apparent to most users and can significantly enhance the perceived responsiveness of the device.`;
    } else if (maxRate >= 90 && minRate <= 60) {
      return `There's a noticeable difference in refresh rate (${minRate}Hz vs ${maxRate}Hz). The higher refresh rate display will provide smoother animations and more responsive interactions. The difference is most noticeable in gaming and fast-moving content, but also improves the general feeling of responsiveness throughout the user interface.`;
    } else if (maxRate > minRate) {
      return `There's a difference in refresh rate (${minRate}Hz vs ${maxRate}Hz). The higher refresh rate display will provide somewhat smoother animations, though the difference may be subtle for general use and more noticeable in specific scenarios like gaming.`;
    } else {
      return `The products have the same refresh rate (${minRate}Hz).`;
    }
  }
  
  explainConnectivityDifference(values: any[]): string {
    // Extract port information
    const ports = values.map(v => String(v));
    
    // Check for USB-C/Thunderbolt differences
    const hasThunderbolt = ports.some(p => p.toLowerCase().includes('thunderbolt'));
    const hasUSBC = ports.some(p => 
      p.toLowerCase().includes('usb-c') || 
      p.toLowerCase().includes('usb c') || 
      p.toLowerCase().includes('type-c')
    );
    const hasUSB3 = ports.some(p => 
      p.toLowerCase().includes('usb 3') || 
      p.toLowerCase().includes('usb3')
    );
    
    if (hasThunderbolt && hasUSBC && !ports.every(p => p.toLowerCase().includes('thunderbolt'))) {
      return `Some products have Thunderbolt ports while others only have standard USB-C. Thunderbolt offers much higher data transfer speeds (up to 40Gbps vs 10Gbps for USB 3.2), can support multiple 4K displays, and provides more power delivery options. This difference is important if you plan to connect external displays, high-speed storage devices, or docking stations.`;
    }
    
    // Check for HDMI/DisplayPort differences
    const hasHDMI = ports.some(p => p.toLowerCase().includes('hdmi'));
    const hasDisplayPort = ports.some(p => p.toLowerCase().includes('displayport'));
    
    if ((hasHDMI || hasDisplayPort) && !(ports.every(p => p.toLowerCase().includes('hdmi')) || ports.every(p => p.toLowerCase().includes('displayport')))) {
      return `The products have different video output options. Having dedicated video ports like HDMI or DisplayPort can make it easier to connect to external displays without adapters. Consider your needs for connecting to monitors, projectors, or TVs when evaluating these differences.`;
    }
    
    // Check for SD card reader
    const hasSDReader = ports.some(p => 
      p.toLowerCase().includes('sd card') || 
      p.toLowerCase().includes('sd reader')
    );
    
    if (hasSDReader && !ports.every(p => p.toLowerCase().includes('sd card') || p.toLowerCase().includes('sd reader'))) {
      return `Some products include an SD card reader while others don't. This can be important if you frequently transfer files from cameras, drones, or other devices that use SD cards. Without a built-in reader, you would need to use an external adapter.`;
    }
    
    // Check for Ethernet port
    const hasEthernet = ports.some(p => 
      p.toLowerCase().includes('ethernet') || 
      p.toLowerCase().includes('rj45')
    );
    
    if (hasEthernet && !ports.every(p => p.toLowerCase().includes('ethernet') || p.toLowerCase().includes('rj45'))) {
      return `Some products include an Ethernet port while others don't. A wired internet connection can provide more stable and faster networking compared to Wi-Fi, which may be important for online gaming, large file transfers, or video conferencing. Without a built-in port, you would need to use an adapter or dock.`;
    }
    
    // Generic connectivity difference
    return `The products have different port and connectivity options. This affects how you can connect peripherals, displays, and other devices. Consider which ports you regularly use and whether you're willing to use adapters if needed.`;
  }
  
  explainCameraDifference(values: any[]): string {
    // Extract camera resolutions
    const resolutions = values.map(v => {
      const str = String(v);
      const match = str.match(/(\d+(?:\.\d+)?)\s*(?:MP|megapixels?)/i);
      return match ? parseFloat(match[1]) : 0;
    }).filter(res => res > 0);
    
    if (resolutions.length >= 2) {
      const minRes = Math.min(...resolutions);
      const maxRes = Math.max(...resolutions);
      
      if (maxRes / minRes >= 2) {
        return `There's a significant difference in camera resolution (${minRes}MP vs ${maxRes}MP). The higher resolution camera will capture more detail, which is important for video conferencing, content creation, or any application where image quality matters. This difference will be noticeable in good lighting conditions.`;
      } else {
        return `There's a difference in camera resolution (${minRes}MP vs ${maxRes}MP), though the practical difference may be modest for typical video calls. Camera quality also depends on factors beyond resolution, such as sensor size and low-light performance.`;
      }
    }
    
    // Check for special features
    const hasIR = values.some(v => 
      String(v).toLowerCase().includes('ir') || 
      String(v).toLowerCase().includes('infrared') ||
      String(v).toLowerCase().includes('face recognition')
    );
    
    if (hasIR && !values.every(v => 
      String(v).toLowerCase().includes('ir') || 
      String(v).toLowerCase().includes('infrared') ||
      String(v).toLowerCase().includes('face recognition')
    )) {
      return `Some products include an IR (infrared) camera while others don't. IR cameras enable Windows Hello face recognition for secure, hands-free login. This adds convenience and security compared to traditional password login.`;
    }
    
    // Check for privacy features
    const hasPrivacyShutter = values.some(v => 
      String(v).toLowerCase().includes('privacy') || 
      String(v).toLowerCase().includes('shutter') ||
      String(v).toLowerCase().includes('cover')
    );
    
    if (hasPrivacyShutter && !values.every(v => 
      String(v).toLowerCase().includes('privacy') || 
      String(v).toLowerCase().includes('shutter') ||
      String(v).toLowerCase().includes('cover')
    )) {
      return `Some products include a physical privacy shutter or cover for the camera while others don't. This feature allows you to physically block the camera when not in use, providing peace of mind regarding privacy.`;
    }
    
    // Generic camera difference
    return `The products have different camera specifications, which can affect image quality for video calls, photos, and facial recognition. Consider how important camera quality is for your intended use.`;
  }
  
  explainAudioDifference(values: any[]): string {
    // Check for speaker count
    const speakerCounts = values.map(v => {
      const str = String(v);
      const match = str.match(/(\d+)\s*speakers?/i);
      return match ? parseInt(match[1]) : 0;
    }).filter(count => count > 0);
    
    if (speakerCounts.length >= 2) {
      const minCount = Math.min(...speakerCounts);
      const maxCount = Math.max(...speakerCounts);
      
      if (maxCount > minCount) {
        return `There's a difference in speaker configuration (${minCount} vs ${maxCount} speakers). More speakers typically provide better stereo separation, fuller sound, and potentially higher maximum volume. This difference will be noticeable when watching videos, playing games, or listening to music without headphones.`;
      }
    }
    
    // Check for special audio features
    const hasDolbyAtmos = values.some(v => 
      String(v).toLowerCase().includes('dolby atmos') || 
      String(v).toLowerCase().includes('atmos')
    );
    
    const hasDTS = values.some(v => 
      String(v).toLowerCase().includes('dts') || 
      String(v).toLowerCase().includes('digital theater systems')
    );
    
    if ((hasDolbyAtmos || hasDTS) && !(values.every(v => 
      String(v).toLowerCase().includes('dolby atmos') || 
      String(v).toLowerCase().includes('atmos') ||
      String(v).toLowerCase().includes('dts') || 
      String(v).toLowerCase().includes('digital theater systems')
    ))) {
      return `Some products include premium audio technologies like Dolby Atmos or DTS while others don't. These technologies provide more immersive, spatial audio that can enhance the experience when watching movies or playing games. The difference is most noticeable with content specifically mixed for these formats.`;
    }
    
    // Check for microphone array
    const hasMicArray = values.some(v => 
      String(v).toLowerCase().includes('array') || 
      String(v).toLowerCase().includes('multiple mic') ||
      String(v).toLowerCase().includes('dual mic')
    );
    
    if (hasMicArray && !values.every(v => 
      String(v).toLowerCase().includes('array') || 
      String(v).toLowerCase().includes('multiple mic') ||
      String(v).toLowerCase().includes('dual mic')
    )) {
      return `Some products include multiple microphones or a microphone array while others don't. Multiple microphones provide better noise cancellation and voice clarity during calls or voice commands, which is especially valuable in noisy environments.`;
    }
    
    // Generic audio difference
    return `The products have different audio specifications, which can affect sound quality for media consumption and calls. Audio quality can significantly impact your enjoyment when watching videos, playing games, or listening to music without headphones.`;
  }
  
  // Explain real-world impact of a specification difference
  explainImpact(
    specName: string,
    difference: number,
    category: string
  ): string {
    const lowerName = specName.toLowerCase();
    
    // Processor impact
    if (lowerName.includes('processor') || lowerName.includes('cpu')) {
      if (difference > 0.7) {
        return `This processor difference will dramatically impact overall system performance. You'll notice significantly faster response times, shorter loading times, and better multitasking capabilities with the superior processor. For demanding tasks like video editing, 3D rendering, or running virtual machines , the difference will be substantial - potentially cutting processing times by 30-50%. Even for everyday tasks like web browsing with multiple tabs, the better processor will provide a smoother experience.`;
      } else if (difference > 0.5) {
        return `This processor difference will significantly impact overall system performance, especially for demanding tasks like video editing, gaming, or running multiple applications simultaneously. The better processor will provide faster response times, shorter loading times, and better multitasking capabilities. For intensive workloads, you might see 15-30% better performance.`;
      } else {
        return `This processor difference may be noticeable in demanding applications but might not affect everyday tasks like web browsing or document editing. For most users, either processor should handle common tasks adequately, though the better one will provide some advantage in multitasking or occasional intensive work.`;
      }
    }
    
    // Memory impact
    if (lowerName.includes('ram') || lowerName.includes('memory')) {
      if (difference > 0.7) {
        return `The RAM difference will dramatically affect multitasking ability and performance with memory-intensive applications. With the higher RAM configuration, you can run significantly more applications simultaneously without slowdowns. Tasks like video editing, 3D rendering, virtual machines, or having dozens of browser tabs open will be much smoother. The lower RAM configuration may struggle with these tasks, causing noticeable lag or even application crashes.`;
      } else if (difference > 0.5) {
        return `The RAM difference will significantly affect multitasking ability and performance with memory-intensive applications like video editing, virtual machines, or modern games. More RAM allows the system to keep more applications and data readily accessible, reducing the need to read from slower storage. You'll notice the difference when working with large files or running multiple applications simultaneously.`;
      } else {
        return `The RAM difference may impact performance when running multiple applications simultaneously or working with large files. For basic tasks, the difference might not be noticeable, but it could become apparent under heavier workloads like having many browser tabs open or editing large documents.`;
      }
    }
    
    // Storage impact
    if (lowerName.includes('storage')) {
      if (difference > 0.7) {
        return `The storage difference will dramatically affect both capacity and potentially performance. With the larger storage, you'll have much more room for applications, media files, and documents without needing to constantly manage space. This is especially important for video collections, large games, or professional work with large file sizes. Additionally, if the storage technologies differ (SSD vs HDD or NVMe vs SATA), the performance impact could be substantial, affecting boot times, application loading, and file transfers.`;
      } else if (difference > 0.5) {
        return `The storage capacity difference will significantly affect how many applications, files, photos, and videos you can store on the device. Running out of storage can force you to delete content or use external storage solutions, which can be inconvenient. Consider your typical usage patterns and how much data you need to store locally when evaluating this difference.`;
      } else {
        return `The storage capacity difference may become noticeable over time as you accumulate files and install applications. Consider your typical storage needs when deciding if this difference matters to you. Most users can manage with less storage through cloud services or external drives, but having more built-in storage is always more convenient.`;
      }
    }
    
    // Display impact
    if (lowerName.includes('display') || lowerName.includes('screen')) {
      if (difference > 0.7) {
        return `This display difference will dramatically impact visual quality, clarity, and your overall viewing experience. The superior display will provide much better color accuracy, contrast, brightness, or resolution, which affects everything you do on the device. For tasks like photo editing, watching videos, or reading text, the difference will be immediately apparent and could significantly affect your productivity and enjoyment of the device.`;
      } else if (difference > 0.5) {
        return `This display difference will significantly impact visual quality, clarity, and your overall viewing experience, especially for tasks like photo editing, watching videos, or reading text. A better display can reduce eye strain during extended use and provide a more immersive experience. The difference will be noticeable in daily use and could affect your long-term satisfaction with the device.`;
      } else {
        return `This display difference may be noticeable when viewing high-resolution content or doing detail-oriented work. For casual use, the difference might be subtle, but could still affect your experience during extended use. Consider how much time you spend looking at the screen when evaluating the importance of this difference.`;
      }
    }
    
    // Battery impact
    if (lowerName.includes('battery')) {
      if (difference > 0.7) {
        return `The battery life difference will dramatically impact how you use the device. The longer-lasting battery could potentially get you through multiple days of use versus needing to charge daily with the shorter-lasting option. This difference is crucial for travel, commuting, or any situation where you're away from power outlets for extended periods. It could fundamentally change how you use the device and your need to carry chargers or power banks.`;
      } else if (difference > 0.5) {
        return `The battery life difference will significantly impact how long you can use the device away from a power outlet, which is especially important for travel or mobile work. This difference could mean the difference between needing to find a charger mid-day versus being able to work through an entire day on a single charge. Consider your typical usage patterns and access to power outlets when evaluating this difference.`;
      } else {
        return `The battery life difference may be noticeable during all-day use or when traveling. While not dramatic, even a small difference in battery life can be valuable in situations where you don't have easy access to power. Consider how often you'll be using the device away from power outlets.`;
      }
    }
    
    // Weight impact
    if (lowerName.includes('weight')) {
      if (difference > 0.7) {
        return `The weight difference will be very significant and immediately noticeable. The lighter device will be much more comfortable to carry and use for extended periods, potentially changing how and where you use the device. This difference is especially important if you frequently travel with the device or use it while standing or holding it. Over time, even a few hundred grams can make a substantial difference in comfort and usability.`;
      } else if (difference > 0.5) {
        return `The weight difference will be very noticeable when carrying the device and may impact comfort during extended use. If you frequently travel with the device or carry it in a bag throughout the day, this difference will be meaningful. Consider how portable you need the device to be when evaluating this difference.`;
      } else {
        return `The weight difference may be slightly noticeable when carrying the device for extended periods. While not dramatic, weight can affect comfort during long usage sessions or when traveling. Consider your mobility needs when evaluating the importance of this difference.`;
      }
    }
    
    // Graphics impact
    if (lowerName.includes('graphics') || lowerName.includes('gpu')) {
      if (difference > 0.7) {
        return `This graphics difference will dramatically impact performance in visual applications. For gaming, the superior GPU could mean the difference between smooth gameplay at high settings versus stuttering at low settings. For creative work like video editing or 3D modeling, render times could be reduced by 50% or more. This is one of the most significant factors for visual performance and will be immediately noticeable in demanding applications.`;
      } else if (difference > 0.5) {
        return `This graphics difference will significantly impact performance in games, video editing, 3D rendering, and other graphics-intensive tasks. The better GPU will provide smoother framerates, faster render times, and support for more advanced visual features. If you use the device for any visual creative work or gaming, this difference will be important.`;
      } else {
        return `This graphics difference may be noticeable in some games and graphics applications, though the impact might be modest for casual use. For basic tasks and light gaming, either option should perform adequately, but more demanding applications will benefit from the better graphics processor.`;
      }
    }
    
    // Resolution impact
    if (lowerName.includes('resolution')) {
      if (difference > 0.7) {
        return `This resolution difference will dramatically impact image clarity and detail. Text will be much sharper and easier to read, images will show significantly more detail, and the overall visual experience will be substantially better with the higher resolution. This difference is especially important for creative work, reading text, or enjoying high-definition content. The difference will be immediately apparent to most users.`;
      } else if (difference > 0.5) {
        return `This resolution difference will significantly impact image clarity and detail. Higher resolution means sharper text and images, which is particularly noticeable when reading or viewing photos. The difference will be visible in everyday use and could affect eye comfort during extended sessions.`;
      } else {
        return `This resolution difference may be noticeable when viewing detailed content, though the impact might be subtle depending on the screen size and viewing distance. For most everyday tasks, either resolution should provide a good experience, though the higher resolution offers some advantages for detailed work.`;
      }
    }
    
    // Refresh rate impact
    if (lowerName.includes('refresh rate')) {
      if (difference > 0.7) {
        return `This refresh rate difference will dramatically impact motion smoothness. The higher refresh rate will make all animations, scrolling, and interactions feel much more responsive and fluid. For gaming, it can provide a competitive advantage by showing more frames per second. Even for everyday use, the difference is immediately noticeable and can make the entire system feel faster, even if other specifications are identical.`;
      } else if (difference > 0.5) {
        return `This refresh rate difference will significantly impact how smooth animations and motion appear on screen. The higher refresh rate will provide a more responsive feel when scrolling, playing games, or watching videos with fast motion. Many users find that once they experience a higher refresh rate, it's difficult to go back to standard rates.`;
      } else {
        return `This refresh rate difference may be noticeable in fast-moving content like games or when scrolling quickly. While not dramatic for everyday use, the higher refresh rate does provide a smoother visual experience that some users appreciate, particularly gamers or those who are sensitive to motion.`;
      }
    }
    
    // Generic impact
    if (difference > 0.7) {
      return `This difference is very significant and will likely have a major impact on your experience with the product. It should be one of the primary factors in your decision-making process, as it will affect day-to-day usage in noticeable ways.`;
    } else if (difference > 0.4) {
      return `This difference is notable and may be important depending on your specific needs and usage patterns. Consider how this feature aligns with your priorities when making your decision.`;
    } else {
      return `This difference is minor and may not significantly impact most users' experience with the product. While worth noting, it probably shouldn't be a deciding factor unless this specific feature is particularly important to you.`;
    }
  }
  
  // Generate recommendation based on differences
  generateRecommendation(
    significantDifferences: SpecificationComparison[],
    userPreferences: Record<string, number> = {}
  ): string {
    if (significantDifferences.length === 0) {
      return `The products are very similar in their key specifications. Consider choosing based on price, brand preference, design, or warranty options. When products have similar technical specifications, subjective factors like keyboard feel, build quality, or customer service can become more important differentiators.`;
    }
    
    // Find the most significant differences
    const topDifferences = significantDifferences
      .sort((a, b) => {
        // Apply user preferences if available
        const aImportance = userPreferences[a.name.toLowerCase()] || a.differenceSignificance;
        const bImportance = userPreferences[b.name.toLowerCase()] || b.differenceSignificance;
        return bImportance - aImportance;
      })
      .slice(0, 3);
    
    let recommendation = `Based on the comparison, the most significant differences are in `;
    recommendation += topDifferences.map(d => d.name).join(', ');
    recommendation += `. `;
    
    // Add specific recommendations for each top difference
    topDifferences.forEach(diff => {
      const bestProductId = diff.differences.find(d => d.isBest)?.productId;
      
      if (bestProductId) {
        recommendation += `For ${diff.name}, the product with ID ${bestProductId} offers the best specification. `;
      } else {
        recommendation += `For ${diff.name}, consider which option best meets your needs. `;
      }
    });
    
    // Add use case recommendations
    recommendation += `\n\nConsider your primary use case when making your decision:\n\n`;
    
    // Check for processor/performance differences
    if (significantDifferences.some(d => 
      d.name.toLowerCase().includes('processor') || 
      d.name.toLowerCase().includes('cpu') ||
      d.name.toLowerCase().includes('ram') ||
      d.name.toLowerCase().includes('memory')
    )) {
      recommendation += `- For demanding tasks like video editing, programming, or running virtual machines, prioritize better processor and more RAM.\n`;
    }
    
    // Check for graphics differences
    if (significantDifferences.some(d => 
      d.name.toLowerCase().includes('graphics') || 
      d.name.toLowerCase().includes('gpu')
    )) {
      recommendation += `- For gaming or creative work, the graphics processor should be a primary consideration.\n`;
    }
    
    // Check for battery/weight differences
    if (significantDifferences.some(d => 
      d.name.toLowerCase().includes('battery') || 
      d.name.toLowerCase().includes('weight')
    )) {
      recommendation += `- For portability and travel use, prioritize longer battery life and lighter weight.\n`;
    }
    
    // Check for display differences
    if (significantDifferences.some(d => 
      d.name.toLowerCase().includes('display') || 
      d.name.toLowerCase().includes('screen') ||
      d.name.toLowerCase().includes('resolution')
    )) {
      recommendation += `- For content consumption or creative work, display quality should be a key consideration.\n`;
    }
    
    recommendation += `\nUltimately, the best choice depends on which specifications matter most for your specific needs and budget.`;
    
    return recommendation;
  }
  
  // Generate comparison summary
  generateSummary(
    products: Product[],
    significantDifferences: SpecificationComparison[]
  ): string {
    if (products.length < 2) {
      return `At least two products are needed for comparison.`;
    }
    
    if (significantDifferences.length === 0) {
      return `The ${products.length} products being compared are very similar in their key specifications.`;
    }
    
    let summary = `Comparing ${products.length} products: `;
    summary += products.map(p => p.brand + ' ' + p.title.substring(0, 20) + '...').join(', ');
    summary += `. `;
    
    // Summarize key differences
    summary += `Key differences were found in `;
    summary += significantDifferences
      .slice(0, 5)
      .map(d => d.name)
      .join(', ');
    
    if (significantDifferences.length > 5) {
      summary += `, and ${significantDifferences.length - 5} other specifications`;
    }
    
    summary += `. `;
    
    // Add price comparison if available
    const pricesAvailable = products.every(p => p.price && p.price.current);
    if (pricesAvailable) {
      const prices = products.map(p => p.price.current);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (maxPrice > minPrice) {
        const priceDifference = ((maxPrice - minPrice) / minPrice) * 100;
        summary += `There's a ${priceDifference.toFixed(0)}% price difference between the least and most expensive options. `;
      } else {
        summary += `All products are priced similarly. `;
      }
    }
    
    // Add a conclusion about the most important factor
    const mostSignificantDifference = significantDifferences[0];
    if (mostSignificantDifference) {
      summary += `The most significant difference is in ${mostSignificantDifference.name}, which could substantially impact your experience with the product.`;
    }
    
    return summary;
  }
}

// Create a singleton instance
export const differenceExplainer = new DifferenceExplainer();