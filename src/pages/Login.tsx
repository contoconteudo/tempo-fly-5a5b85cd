import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      toast.error("O Supabase não está configurado. Verifique as variáveis de ambiente.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, { full_name: fullName });
        toast.success("Verifique seu email para confirmar o cadastro. Após a confirmação, faça login.");
        setIsSignUp(false); // Volta para a tela de login
      } else {
        await signIn(email, password);
        // O redirecionamento é tratado pelo hook useAuth e ProtectedRoute
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <div className="p-6 md:p-8 space-y-5 md:space-y-6 bg-card rounded-xl border border-border shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Conto Management System
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {isSignUp ? "Crie sua conta" : "Faça login para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm">Nome Completo</Label>
                <Input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu Nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 md:h-10"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 md:h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="h-11 md:h-10"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 md:h-10 touch-manipulation" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline touch-manipulation py-2"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Já tem uma conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}