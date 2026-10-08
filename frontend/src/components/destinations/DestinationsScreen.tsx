'use client';
import { useDestinationsController } from './useDestinationsController';
import DestinationCard from './DestinationCard';
import DestinationDetailPanel from './DestinationDetailPanel';
import ComparisonDialog from './ComparisonDialog';
export default function DestinationsScreen() {
  const {
    destinations, isLoadingRecommendations, recommendationsError, retryRecommendations,
    selectedForCompare, expandedDetails, showComparisonModal, setShowComparisonModal,
    comparedDestinations, toggleCompare, toggleDetails, handleSelectDestination,
  } = useDestinationsController();
  const expanded = destinations.find(item => item.id === expandedDetails);
  return <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12 pb-28">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#0E1D4F]/10">
      <div><h1 className="font-headline-lg text-2xl sm:text-4xl font-bold text-[#0E1D4F]">Khám phá điểm đến</h1><p className="text-sm text-[#4B5875] mt-3 max-w-2xl">Gợi ý từ danh mục điểm đến đang hoạt động. Dữ liệu cá nhân hóa, dự báo thời tiết và chi phí chưa khả dụng.</p></div>
      <button type="button" disabled={selectedForCompare.length < 2} onClick={() => setShowComparisonModal(true)} className="border border-[#0E1D4F]/15 rounded-xl p-3 text-sm text-[#0E1D4F] bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">So sánh ({selectedForCompare.length}/3)</button>
    </div>
    {isLoadingRecommendations ? <p role="status" className="p-8 bg-white border rounded-2xl mt-8">Đang tải điểm đến...</p> : recommendationsError ? <div role="alert" className="p-8 bg-rose-50 text-rose-900 border border-rose-200 rounded-2xl mt-8"><p>{recommendationsError}</p><button type="button" onClick={retryRecommendations} className="p-3 mt-4 bg-[#205BD6] text-white rounded-xl">Thử lại</button></div> : destinations.length === 0 ? <p className="p-8 bg-white border rounded-2xl mt-8">Danh mục chưa có điểm đến.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-8 items-stretch">
      {destinations.map(dest => <DestinationCard key={dest.id} dest={dest} isSelected={selectedForCompare.includes(dest.id)} compareDisabled={selectedForCompare.length >= 3 && !selectedForCompare.includes(dest.id)} isExpanded={expandedDetails === dest.id} onToggleCompare={toggleCompare} onToggleDetails={toggleDetails} onSelectDestination={handleSelectDestination} />)}
    </div>}
    {expanded && <DestinationDetailPanel key={expanded.id} dest={expanded} onClose={() => toggleDetails(expanded.id)} onSelectDestination={handleSelectDestination} />}
    {showComparisonModal && <ComparisonDialog isOpen={showComparisonModal} comparedDestinations={comparedDestinations} onRemoveDestination={toggleCompare} onClose={() => setShowComparisonModal(false)} onSelectDestination={handleSelectDestination} />}
  </div>;
}
