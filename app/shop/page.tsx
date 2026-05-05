"use client";

import Link from "next/link";
import { useState } from "react";

export default function ShopPage() {

  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f2eb] text-stone-900">
      {/* HERO */}
      <section className="relative px-6 pb-12 pt-16 text-center">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

        <div className="relative mx-auto max-w-xl">
          <p className="text-xs uppercase tracking-[0.45em] text-stone-400">
            Memoried
          </p>

          <h1 className="mt-5 text-6xl font-semibold leading-[0.95] tracking-[-0.06em]">
            Anılarına dokun.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-stone-600">
            Anılarını yalnızca saklama. Onları dokunulabilir, kalıcı ve
            tekrar yaşanabilir bir objeye dönüştür.
          </p>

        </div>
      </section>

      {/* PRODUCT CARD */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-md rounded-[2.75rem] border border-white/70 bg-white/75 p-5 shadow-[0_40px_100px_rgba(120,90,60,0.18)] backdrop-blur-xl">
        <div className="w-full h-[420px] object-cover rounded-[2.25rem] drop-shadow-xl transition duration-500 hover:scale-[1.02]">
          <img
            src="/magnet.png"
            alt="Memoried Doğal Taş Anı Magneti"
            className="w-full h-[420px] object-cover rounded-[2.25rem] drop-shadow-xl"
          />
        </div>

          <div className="px-2 pb-2 pt-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                  Doğal Taş Anı Magneti
                </p>

                <h2 className="mt-2 text-2xl font-semibold leading-tight">
                  Memoried Stone
                </h2>
              </div>

              <p className="whitespace-nowrap rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                Limited
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-600">
              Fotoğraf, video, yazı ve ses kayıtlarını tek bir zarif hikâyede
              saklayan NFC’li anı objesi.
            </p>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-xs text-stone-400">Başlangıç fiyatı</p>
                <p className="text-3xl font-semibold tracking-tight">
                  ₺749.90
                </p>
              </div>

              <p className="text-right text-xs leading-5 text-stone-500">
                Bir kez oluştur.
                <br />
                Her dokunuşta yeniden yaşa.
              </p>
            </div>

            <Link
              href="/order"
              className="mt-7 block w-full rounded-full bg-stone-950 px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Satın Al
            </Link>

            <p className="mt-4 text-center text-[11px] text-stone-400">
              NFC destekli Doğal Taş Magnet ve Kişisel anı sayfası
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div
          onClick={() => setOpen(true)}
          className="mx-auto max-w-md cursor-zoom-in rounded-[2.75rem] border border-white/70 bg-white/75 p-3 shadow-[0_40px_100px_rgba(120,90,60,0.18)] backdrop-blur-xl"
        >
          <div className="w-full overflow-hidden rounded-[2.25rem]">
            <img
              src="/memoried-shop-info.png"
              alt="Memoried detay"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* FULLSCREEN MODAL */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <img
              src="/memoried-shop-info.png"
              alt="Memoried büyük"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </section>
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-md rounded-[2.5rem] border border-stone-200/60 bg-white/60 p-8 text-center backdrop-blur">

          <h3 className="text-3xl font-semibold leading-tight">
            Bazı anlar kaybolmamalı.
          </h3>

          <p className="mt-5 text-sm leading-7 text-stone-600">
            Memoried, sevdiğin anıları fiziksel bir objeye dönüştürür.
            Fotoğraf, video, yazı ve ses kayıtların tek bir hikâyede saklanır.
            Magneti telefonuna dokundurduğunda, o ana geri dönersin.
          </p>

          <div className="mt-8 space-y-3 text-sm text-stone-700">
            <p>Telefonuna dokun — anıların anında açılır</p>
            <p>Hepsi tek bir yerde, tek bir dokunuşla</p>
            <p>Fiziksel bir obje olarak her zaman yanında</p>
            <p>Unutulmayacak bir hediye deneyimi</p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-md">
          <h3 className="text-center text-2xl font-semibold">Nasıl çalışır?</h3>

          <div className="mt-7 space-y-3">
            {[
              ["01", "Magneti telefonuna dokundur"],
              ["02", "Anı sayfanı oluştur"],
              ["03", "Fotoğraf, video, yazı ve seslerini ekle"],
              ["04", "Her dokunuşta hikâyen açılsın"],
            ].map(([number, text]) => (
              <div
                key={number}
                className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-white/70 p-4 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-950 text-xs font-semibold text-white">
                  {number}
                </span>

                <p className="text-sm text-stone-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      <footer className="px-6 pb-10 text-center text-[10px] uppercase tracking-[0.45em] text-stone-400">
        Memoried © 2026
      </footer>
    </main>
  );
}