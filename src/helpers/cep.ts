export type CepAddress = {
  cep: string;
  state: string;
  city: string;
  street: string;
  source: 'viacep';
};

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const normalized = cep.replace(/\D/g, '');
  if (normalized.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    uf?: string;
    localidade?: string;
    logradouro?: string;
  };

  if (data.erro) {
    return null;
  }

  return {
    cep: data.cep ?? normalized,
    state: data.uf ?? '',
    city: data.localidade ?? '',
    street: data.logradouro ?? '',
    source: 'viacep',
  };
}
