import { healthResponseSchema } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api';

export function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet('/health', healthResponseSchema),
    retry: false,
  });

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>System status</CardTitle>
        <CardDescription>Web app → Vite proxy → API → SQLite</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {health.isPending && <p className="text-muted-foreground">Checking API…</p>}
        {health.isError && (
          <p className="text-destructive">API unreachable: {health.error.message}</p>
        )}
        {health.isSuccess && (
          <>
            <div className="flex items-center justify-between">
              <span>API</span>
              <Badge>{health.data.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <Badge variant={health.data.database === 'ok' ? 'default' : 'destructive'}>
                {health.data.database}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Uptime</span>
              <span className="text-muted-foreground">
                {Math.round(health.data.uptimeSeconds)} s
              </span>
            </div>
          </>
        )}
        <Button
          variant="outline"
          className="self-start"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
        >
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
