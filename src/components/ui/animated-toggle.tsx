import React from 'react';

interface AnimatedToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
}) => {
  return (
    <div className="inline-flex items-center justify-center relative rounded-[50px] p-0.5 bg-gradient-to-b from-[#f0f0f0] to-[#e8e8e8] shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="appearance-none absolute z-10 rounded-[inherit] w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div
        className={`
          flex items-center relative rounded-[50px] w-12 h-6
          shadow-[inset_0_0_2px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)]
          transition-colors duration-[400ms] linear
          ${checked ? 'bg-[#1a1a1a]' : 'bg-[#e8e8e8]'}
        `}
      >
        <div
          className={`
            flex justify-center items-center absolute rounded-full w-5 h-5 bg-[#e8e8e8]
            shadow-[inset_0_-2px_2px_rgba(0,0,0,0.1),inset_0_-4px_2px_rgba(0,0,0,0.2),inset_0_6px_2px_rgba(255,255,255,0.3),0_4px_4px_rgba(0,0,0,0.5)]
            transition-[left] duration-[400ms]
            ${checked ? 'left-[26px]' : 'left-[2px]'}
          `}
        >
          <div className="grid grid-cols-2 gap-0.5 absolute m-auto">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-full w-0.5 h-0.5 bg-gradient-radial from-[#f5f5f5] to-[#c4c4c4]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
