import "./index.scss";
import * as React from "react";
import { compose, pure } from "recompose";
import { SyntheticWindow, Dependency } from "paperclip";
import { PreviewLayerComponent } from "./preview-layer";
import { ToolsLayerComponent } from "./tools-layer";

export type CanvasOuterProps = {
  window: SyntheticWindow;
  dependency: Dependency;
}

const BaseCanvasComponent = ({ window, dependency }: CanvasOuterProps) => <div className="m-canvas">
  <PreviewLayerComponent window={window} dependency={dependency} />
  <ToolsLayerComponent />
</div>;

export const CanvasComponent = compose<CanvasOuterProps, CanvasOuterProps>(pure)(BaseCanvasComponent);