import { redirect } from 'next/navigation';

export default function NotFound() {
  // Herhangi bir 404 durumunda kullanıcıyı ana sayfaya yönlendiriyoruz.
  // Bu, yanlış URL'lerin "Bulunamadı (404)" olarak uzun süre görünmesini azaltır.
  redirect('/');
}

