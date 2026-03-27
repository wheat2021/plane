"use client";

import type { FC } from "react";
import { Info } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { SimpleMarkdown } from "./simple-markdown";

type Props = {
  description: string;
  align?: "left" | "right";
};

export const DefaultPropertyTooltip: FC<Props> = ({ description, align = "left" }: Props) => {
  return (
    <Tooltip
      tooltipContent={
        <div className="text-caption-sm-regular text-secondary">
          <SimpleMarkdown text={description} />
        </div>
      }
      position={align === "right" ? "right" : "left"}
      sideOffset={8}
    >
      <Info className="size-3.5 text-custom-text-400 hover:text-custom-text-300 transition-colors" />
    </Tooltip>
  );
};
