'use client';

import { use } from 'react';
import { AdminServiceForm } from '@/components/admin/AdminServiceForm';

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminServiceForm mode="edit" serviceId={id} pageTitle="Hizmeti düzenle" />;
}
