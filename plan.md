# Copilot Prompt Archive Tool Plan

## Amaç
Yazdığım Copilot promptlarını tek bir Markdown dosyasında toplamak ve bunları zamanla repository kökünde biriktirmek.

## Kapsam
- Markdown tabanlı arşiv.
- İki giriş yolu:
  - terminalden manuel ekleme
  - VS Code tarafında otomatik toplama
- Arşiv dosyası repo kökünde kalacak.

## 3 Katmanlı Mimari
1. Raw katmanı: Ham prompt girişleri. Terminal, stdin ve inbox dosyası bu katmana ait.
2. Archive katmanı: Normalize edilmiş prompt kayıtları. Tüm ham girdiler tek biçimli Markdown kayıtlarına dönüştürülür.
3. Knowledge katmanı: Özetler, kararlar, proje notları ve çapraz proje çıktıları. Bu katman arşivden türetilen daha yüksek seviyeli bilgiyi taşır.

## Tasarım
1. Kök dizinde bir raw inbox tutulacak: `copilot-prompt-inbox.md`.
2. Normalize edilmiş prompt arşivi kök dizinde tutulacak: `copilot-prompts.md`.
3. Türetilmiş bilgi katmanı kök dizinde ayrıca tutulacak: `copilot-knowledge.md`.
4. Her prompt tek bir standart blok olarak archive katmanına eklenecek.
5. Terminal komutu raw girdiyi alıp önce raw katmanında, sonra archive katmanında işlem yapacak.
6. VS Code entegrasyonu aynı append mantığını kullanacak.
7. İki yol da aynı formatlayıcıyı paylaşacak.

## Önerilen Dosyalar
- `plan.md` — bu planın kopyası.
- `copilot-prompt-inbox.md` — raw katman için giriş dosyası.
- `copilot-prompts.md` — prompt arşivi.
- `copilot-knowledge.md` — knowledge katmanı için özet ve karar notları.
- `collect-prompts.js` veya `collect-prompts.ts` — ortak yazma mantığı.
- `package.json` — gerekirse script tanımı için.

## Kayıt Formatı
Her giriş için önerilen yapı:
- tarih/saat
- kaynak: terminal veya VS Code
- prompt metni

Knowledge katmanı için önerilen yapı:
- proje / konu
- kısa özet
- alınan karar
- açık kalan sorular
- ilişkili prompt veya kayıt bağlantıları

## Uygulama Sırası
1. Markdown arşiv dosyasını oluştur.
2. Terminal komutunu yaz.
3. VS Code toplama yolunu ekle.
4. Aynı formatı her iki yolda da kullan.
5. Örnek kayıtlarla doğrula.
