export type ServiceStatus = 'draft' | 'published';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  photoUrl: string | null;
  iconName: string | null;
  status: ServiceStatus;
  sortOrder: number;
}