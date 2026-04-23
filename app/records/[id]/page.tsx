import { RecordDetail } from "@/components/record-detail";

type Params = Promise<{ id: string }>;

export default async function RecordPage({ params }: { params: Params }) {
  const { id } = await params;
  return <RecordDetail id={id} />;
}
