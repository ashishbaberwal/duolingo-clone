import type { SVGProps } from "react";

interface PipMascotProps extends SVGProps<SVGSVGElement> {
  mood?: "cheerful" | "focused";
}

export function PipMascot({
  mood = "cheerful",
  ...props
}: PipMascotProps) {
  return (
    <svg
      viewBox="0 0 180 170"
      role="img"
      aria-label="Pip, the LingoTrail mascot"
      {...props}
    >
      <path
        d="M49 44c-13-17-10-34-7-39 17 5 29 17 34 30 9-3 19-3 28 0 7-15 19-25 35-30 4 17 0 30-8 40 15 14 23 33 23 56 0 38-27 65-64 65s-64-27-64-65c0-24 8-43 23-57Z"
        fill="#58cc02"
      />
      <path
        d="M51 43c-7-11-8-20-7-29 11 6 19 14 24 24l-17 5Zm77-4c5-10 13-18 25-24 0 10-2 19-8 28l-17-4Z"
        fill="#89e219"
      />
      <ellipse cx="66" cy="88" rx="29" ry="32" fill="#fff" />
      <ellipse cx="115" cy="88" rx="29" ry="32" fill="#fff" />
      <circle cx="70" cy="92" r="11" fill="#31451d" />
      <circle cx="111" cy="92" r="11" fill="#31451d" />
      <circle cx="74" cy="87" r="4" fill="#fff" />
      <circle cx="115" cy="87" r="4" fill="#fff" />
      <path
        d="m90 101-15 9 15 12 15-12-15-9Z"
        fill="#ffc800"
        stroke="#e6a500"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {mood === "cheerful" ? (
        <path
          d="M74 130c9 8 23 8 32 0"
          fill="none"
          stroke="#319000"
          strokeLinecap="round"
          strokeWidth="5"
        />
      ) : (
        <path
          d="M76 132c8-5 20-5 28 0"
          fill="none"
          stroke="#319000"
          strokeLinecap="round"
          strokeWidth="5"
        />
      )}
      <path
        d="M31 107c-17 4-24 14-25 24 13 3 24-1 32-9m111-15c17 4 24 14 25 24-13 3-24-1-32-9"
        fill="#89e219"
        stroke="#58cc02"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
    </svg>
  );
}
