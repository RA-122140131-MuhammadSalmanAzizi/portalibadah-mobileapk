import QuranPageClient from "./QuranPageClient";

export function generateStaticParams() {
    return Array.from({ length: 604 }, (_, i) => ({
        pageNum: (i + 1).toString(),
    }));
}

// Ensure params are treated as a Promise (Next.js 15 Requirement)
export default async function Page({ params }: { params: Promise<{ pageNum: string }> }) {
    const { pageNum } = await params;
    return <QuranPageClient pageNum={pageNum} />;
}
