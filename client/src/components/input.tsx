import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
}

export const Input: React.FC<TextFieldProps> = ({
  label,
  optional = false,
  className,
  ...props
}) => {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      <input
        className={`input ${className || ""}`}
        {...props}   // ✅ spreads all input props: name, value, onChange, etc.
      />
      {optional && <p className="label">Optional</p>}
    </fieldset>
  );
};
