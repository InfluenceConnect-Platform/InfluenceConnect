import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BarChart2,
  Users,
  DollarSign,
  Compass,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const influencerNav: NavItem[] = [
  { label: 'Overview',   href: '/overview',   icon: LayoutDashboard },
  { label: 'Content',    href: '/content',    icon: FileText        },
  { label: 'Create',     href: '/create',     icon: PlusCircle      },
  { label: 'Analytics',  href: '/analytics',  icon: BarChart2       },
  { label: 'Audience',   href: '/audience',   icon: Users           },
  { label: 'Earnings',   href: '/earnings',   icon: DollarSign      },
  { label: 'Discover',   href: '/discover',   icon: Compass         },
  { label: 'Brands',     href: '/brands',     icon: Building2       },
];