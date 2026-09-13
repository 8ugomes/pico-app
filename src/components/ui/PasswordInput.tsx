'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';

export function PasswordInput(props: Omit<InputProps, 'type' | 'trailing' | 'inputRef'>) {
  const [visible, setVisible] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const hide = () => setVisible(false);
    const visibility = () => { if (document.hidden) hide(); };
    form?.addEventListener('reset', hide);
    document.addEventListener('visibilitychange', visibility);
    return () => { form?.removeEventListener('reset', hide); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <Input {...props} inputRef={input} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} trailing={
    <button type="button" className="password-toggle" disabled={props.disabled} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} senha: ${props.label}`} aria-pressed={visible} aria-controls={props.id} onClick={() => setVisible(value => !value)}>
      {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
    </button>
  } />;
}
