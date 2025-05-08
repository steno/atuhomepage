import { ServiceType } from '@/types';

interface ServiceInfo {
  type: ServiceType;
  title: string;
  description: string;
  icon: string;
}

export const SERVICES: ServiceInfo[] = [
  {
    type: 'electrician',
    title: 'Electrician',
    description: 'Electrical repairs, installations, and maintenance',
    icon: 'zap'
  },
  {
    type: 'plumber',
    title: 'Plumber',
    description: 'Plumbing repairs, installations, and maintenance',
    icon: 'droplets'
  },
  {
    type: 'carpenter',
    title: 'Carpenter',
    description: 'Woodworking, furniture repairs, and installations',
    icon: 'hammer'
  },
  {
    type: 'painter',
    title: 'Painter',
    description: 'Interior and exterior painting services',
    icon: 'paintbrush'
  },
  {
    type: 'cleaner',
    title: 'Cleaner',
    description: 'Home cleaning and organization services',
    icon: 'washingMachine'
  },
  {
    type: 'gardener',
    title: 'Gardener',
    description: 'Garden maintenance, landscaping, and plant care',
    icon: 'flower'
  },
  {
    type: 'handyman',
    title: 'Handyman',
    description: 'General home repairs and maintenance',
    icon: 'wrench'
  },
  {
    type: 'other',
    title: 'Other',
    description: 'Other home services',
    icon: 'moreHorizontal'
  }
];