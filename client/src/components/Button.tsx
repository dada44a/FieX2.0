import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "soft"; // optional for different styles
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  // Build class string
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;
  const softClass = variant === "soft" ? "btn-soft" : "";

  return (
    <button className={`${baseClass} ${variantClass} ${softClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
