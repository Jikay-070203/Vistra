import assert from 'node:assert/strict';
import test from 'node:test';
import * as uploadSession from './uploadSession.ts';

test('image analysis stays loading across batch changes and ignores older responses', () => {
  const isBatchReady = uploadSession.isImageBatchReadyForAnalysis;
  const isCurrentAnalysis = uploadSession.isCurrentDnaAnalysisRequest;
  const getStatusAfterBatchChange = uploadSession.getDnaAnalysisStatusAfterBatchChange;

  assert.equal(typeof isBatchReady, 'function');
  assert.equal(typeof isCurrentAnalysis, 'function');
  assert.equal(typeof getStatusAfterBatchChange, 'function');
  assert.equal(isBatchReady([]), false);
  assert.equal(isBatchReady([
    { id: 'one', uploadStatus: 'uploaded', imageUrl: 'https://example.com/one.png' },
    { id: 'two', uploadStatus: 'uploading' },
  ]), false);
  assert.equal(isBatchReady([
    { id: 'one', uploadStatus: 'uploaded', imageUrl: 'https://example.com/one.png' },
    { id: 'two', uploadStatus: 'failed' },
  ]), false);
  assert.equal(isBatchReady([{ id: 'one', uploadStatus: 'uploaded' }]), false);
  const analyzedBatch = [
    { id: 'one', uploadStatus: 'uploaded', imageUrl: 'https://example.com/one.png' },
    { id: 'two', uploadStatus: 'uploaded', imageUrl: 'https://example.com/two.png' },
  ];
  const currentBatch = [...analyzedBatch, { id: 'three', uploadStatus: 'uploading' }];
  assert.equal(isBatchReady(analyzedBatch), true);
  assert.equal(isCurrentAnalysis(4, 4, analyzedBatch, currentBatch), false);
  assert.equal(isCurrentAnalysis(4, 4, analyzedBatch, analyzedBatch), true);
  assert.equal(isCurrentAnalysis(4, 5, analyzedBatch, analyzedBatch), false);
  assert.equal(getStatusAfterBatchChange(false, 2), 'idle');
  assert.equal(getStatusAfterBatchChange(true, 2), 'loading');
  assert.equal(getStatusAfterBatchChange(true, 1), 'loading');
  assert.equal(getStatusAfterBatchChange(true, 0), 'idle');
  assert.equal(getStatusAfterBatchChange(true, 2, true), 'error');
});
