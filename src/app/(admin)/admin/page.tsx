import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECOES = [
  { href: "/admin/relatorios", titulo: "Relatórios", descricao: "Vendas, produto mais vendido, comissão e fechamento de poker." },
  { href: "/admin/produtos", titulo: "Produtos", descricao: "Cardápio: cadastrar, editar preço e disponibilidade." },
  { href: "/admin/mesas", titulo: "Mesas", descricao: "Cadastrar e remover mesas do salão." },
  { href: "/admin/usuarios", titulo: "Usuários", descricao: "Criar contas, ajustar role e ativar/desativar." },
];

export default function AdminHomePage() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      {SECOES.map((secao) => (
        <Link key={secao.href} href={secao.href}>
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle>{secao.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-1 text-sm text-muted-foreground">{secao.descricao}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
