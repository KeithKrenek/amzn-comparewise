import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: "B09G9FPHY6",
    title: "Apple MacBook Pro 14-inch (2021) with M1 Pro Chip",
    brand: "Apple",
    price: {
      current: 1999.99,
      original: 2199.99,
      currency: "USD"
    },
    rating: {
      value: 4.8,
      count: 1245
    },
    images: [
      {
        small: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        large: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
        alt: "Apple MacBook Pro"
      }
    ],
    specifications: [
      {
        id: "processor",
        name: "Processor",
        value: "Apple M1 Pro",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "ram",
        name: "RAM",
        value: "16GB",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 16384
      },
      {
        id: "storage",
        name: "Storage",
        value: "512GB SSD",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 512000
      },
      {
        id: "display",
        name: "Display",
        value: "14-inch Liquid Retina XDR",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "battery",
        name: "Battery Life",
        value: "Up to 17 hours",
        category: "technical",
        confidenceScore: 0.9
      }
    ],
    description: "The Apple MacBook Pro 14-inch with the M1 Pro chip delivers groundbreaking performance and amazing battery life. Featuring a stunning Liquid Retina XDR display, a wide array of ports, and a 1080p FaceTime HD camera.",
    features: [
      "Apple M1 Pro chip for next-level performance",
      "16GB unified memory for fluid multitasking",
      "512GB SSD storage for fast file access",
      "14-inch Liquid Retina XDR display with extreme dynamic range",
      "Up to 17 hours of battery life",
      "Three Thunderbolt 4 ports, HDMI port, SDXC card slot, MagSafe 3 port"
    ]
  },
  {
    id: "B08N5KWB9H",
    title: "Dell XPS 13 (2022) - 13.4-inch FHD+ Touchscreen Laptop",
    brand: "Dell",
    price: {
      current: 1299.99,
      original: 1499.99,
      currency: "USD"
    },
    rating: {
      value: 4.6,
      count: 876
    },
    images: [
      {
        small: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        large: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
        alt: "Dell XPS 13 Laptop"
      }
    ],
    specifications: [
      {
        id: "processor",
        name: "Processor",
        value: "Intel Core i7-1195G7",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "ram",
        name: "RAM",
        value: "16GB LPDDR4x",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 16384
      },
      {
        id: "storage",
        name: "Storage",
        value: "512GB SSD",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 512000
      },
      {
        id: "display",
        name: "Display",
        value: "13.4-inch FHD+ (1920 x 1200) Touchscreen",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "battery",
        name: "Battery Life",
        value: "Up to 12 hours",
        category: "technical",
        confidenceScore: 0.9
      }
    ],
    description: "The Dell XPS 13 is a compact and powerful laptop featuring a stunning 13.4-inch FHD+ touchscreen display with InfinityEdge technology. Powered by an 11th Gen Intel Core i7 processor and 16GB of RAM for smooth multitasking.",
    features: [
      "11th Gen Intel Core i7-1195G7 processor",
      "16GB LPDDR4x RAM for efficient multitasking",
      "512GB SSD for fast storage",
      "13.4-inch FHD+ (1920 x 1200) InfinityEdge touchscreen",
      "Intel Iris Xe Graphics",
      "Thunderbolt 4 ports for high-speed connectivity",
      "Backlit keyboard and precision touchpad"
    ]
  },
  {
    id: "B08YKGXBC1",
    title: "Samsung Galaxy Book Pro 360 - 15.6\" AMOLED 2-in-1 Laptop",
    brand: "Samsung",
    price: {
      current: 1199.99,
      original: 1399.99,
      currency: "USD"
    },
    rating: {
      value: 4.5,
      count: 632
    },
    images: [
      {
        small: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        large: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
        alt: "Samsung Galaxy Book Pro 360"
      }
    ],
    specifications: [
      {
        id: "processor",
        name: "Processor",
        value: "Intel Core i7-1165G7",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "ram",
        name: "RAM",
        value: "16GB LPDDR4x",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 16384
      },
      {
        id: "storage",
        name: "Storage",
        value: "1TB SSD",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 1024000
      },
      {
        id: "display",
        name: "Display",
        value: "15.6-inch FHD AMOLED Touch",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "battery",
        name: "Battery Life",
        value: "Up to 16 hours",
        category: "technical",
        confidenceScore: 0.9
      }
    ],
    description: "The Samsung Galaxy Book Pro 360 is a versatile 2-in-1 laptop featuring a stunning 15.6-inch AMOLED touchscreen display. With its 360-degree hinge design, it can be used as a laptop or tablet, and includes an S Pen for creative work.",
    features: [
      "Intel Core i7-1165G7 processor",
      "16GB LPDDR4x RAM for smooth multitasking",
      "1TB SSD for ample storage",
      "15.6-inch FHD (1920 x 1080) AMOLED touchscreen",
      "Intel Iris Xe Graphics",
      "S Pen included for drawing and note-taking",
      "Wi-Fi 6E and Thunderbolt 4 connectivity",
      "Fingerprint reader for secure login"
    ]
  },
  {
    id: "B09127DDVT",
    title: "Microsoft Surface Laptop 4 - 13.5\" Touchscreen",
    brand: "Microsoft",
    price: {
      current: 1299.99,
      original: 1399.99,
      currency: "USD"
    },
    rating: {
      value: 4.4,
      count: 521
    },
    images: [
      {
        small: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        large: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
        alt: "Microsoft Surface Laptop 4"
      }
    ],
    specifications: [
      {
        id: "processor",
        name: "Processor",
        value: "AMD Ryzen 7 4980U",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "ram",
        name: "RAM",
        value: "16GB LPDDR4x",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 16384
      },
      {
        id: "storage",
        name: "Storage",
        value: "512GB SSD",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 512000
      },
      {
        id: "display",
        name: "Display",
        value: "13.5-inch PixelSense Touch (2256 x 1504)",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "battery",
        name: "Battery Life",
        value: "Up to 19 hours",
        category: "technical",
        confidenceScore: 0.9
      }
    ],
    description: "The Microsoft Surface Laptop 4 combines performance and portability with its sleek design and powerful AMD Ryzen processor. Featuring a high-resolution 13.5-inch PixelSense touchscreen display and all-day battery life.",
    features: [
      "AMD Ryzen 7 4980U processor with Radeon Graphics",
      "16GB LPDDR4x RAM for efficient multitasking",
      "512GB SSD for fast storage",
      "13.5-inch PixelSense touchscreen with 2256 x 1504 resolution",
      "Up to 19 hours of battery life",
      "Windows 11 operating system",
      "HD front-facing camera for video calls",
      "Alcantara or metal keyboard finish options"
    ]
  },
  {
    id: "B09JQMJFZP",
    title: "Lenovo ThinkPad X1 Carbon Gen 9 - 14\" Ultra-Thin Laptop",
    brand: "Lenovo",
    price: {
      current: 1649.99,
      original: 1849.99,
      currency: "USD"
    },
    rating: {
      value: 4.7,
      count: 412
    },
    images: [
      {
        small: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        large: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
        alt: "Lenovo ThinkPad X1 Carbon"
      }
    ],
    specifications: [
      {
        id: "processor",
        name: "Processor",
        value: "Intel Core i7-1185G7",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "ram",
        name: "RAM",
        value: "16GB LPDDR4x",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 16384
      },
      {
        id: "storage",
        name: "Storage",
        value: "1TB PCIe SSD",
        category: "technical",
        confidenceScore: 1.0,
        normalizedValue: 1024000
      },
      {
        id: "display",
        name: "Display",
        value: "14-inch 4K UHD (3840 x 2160) IPS",
        category: "technical",
        confidenceScore: 1.0
      },
      {
        id: "battery",
        name: "Battery Life",
        value: "Up to 16.5 hours",
        category: "technical",
        confidenceScore: 0.9
      }
    ],
    description: "The Lenovo ThinkPad X1 Carbon Gen 9 is a premium business laptop that combines lightweight portability with powerful performance. Featuring a stunning 14-inch 4K UHD display, Intel Evo platform, and enterprise-grade security features.",
    features: [
      "Intel Core i7-1185G7 processor with vPro",
      "16GB LPDDR4x RAM for smooth multitasking",
      "1TB PCIe SSD for fast storage",
      "14-inch 4K UHD (3840 x 2160) IPS display",
      "Intel Iris Xe Graphics",
      "Dolby Atmos speaker system",
      "Fingerprint reader and IR camera for secure login",
      "Military-grade durability (MIL-STD-810H certified)"
    ]
  }
];