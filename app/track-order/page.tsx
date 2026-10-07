import { PageShell } from '@/components/pixel/page-shell'
import { TrackOrderForm } from '@/components/flow/track-order-form'

export default function TrackOrderPage() {
  return (
    <PageShell
      title="Track My Order"
      subtitle="Check the real-time printing and shipping status of your custom photo book order."
    >
      <TrackOrderForm />
    </PageShell>
  )
}
