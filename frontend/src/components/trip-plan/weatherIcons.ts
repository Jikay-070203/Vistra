export function weatherIcon(temperatures: number[], precipitation: number[], timeOfDay: 'day' | 'night') {
  const temperature = average(temperatures);
  const rainProbability = average(precipitation);
  if (temperature === null || rainProbability === null) return 'not-available';
  if (rainProbability >= 55) return temperature <= 0 ? 'snow' : 'rain';
  if (rainProbability >= 20) return `partly-cloudy-${timeOfDay}-${temperature <= 0 ? 'snow' : 'rain'}`;
  if (temperature <= 10) return 'thermometer-colder';
  if (temperature >= 30) return 'thermometer-warmer';
  return `clear-${timeOfDay}`;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
