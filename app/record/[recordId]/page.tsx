import { notFound } from "next/navigation";

import RecordDetail from "@/features/record/components/RecordDetail";
import { getMockTravelRecord } from "@/features/record/mockRecords";

interface RecordDetailPageProps {
  params: Promise<{ recordId: string }>;
}

const RecordDetailPage = async ({ params }: RecordDetailPageProps) => {
  const { recordId } = await params;
  const record = getMockTravelRecord(recordId);

  if (!record) notFound();

  return <RecordDetail record={record} />;
};

export default RecordDetailPage;
