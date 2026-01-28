import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Conta criada com sucesso!");
        navigate("/");
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setIsLoading(true);
    try {
      await signIn(userEmail, userPassword);
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="p-8 space-y-6 bg-card rounded-xl border border-border shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Conto Management System
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Crie sua conta" : "Faça login para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Já tem uma conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>

        {/* Demo Users Card */}
        <div className="p-6 bg-card/50 rounded-xl border border-border/50">
          <Alert className="mb-4 bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Demonstração:</strong> Use um dos usuários abaixo para testar o sistema.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left"
              onClick={() => quickLogin("admin@conto.com.br", "admin123")}
              disabled={isLoading}
            >
              <span className="font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">admin@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left"
              onClick={() => quickLogin("gestor@conto.com.br", "gestor123")}
              disabled={isLoading}
            >
              <span className="font-medium">Gestor</span>
              <span className="text-xs text-muted-foreground">gestor@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left"
              onClick={() => quickLogin("comercial@conto.com.br", "comercial123")}
              disabled={isLoading}
            >
              <span className="font-medium">Comercial</span>
              <span className="text-xs text-muted-foreground">comercial@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left"
              onClick={() => quickLogin("analista@conto.com.br", "analista123")}
              disabled={isLoading}
            >
              <span className="font-medium">Analista</span>
              <span className="text-xs text-muted-foreground">analista@conto.com.br</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
