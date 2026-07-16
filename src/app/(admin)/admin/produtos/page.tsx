import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProdutoDialog } from "./produto-dialog";

const SETOR_LABEL: Record<string, string> = {
  bar: "Bar",
  cozinha: "Cozinha",
  churrasqueira: "Churrasqueira",
};

export default async function ProdutosPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, preco, categoria, setor_destino, disponivel")
    .order("categoria")
    .order("nome");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">Produtos</h2>
        <ProdutoDialog triggerLabel="Novo produto" />
      </div>

      {(produtos?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos?.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>{produto.nome}</TableCell>
                <TableCell>{produto.categoria}</TableCell>
                <TableCell>{SETOR_LABEL[produto.setor_destino]}</TableCell>
                <TableCell className="font-money">{formatCurrency(produto.preco)}</TableCell>
                <TableCell>
                  <Badge variant={produto.disponivel ? "default" : "secondary"}>
                    {produto.disponivel ? "Disponível" : "Indisponível"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ProdutoDialog
                    triggerLabel="Editar"
                    produto={{
                      id: produto.id,
                      nome: produto.nome,
                      preco: Number(produto.preco),
                      categoria: produto.categoria,
                      setorDestino: produto.setor_destino,
                      disponivel: produto.disponivel,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
