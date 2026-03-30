# Criptografia de Campos Sensíveis (CPF)

## Visão Geral

O CPF dos pacientes é criptografado em repouso usando `pgp_sym_encrypt` do módulo `pgcrypto` do PostgreSQL. A chave simétrica é configurada como parâmetro de banco de dados (`app.encryption_key`) e nunca fica exposta no código da aplicação.

- Coluna original: `patients.cpf` (mantida em paralelo durante transição)
- Coluna criptografada: `patients.cpf_encrypted` (base64 de pgp_sym_encrypt)
- Funções DB: `crm_encrypt(text)` / `crm_decrypt(text)`
- View de acesso: `patients_decrypted` (somente `service_role`)

---

## 1. Configurar a Chave de Criptografia

### Opção A — ALTER DATABASE (simples, para desenvolvimento/staging)

```sql
ALTER DATABASE postgres SET app.encryption_key = 'sua-chave-secreta-256bits';
```

> Em produção, gere uma chave forte:
> ```bash
> openssl rand -base64 32
> ```

### Opção B — Supabase Vault (recomendado para produção)

```sql
-- Cria o segredo no Vault
SELECT vault.create_secret('sua-chave-secreta-256bits', 'encryption_key');

-- Referencia o segredo nas funções
-- (adapte crm_encrypt/crm_decrypt para ler do Vault via decrypted_secrets)
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'encryption_key';
```

Após configurar via Vault, atualize as funções `crm_encrypt` e `crm_decrypt` para ler a chave do Vault em vez de `current_setting`.

---

## 2. Rollout Gradual (sem downtime)

A migração foi desenhada para manter as colunas `cpf` e `cpf_encrypted` em paralelo. O fluxo de transição é:

### Fase 1 — Dual-write (atual)
- Novos pacientes: `cpf` e `cpf_encrypted` são gravados simultaneamente pela aplicação.
- Pacientes existentes: `cpf_encrypted` é `null` até a migração de dados ser executada.

### Fase 2 — Migrar dados históricos
Execute no Supabase SQL Editor **após** configurar `app.encryption_key`:

```sql
UPDATE patients
SET cpf_encrypted = crm_encrypt(cpf)
WHERE cpf IS NOT NULL
  AND cpf_encrypted IS NULL;
```

Verifique o resultado:
```sql
SELECT COUNT(*) FILTER (WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL) AS pendentes
FROM patients;
-- deve retornar 0
```

### Fase 3 — Remover coluna plaintext (futuro)
Após validação completa em produção e backup confirmado:

```sql
-- ATENÇÃO: irreversível sem backup
ALTER TABLE patients DROP COLUMN cpf;
```

Atualizar a aplicação para ler `cpf_encrypted` via `crm_decrypt()` ou pela view `patients_decrypted`.

---

## 3. Política de Rotação de Chave

A rotação exige re-criptografar todos os registros. Procedimento:

1. **Nunca apague a chave antiga antes** de re-criptografar tudo.
2. Configure a nova chave em `app.encryption_key_new` (parâmetro temporário).
3. Execute a re-criptografia em lotes:

```sql
-- Adiciona coluna temporária com nova chave
ALTER TABLE patients ADD COLUMN cpf_encrypted_new text;

UPDATE patients
SET cpf_encrypted_new = pgp_sym_encrypt(
  crm_decrypt(cpf_encrypted),           -- descriptografa com chave antiga
  current_setting('app.encryption_key_new', true)  -- criptografa com nova chave
)
WHERE cpf_encrypted IS NOT NULL;

-- Após validação:
ALTER TABLE patients DROP COLUMN cpf_encrypted;
ALTER TABLE patients RENAME COLUMN cpf_encrypted_new TO cpf_encrypted;

-- Atualiza a chave ativa
ALTER DATABASE postgres SET app.encryption_key = '<nova-chave>';
ALTER DATABASE postgres RESET app.encryption_key_new;
```

4. Atualize a configuração do Supabase Vault para apontar para a nova chave.

---

## 4. Segurança da View `patients_decrypted`

A view descriptografa CPF automaticamente. Por isso:

- **Acesso restrito a `service_role`** — nunca exponha para `anon` ou `authenticated`.
- Use apenas em contextos server-side (Next.js server actions/services).
- Nunca selecione `patients_decrypted` em queries do lado do cliente.

---

## 5. Verificação de Integridade

```sql
-- Verifica que encrypt/decrypt é reversível
SELECT
  cpf,
  crm_decrypt(crm_encrypt(cpf)) AS cpf_roundtrip,
  cpf = crm_decrypt(crm_encrypt(cpf)) AS ok
FROM patients
WHERE cpf IS NOT NULL
LIMIT 5;
```
