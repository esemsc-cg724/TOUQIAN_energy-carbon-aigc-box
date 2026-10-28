import { describe, expect, it } from 'vitest';
import { selectInitiationAssets, type InitiationAssetSnapshot } from './initiation-assets';

describe('initiation image source binding', () => {
  const snapshot: InitiationAssetSnapshot = {
    projectCode: 'P', status: 'loaded', assets: [
      {assetId: 'current', url: 'blob:current', caption: 'current', sourceFileId: 'file', sourceVersion: 2, sourceType: 'PROJECT_INITIATION_REPORT'},
      {assetId: 'old', url: 'blob:old', caption: 'old', sourceFileId: 'file', sourceVersion: 1, sourceType: 'PROJECT_INITIATION_REPORT'},
      {assetId: 'other', url: 'blob:other', caption: 'other', sourceFileId: 'other-file', sourceVersion: 2, sourceType: 'PROJECT_INITIATION_REPORT'},
      {assetId: 'manual', url: 'blob:manual', caption: 'manual', sourceFileId: null, sourceVersion: 2, sourceType: 'MANUAL_OVERRIDE'},
    ],
  };
  it('shows no historical images until the matching report has been read and parsed', () => {
    expect(selectInitiationAssets(snapshot, 'P', undefined, undefined, undefined)).toEqual([]);
    expect(selectInitiationAssets(snapshot, 'Q', 'file', 2, 'READY')).toEqual([]);
    expect(selectInitiationAssets(snapshot, 'P', 'file', 2, 'PROCESSING')).toEqual([]);
    expect(selectInitiationAssets(snapshot, 'P', 'file', 2, 'FAILED')).toEqual([]);
    expect(selectInitiationAssets(snapshot, 'P', 'file', undefined, 'READY')).toEqual([]);
    expect(selectInitiationAssets(snapshot, 'P', 'file', 2, 'READY').map(a => a.assetId)).toEqual(['current']);
  });
});
