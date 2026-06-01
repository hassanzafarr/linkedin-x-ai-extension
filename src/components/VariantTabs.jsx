import { useState } from 'react';

export default function VariantTabs({ variants, platform, onSelect }) {
  const [active, setActive] = useState(0);
  if (!variants?.length) return null;

  const labels = ['Story', 'Contrarian', 'Numbers'];

  return (
    <div className="variant-tabs">
      <div className="flex gap-1 mb-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-md">
        {variants.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors ${
              active === i
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {labels[i] || `V${i + 1}`}
          </button>
        ))}
      </div>

      <div className="variant-preview p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800 whitespace-pre-wrap max-h-56 overflow-y-auto dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200">
        {variants[active]}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-zinc-500">
          {variants[active].length} chars · {platform === 'x' ? 'X / Twitter' : 'LinkedIn'}
        </span>
        <button
          className="btn-primary text-xs py-1.5 px-3"
          onClick={() => onSelect(variants[active])}
        >
          Use this variant →
        </button>
      </div>
    </div>
  );
}
