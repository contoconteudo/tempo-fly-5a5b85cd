# Regras de Desenvolvimento e Stack Tecnológica (AI_RULES)

Este documento serve como guia para manter a consistência e as melhores práticas no desenvolvimento do Conto CMS.

## 🛠️ Stack Tecnológica

1.  **Framework**: React 18 (com Vite)
2.  **Linguagem**: TypeScript
3.  **Estilização**: Tailwind CSS (abordagem mobile-first e responsiva)
4.  **Componentes UI**: shadcn/ui (construído sobre Radix UI)
5.  **Roteamento**: React Router DOM (rotas centralizadas em `src/App.tsx`)
6.  **Gerenciamento de Estado/Dados**: React Query (`@tanstack/react-query`) para dados assíncronos (API).
7.  **Formulários e Validação**: React Hook Form (`react-hook-form`) para gerenciamento de formulários e Zod (`zod`) para validação de schemas.
8.  **Ícones**: Lucide React (`lucide-react`).
9.  **Notificações**: Sonner (`sonner`) para toasts de feedback ao usuário.

## 📚 Regras de Uso de Bibliotecas

Para garantir a manutenibilidade e a consistência do projeto, siga as seguintes regras:

| Funcionalidade | Biblioteca Obrigatória | Observações |
| :--- | :--- | :--- |
| **UI/Design** | shadcn/ui + Tailwind CSS | Utilize classes Tailwind para todo o estilo. Não crie componentes de UI básicos do zero (ex: Button, Dialog, Input). |
| **Dados Assíncronos** | React Query | Deve ser usado para substituir a persistência via `useLocalStorage` ao integrar com o backend. |
| **Formulários** | React Hook Form | Use para gerenciar o estado e submissão de todos os formulários. |
| **Validação** | Zod | Use para definir os schemas de validação (`src/lib/validations.ts`). |
| **Roteamento** | React Router DOM | Use `Link` e `useNavigate` para navegação. |
| **Ícones** | Lucide React | Use exclusivamente para todos os ícones. |
| **Notificações** | Sonner | Use para exibir mensagens de sucesso, erro ou informação ao usuário (toasts). |

## 📁 Estrutura de Arquivos

*   **Componentes**: `src/components/` (Sempre crie um novo arquivo para cada novo componente).
*   **Páginas**: `src/pages/`
*   **Hooks**: `src/hooks/`
*   **Tipos**: `src/types/`
*   **Utilitários/Constantes**: `src/lib/`