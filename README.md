# Cliniq — CRM para Clínicas

Sistema de gestão para clínicas focado em organização de pacientes, agenda, leads e acompanhamento de atendimentos.

O projeto foi desenvolvido com foco em estrutura escalável, separação de responsabilidades e integração com backend moderno.

---

## 🚀 Visão Geral

O Cliniq é um CRM pensado para clínicas que precisam:

- Organizar pacientes e histórico
- Gerenciar agenda de atendimentos
- Acompanhar leads e conversões
- Estruturar dados de forma segura e escalável

A aplicação foi construída seguindo uma arquitetura próxima de produto SaaS.

---

## 🧠 Arquitetura

O projeto segue uma separação clara de responsabilidades:

- `app/` → páginas e rotas (Next.js App Router)
- `components/` → componentes reutilizáveis de UI
- `services/` → regras de negócio e integração com backend
- `lib/` → utilitários, validações e helpers
- `supabase/` → funções e integração com banco de dados
- `types/` → tipagens TypeScript centralizadas

---

## ⚙️ Tecnologias

- Next.js (App Router)
- TypeScript
- Supabase (Auth + Database + Edge Functions)
- PostgreSQL
- TailwindCSS

---

## 🔐 Segurança

- Controle de acesso baseado em perfil de usuário
- Separação de responsabilidades entre camadas
- Estrutura preparada para uso de Row Level Security (RLS)

---

## 📦 Funcionalidades

- Gestão de pacientes
- Controle de agenda
- Organização de leads
- Conversão de leads em pacientes
- Estrutura multi-clínica (preparado para expansão)

---

## 📁 Organização do Código

A estrutura foi pensada para facilitar manutenção e evolução do sistema, evitando acoplamento entre interface e lógica de negócio.

---

## 🚧 Status

Projeto em evolução, com foco em consolidação de funcionalidades e melhoria contínua da arquitetura.

---

## 👨‍💻 Autor

Desenvolvido por Cauã Yoshito  
