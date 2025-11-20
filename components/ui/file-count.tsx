"use client";

import { memo } from "react";

const FileCount = memo(function FileCount({ count }: { count: number }) {
  return (
    <div className="text-[var(--text-main)]">
      Selected:{" "}
      <span className="font-bold text-[var(--accent-gold)]">
        {count} file(s)
      </span>
    </div>
  );
});

export default FileCount;

