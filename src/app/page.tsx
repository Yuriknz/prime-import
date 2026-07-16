import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Texas Beer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Setup do projeto concluído. Módulos de comanda e poker chegam nas próximas fases.</p>
          <p className="font-money text-primary">{formatCurrency(0)}</p>
          <p className="text-sm">{formatDateTime(new Date())}</p>
        </CardContent>
      </Card>
    </div>
  );
}
