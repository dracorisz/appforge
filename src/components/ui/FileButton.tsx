import React from "react";
import { Button, type ButtonProps } from "./Button";

export type FileButtonProps = Omit<ButtonProps, "children" | "onChange" | "onClick" | "type"> & {
  accept?: string;
  children: React.ReactNode;
  multiple?: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

export const FileButton = React.forwardRef<HTMLInputElement, FileButtonProps>(function FileButton(
  { accept, children, disabled, multiple, onChange, ...buttonProps },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const setRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <>
      <input ref={setRef} type="file" accept={accept} multiple={multiple} disabled={disabled} className="sr-only" tabIndex={-1} onChange={onChange} />
      <Button {...buttonProps} disabled={disabled} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
    </>
  );
});
