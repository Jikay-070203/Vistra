export const DNA_LABELS: Record<string, string> = {
  cultural_significance: 'Giá trị văn hóa',
  natural_beauty: 'Vẻ đẹp thiên nhiên',
  architectural_diversity: 'Đa dạng kiến trúc',
  historical_value: 'Giá trị lịch sử',
  food_culture: 'Văn hóa ẩm thực',
  adventure: 'Mức độ khám phá',
  relaxation: 'Mức độ thư giãn',
  urban_energy: 'Năng lượng đô thị',
  accessibility: 'Mức độ thuận tiện',

  nature: 'Cảnh quan & Thiên nhiên',
  culture: 'Văn hóa & Di sản bản địa',
  cuisine: 'Ẩm thực & Cà phê bản địa',
};

export function getTravelDnaLabel(key: string, apiLabel?: string): string {
  return DNA_LABELS[key] ?? (apiLabel?.trim() || key.replaceAll('_', ' '));
}
