'use client';

import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import SiteLayout from '../site/layout';

export default function PrivacyPage() {
  const privacyItems = [
    {
      title: 'Veri Toplama',
      content: 'Web sitemizde kullanıcı deneyimini iyileştirmek amacıyla sadece gerekli veriler toplanmaktadır. Bu veriler arasında iletişim formu bilgileri ve çerezler yer almaktadır.'
    },
    {
      title: 'Veri Kullanımı',
      content: 'Toplanan veriler yalnızca hizmet sağlama, iletişim kurma ve yasal yükümlülükleri yerine getirme amacıyla kullanılmaktadır. Verileriniz üçüncü taraflarla paylaşılmaz.'
    },
    {
      title: 'Çerezler',
      content: 'Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.'
    },
    {
      title: 'Veri Güvenliği',
      content: 'Kişisel verilerinizin güvenliği bizim için önemlidir. Verilerinizi korumak için endüstri standardı güvenlik önlemleri uygulamaktayız.'
    },
    {
      title: 'Haklarınız',
      content: 'Kişisel verilerinize erişme, düzeltme, silme ve işlemeyi sınırlandırma hakkına sahipsiniz. Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.'
    }
  ];

  return (
    <SiteLayout>
      <div className="flex min-h-full flex-1 flex-col bg-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-16 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" aria-hidden="true" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Gizlilik Politikası
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              Kişisel verilerinizin güvenliği ve gizliliği bizim için önceliklidir
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content — flex-1: footer öncesi boşlukta beyaz layout zemini görünmez */}
      <section className="flex-1 bg-slate-900 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            {privacyItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 backdrop-blur-sm sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 text-center text-sm text-slate-400"
          >
            Son güncelleme: 2024
          </motion.div>
        </div>
      </section>
      </div>
    </SiteLayout>
  );
}
