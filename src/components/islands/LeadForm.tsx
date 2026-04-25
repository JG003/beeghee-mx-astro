import { useState, type FormEvent } from 'react';

interface Props {
  tag?: string;
  placeholder?: string;
  buttonText?: string;
}

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://nqskllzyphlhmuhzpcdy.supabase.co';
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2tsbHp5cGhsaG11aHpwY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDIyMjEsImV4cCI6MjA3ODcxODIyMX0.3Th9Bu441NwQT5C0-Ye9YPW7YnCtY7DGkUdT_iCd_4M';

export default function LeadForm({
  tag = 'mx-landing',
  placeholder = 'Tu correo',
  buttonText = 'Obtener 10% OFF',
}: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/klaviyo-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON}`,
          apikey: SUPABASE_ANON,
        },
        body: JSON.stringify({ email, tag }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Error ${res.status}`);
      }
      setSent(true);
    } catch (err: any) {
      setError('Hubo un problema. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center p-4 bg-accent rounded-lg">
        <p className="text-accent-foreground font-medium">
          ¡Listo! Revisa tu correo para la oferta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
      <input
        className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        required
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Enviando...' : buttonText}
      </button>
      {error && <p className="text-xs text-destructive sm:basis-full">{error}</p>}
    </form>
  );
}
