import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat dashboard...">
      {/* Welcome & CTA */}
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="h-4 w-28 skeleton rounded-md" />
          <div className="h-9 w-72 sm:w-96 skeleton rounded-xl" />
          <div className="h-5 w-60 skeleton rounded-md" />
        </div>
        <div className="h-12 w-36 skeleton rounded-2xl" />
      </div>

      {/* Perjalananmu (5 steps) */}
      <section className="card p-5 sm:p-7 flex flex-col gap-5">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="h-6 w-32 skeleton rounded-md" />
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="flex-1 h-2 rounded-full skeleton" />
            <div className="w-8 h-4 skeleton rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 p-[18px] rounded-2xl border border-line bg-white">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl skeleton" />
                <div className="w-14 h-6 rounded-full skeleton" />
              </div>
              <div>
                <div className="h-3 w-16 skeleton rounded mb-1.5" />
                <div className="h-4 w-28 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main & Sidebar layout */}
      <div className="flex flex-wrap gap-7 items-start">
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-7">
          {/* Next Step Card */}
          <section className="card p-5 sm:p-7 flex flex-col gap-5">
            <div className="flex justify-between gap-4 flex-wrap items-start">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-7 w-72 sm:w-96 skeleton rounded-lg" />
                <div className="h-6 w-64 skeleton rounded-full mt-1" />
              </div>
              <div className="h-11 w-28 skeleton rounded-xl" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-bg flex flex-col gap-2">
                  <div className="w-4 h-4 rounded-full skeleton" />
                  <div className="h-3 w-14 skeleton rounded" />
                </div>
              ))}
            </div>
          </section>

          {/* Rekap hasilmu */}
          <section className="flex flex-col gap-4">
            <div className="h-6 w-32 skeleton rounded-md" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card flex flex-col gap-3.5">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 skeleton rounded" />
                    <div className="h-3 w-10 skeleton rounded" />
                  </div>
                  <div className="h-5 w-40 skeleton rounded-md" />
                  <div className="h-4 w-32 skeleton rounded" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    <div className="h-7 w-20 rounded-full skeleton" />
                    <div className="h-7 w-24 rounded-full skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Activity Feed */}
        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div className="h-5 w-32 skeleton rounded-md" />
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center py-2 border-b border-line last:border-b-0">
                  <div className="w-8 h-8 rounded-full skeleton flex-none" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 w-full skeleton rounded" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function KnowSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat kuis potensi...">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-4 w-32 skeleton rounded-md" />
        <div className="h-9 w-80 skeleton rounded-xl" />
        <div className="h-5 w-full skeleton rounded-md" />
      </div>

      <div className="flex flex-wrap gap-7 items-start">
        <section className="card flex-[999_1_480px] min-w-0 p-5 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-7 w-64 skeleton rounded-lg" />
            <div className="h-4 w-96 skeleton rounded" />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-11 w-28 rounded-full skeleton" />
            ))}
          </div>

          <div className="flex justify-between items-center gap-3 pt-6 border-t border-line">
            <div className="h-11 w-24 skeleton rounded-xl" />
            <div className="h-11 w-28 skeleton rounded-xl" />
          </div>
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div className="h-4 w-28 skeleton rounded" />
            <div className="flex items-center gap-3.5">
              <div className="w-[52px] h-[52px] rounded-2xl skeleton" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-36 skeleton rounded" />
                <div className="h-4 w-24 skeleton rounded" />
              </div>
            </div>
            <div className="h-20 w-full rounded-xl skeleton mt-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function GrowSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat rencana belajar...">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-4 w-32 skeleton rounded-md" />
        <div className="h-9 w-80 skeleton rounded-xl" />
        <div className="h-5 w-full skeleton rounded-md" />
      </div>

      <div className="card p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl skeleton" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-6 w-48 skeleton rounded-md" />
          </div>
        </div>
        <div className="h-10 w-32 rounded-xl skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 skeleton rounded" />
              <div className="h-4 w-12 skeleton rounded" />
            </div>
            <div className="h-6 w-32 skeleton rounded-md" />
            <div className="h-2 w-full skeleton rounded-full" />
          </div>
        ))}
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <div className="h-6 w-40 skeleton rounded-md" />
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-line flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-md skeleton flex-none" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-4 w-48 skeleton rounded" />
                <div className="h-3 w-64 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CandidateCardsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Mencari kandidat partner...">
      {[...Array(3)].map((_, i) => (
        <article key={i} className="card p-5 sm:p-6 flex flex-wrap gap-5 items-start">
          <div className="w-14 h-14 rounded-full skeleton flex-none" />
          <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-2.5">
            <div className="h-5 w-40 skeleton rounded" />
            <div className="h-4 w-48 skeleton rounded" />
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="h-7 w-20 rounded-full skeleton" />
              <div className="h-7 w-24 rounded-full skeleton" />
              <div className="h-7 w-20 rounded-full skeleton" />
            </div>
            <div className="h-14 w-full rounded-xl skeleton mt-1" />
          </div>
          <div className="flex flex-col items-end gap-3 ml-auto">
            <div className="h-8 w-16 skeleton rounded-lg" />
            <div className="h-10 w-24 skeleton rounded-xl" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function ConnectSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat rekomendasi partner...">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-4 w-32 skeleton rounded-md" />
        <div className="h-9 w-80 skeleton rounded-xl" />
        <div className="h-5 w-full skeleton rounded-md" />
      </div>

      {/* Team status banner */}
      <div className="card p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-32 skeleton rounded" />
            <div className="h-3.5 w-48 skeleton rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-9 h-9 rounded-full skeleton" />
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-full skeleton flex-none" />
        ))}
      </div>

      {/* Candidate cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full skeleton" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-28 skeleton rounded" />
                    <div className="h-3 w-36 skeleton rounded" />
                  </div>
                </div>
                <div className="h-6 w-14 rounded-full skeleton" />
              </div>
              <div className="h-12 w-full rounded-xl skeleton" />
              <div className="flex flex-wrap gap-1.5 mt-1">
                <div className="h-6 w-16 rounded-full skeleton" />
                <div className="h-6 w-20 rounded-full skeleton" />
              </div>
            </div>
            <div className="h-10 w-full rounded-xl skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreateSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat kanvas proyek...">
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2 max-w-[720px]">
          <div className="h-4 w-28 skeleton rounded-md" />
          <div className="h-4 w-32 skeleton rounded-md" />
          <div className="h-9 w-80 skeleton rounded-xl" />
          <div className="h-5 w-full skeleton rounded-md" />
        </div>
        <div className="h-14 w-44 rounded-[14px] skeleton" />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        {/* Section Tabs */}
        <div className="flex-[1_1_220px] min-w-0 bg-white border border-line rounded-[20px] p-3 flex lg:flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-xl skeleton" />
          ))}
        </div>

        {/* Editor Area */}
        <div className="card flex-[999_1_460px] min-w-0 p-5 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-7 w-48 skeleton rounded-lg" />
            <div className="h-4 w-96 skeleton rounded" />
          </div>

          <div className="h-44 w-full rounded-[14px] skeleton" />
          <div className="h-14 w-full rounded-2xl skeleton" />
          <div className="h-28 w-full rounded-2xl skeleton" />

          <div className="flex justify-between gap-3 pt-4 border-t border-line">
            <div className="h-11 w-28 skeleton rounded-xl" />
            <div className="h-11 w-36 skeleton rounded-xl" />
          </div>
        </div>

        {/* Project Meta Aside */}
        <aside className="flex-[1_1_270px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-11 w-full skeleton rounded-xl" />
            <div className="h-11 w-full skeleton rounded-xl" />
            <div className="h-16 w-full skeleton rounded-xl mt-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ImpactSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat skor kesiapan...">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-4 w-32 skeleton rounded-md" />
        <div className="h-9 w-80 skeleton rounded-xl" />
        <div className="h-5 w-full skeleton rounded-md" />
      </div>

      <div className="card p-7 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full skeleton flex-none" />
          <div className="flex flex-col gap-2">
            <div className="h-7 w-48 skeleton rounded-lg" />
            <div className="h-4 w-64 skeleton rounded" />
          </div>
        </div>
        <div className="h-12 w-40 rounded-xl skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 skeleton rounded" />
              <div className="h-5 w-12 skeleton rounded" />
            </div>
            <div className="h-2.5 w-full skeleton rounded-full" />
            <div className="h-12 w-full skeleton rounded-xl mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat pengaturan...">
      <div className="h-9 w-48 skeleton rounded-xl" />

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Profile Card */}
        <div className="card flex flex-col gap-5">
          <div className="h-6 w-24 skeleton rounded" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
          <div className="h-11 w-32 skeleton rounded-xl mt-2" />
        </div>

        {/* Privacy & Account */}
        <div className="flex flex-col gap-6">
          <div className="card flex flex-col gap-4">
            <div className="h-6 w-24 skeleton rounded" />
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-32 skeleton rounded" />
                <div className="h-4 w-64 skeleton rounded" />
              </div>
              <div className="w-14 h-8 rounded-full skeleton flex-none" />
            </div>
          </div>

          <div className="card flex flex-col gap-4">
            <div className="h-6 w-32 skeleton rounded" />
            <div className="h-4 w-48 skeleton rounded" />
            <div className="flex gap-3">
              <div className="h-11 w-36 rounded-xl skeleton" />
              <div className="h-11 w-24 rounded-xl skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillsSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat daftar skill...">
      <div className="flex flex-col gap-2 max-w-[760px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-9 w-48 skeleton rounded-xl" />
        <div className="h-5 w-80 skeleton rounded-md" />
      </div>

      <section className="card p-5 sm:p-7 flex flex-col gap-5">
        <div className="h-12 w-full skeleton rounded-xl" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-full skeleton flex-none" />
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-36 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
        <div className="flex flex-wrap gap-2.5 pt-2">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="h-11 w-32 rounded-full skeleton" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function RolesSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat daftar peran...">
      <div className="flex flex-col gap-2 max-w-[760px]">
        <div className="h-4 w-28 skeleton rounded-md" />
        <div className="h-9 w-56 skeleton rounded-xl" />
        <div className="h-5 w-96 skeleton rounded-md" />
      </div>

      <section className="card p-5 sm:p-7 flex flex-col gap-5">
        <div className="h-12 w-full skeleton rounded-xl" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-full skeleton flex-none" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-40 skeleton rounded" />
                <div className="h-6 w-16 rounded-full skeleton" />
              </div>
              <div className="h-4 w-full skeleton rounded" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <div className="h-6 w-16 rounded-full skeleton" />
                <div className="h-6 w-20 rounded-full skeleton" />
                <div className="h-6 w-14 rounded-full skeleton" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GenericSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat halaman...">
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="h-4 w-32 skeleton rounded-md" />
          <div className="h-9 w-64 sm:w-80 skeleton rounded-xl" />
          <div className="h-5 w-48 skeleton rounded-md" />
        </div>
        <div className="h-12 w-36 skeleton rounded-xl" />
      </div>

      <div className="card p-5 sm:p-7 flex flex-col gap-6">
        <div className="flex justify-between items-center gap-4">
          <div className="h-6 w-36 skeleton rounded-md" />
          <div className="h-4 w-48 skeleton rounded-full" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-bg border border-line p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl skeleton" />
                <div className="w-14 h-5 rounded-full skeleton" />
              </div>
              <div className="h-4 w-24 skeleton rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
