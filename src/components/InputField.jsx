import React from 'react';

const InputField = ({ label, field, value, onChange, type = "text" }) => (
    <div className="mb-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">{label}</label>
        <input
            type={type}
            className="w-full bg-background border border-gray-300 dark:border-gray-700 p-2.5 rounded-lg text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={value || ''}
            onChange={e => onChange(field, e.target.value)}
        />
    </div>
);

export default InputField;
