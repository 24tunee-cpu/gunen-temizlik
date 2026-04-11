'use client';

import { use } from 'react';
import { AdminBlogForm } from '@/components/admin/AdminBlogForm';

export default function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <AdminBlogForm mode="edit" routeSlug={slug} pageTitle="Blog yazısını düzenle" />;
}
