import assert from 'node:assert/strict';
import test from 'node:test';
import { weatherIcon } from './weatherIcons.ts';

test('selects a colored weather icon from average temperature and rain probability', () => {
  assert.equal(weatherIcon([4, 8], [10, 70], 'day'), 'partly-cloudy-day-rain');
  assert.equal(weatherIcon([-2, 0], [20, 30], 'night'), 'partly-cloudy-night-snow');
  assert.equal(weatherIcon([20, 22], [0, 10], 'night'), 'clear-night');
  assert.equal(weatherIcon([8, 10], [0, 10], 'day'), 'thermometer-colder');
  assert.equal(weatherIcon([32, 34], [0, 10], 'day'), 'thermometer-warmer');
  assert.equal(weatherIcon([20], [], 'day'), 'not-available');
});
