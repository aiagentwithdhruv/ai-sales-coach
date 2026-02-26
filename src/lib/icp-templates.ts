/**
 * ICP (Ideal Customer Profile) Templates
 *
 * Pre-built industry presets that auto-fill the ICP fields.
 * Used in setup wizard and settings for quick configuration.
 */

export interface ICPData {
  product_description: string;
  target_customer: string;
  website_url?: string;
  industry: string;
  company_size?: string;
  deal_size?: string;
  channels: string[];
}

export interface ICPTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  data: ICPData;
}

export const ICP_TEMPLATES: ICPTemplate[] = [
  {
    id: "saas-b2b",
    name: "SaaS B2B",
    description: "Software companies selling to other businesses",
    icon: "Monitor",
    data: {
      product_description: "B2B SaaS software",
      target_customer: "VP/Director level at 50-500 person tech companies",
      industry: "Technology / SaaS",
      company_size: "50-500 employees",
      deal_size: "$10K-100K ARR",
      channels: ["email", "linkedin"],
    },
  },
  {
    id: "agency",
    name: "Agency / Services",
    description: "Marketing, design, or consulting agencies",
    icon: "Briefcase",
    data: {
      product_description: "Professional services / consulting",
      target_customer: "Business owners and marketing directors at growing companies",
      industry: "Marketing / Consulting",
      company_size: "10-200 employees",
      deal_size: "$5K-50K per project",
      channels: ["email", "phone"],
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Online stores and D2C brands",
    icon: "ShoppingBag",
    data: {
      product_description: "E-commerce products / D2C brand",
      target_customer: "Online shoppers, social media buyers, repeat customers",
      industry: "E-commerce / Retail",
      company_size: "1-100 employees",
      deal_size: "$50-500 per order",
      channels: ["email", "whatsapp"],
    },
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Property sales, rentals, and real estate services",
    icon: "Home",
    data: {
      product_description: "Real estate properties and services",
      target_customer: "Home buyers, property investors, and renters in metro areas",
      industry: "Real Estate",
      company_size: "1-50 agents",
      deal_size: "$200K-2M per property",
      channels: ["phone", "email"],
    },
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical practices, healthtech, and wellness services",
    icon: "Heart",
    data: {
      product_description: "Healthcare services or medical technology",
      target_customer: "Practice managers, hospital administrators, healthcare CIOs",
      industry: "Healthcare",
      company_size: "10-500 staff",
      deal_size: "$25K-250K annual contract",
      channels: ["email", "phone"],
    },
  },
  {
    id: "financial-services",
    name: "Financial Services",
    description: "Insurance, wealth management, fintech",
    icon: "DollarSign",
    data: {
      product_description: "Financial products and advisory services",
      target_customer: "High-net-worth individuals, CFOs, business owners needing financial services",
      industry: "Financial Services",
      company_size: "10-1000 employees",
      deal_size: "$10K-500K AUM",
      channels: ["phone", "email"],
    },
  },
];

export function getICPTemplate(id: string): ICPTemplate | undefined {
  return ICP_TEMPLATES.find((t) => t.id === id);
}
