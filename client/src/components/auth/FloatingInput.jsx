import React from 'react';

/**
 * Input liquid glass dengan label mengambang: label duduk di tengah saat kosong,
 * naik mengecil saat fokus atau terisi. Mekanismenya bergantung pada
 * placeholder=" " (lihat :placeholder-shown) — jangan diganti placeholder teks.
 */
export default function FloatingInput({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  required = false,
  autoComplete,
  inputMode,
  rightSlot,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="auth-input peer w-full rounded-xl border border-slate-900/[0.08] bg-white/30 pb-2 pl-10 pr-10 pt-6 text-sm text-slate-800 outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-emerald-500/60 focus:bg-white/60 focus:ring-2 focus:ring-emerald-500/20"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-emerald-700 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
      >
        {label}
      </label>
      {Icon && (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-200 peer-focus:text-emerald-600"
        />
      )}
      {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
  );
}
