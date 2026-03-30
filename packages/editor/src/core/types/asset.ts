// constants
import type { CORE_EXTENSIONS } from "@/constants/extension";
// plane editor imports
import type { TAdditionalEditorAsset } from "@/plane-editor/types/asset";

export type TEditorImageAsset = {
  href: string;
  id: string;
  name: string;
  src: string;
  type: CORE_EXTENSIONS.IMAGE | CORE_EXTENSIONS.CUSTOM_IMAGE;
};

export type TEditorDrawioAsset = {
  href: string;
  id: string;
  name: string;
  src: string;
  type: CORE_EXTENSIONS.DRAWIO_BLOCK;
};

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type TEditorAsset = TEditorImageAsset | TEditorDrawioAsset | TAdditionalEditorAsset;
