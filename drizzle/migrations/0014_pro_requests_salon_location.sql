ALTER TABLE public.pro_requests ADD COLUMN IF NOT EXISTS salon_location text;

COMMENT ON COLUMN public.pro_requests.salon_location IS 'Endereço completo do salão informado no cadastro profissional (obrigatório no formulário)';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  bd date;
  pt text := new.raw_user_meta_data->>'proof_type';
  pn text := regexp_replace(coalesce(new.raw_user_meta_data->>'proof_number',''), '\D', '', 'g');
  sl text := nullif(new.raw_user_meta_data->>'salon_location','');
begin
  begin bd := nullif(new.raw_user_meta_data->>'birth_date','')::date; exception when others then bd := null; end;
  insert into public.profiles (id, name, email, phone, cpf, birth_date)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email,
          nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.raw_user_meta_data->>'cpf', ''), bd)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if new.raw_user_meta_data->>'account_intent' = 'profissional' and pt in ('cnpj','mei') and pn ~ '^[0-9]{14}$' then
    insert into public.pro_requests (user_id, proof_type, proof_number, document_path, salon_location)
    values (new.id, pt::public.proof_type, pn, new.id::text || '/sem-arquivo', sl);
  end if;
  return new;
end;
$$;