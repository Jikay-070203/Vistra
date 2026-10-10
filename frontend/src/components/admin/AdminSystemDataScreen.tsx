import SchemaMapViewer from './system/SchemaMapViewer';

export default function AdminSystemDataScreen() {
  return (
    <main className="mx-auto w-full max-w-[1720px] space-y-8 px-4 py-8 sm:px-6 lg:px-12">
      <header className="rounded-3xl border border-[#0E1D4F]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-headline-lg text-2xl font-bold text-[#0E1D4F] sm:text-3xl">Quản trị dữ liệu</h1>
      </header>
      <SchemaMapViewer />
    </main>
  );
}
