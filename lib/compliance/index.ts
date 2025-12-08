// Watermark service
export {
  addWatermark,
  requiresWatermark,
  getWatermarkText,
  type WatermarkOptions,
} from './watermark';

// Metadata service
export {
  generateResoMetadata,
  embedMetadata,
  createXmpSidecar,
  type ResoMetadata,
} from './metadata';

// Disclosure service
export {
  generateDisclosure,
  generateShortDisclosure,
  generatePhotoDescription,
  type DisclosureOptions,
} from './disclosure';

// MLS specifications
export {
  getMlsSpec,
  getMlsOptions,
  validateForMls,
  MLS_SPECS,
  type MlsSpec,
} from './mls-specs';

// MLS export
export {
  generateMlsExportPackage,
  type ExportPhoto,
  type MlsExportOptions,
  type ExportResult,
} from './mls-export';
